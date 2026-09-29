import os
import numpy as np
import xarray as xr
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from .evaluation_framework import ThunderstormMetrics, split_dataset_chronologically

class TemporalWeatherDataset(Dataset):
    """
    Dataset that returns sequences of data for spatiotemporal models.
    """
    def __init__(self, ds: xr.Dataset, feature_vars, target_var, seq_len=4):
        self.ds = ds
        self.times = ds.time.values
        self.feature_vars = feature_vars
        self.target_var = target_var
        self.seq_len = seq_len
        
        print(f"Loading temporal data into memory for {len(self.times)} timesteps...")
        
        c = len(feature_vars)
        t = len(self.times)
        h = len(ds.latitude)
        w = len(ds.longitude)
        
        self.X = np.zeros((t, c, h, w), dtype=np.float32)
        for i, var in enumerate(feature_vars):
            self.X[:, i, :, :] = ds[var].values
            
        self.y = ds[target_var].values.astype(np.float32)

    def __len__(self):
        # We need a full sequence to predict the target
        return len(self.times) - self.seq_len

    def __getitem__(self, idx):
        # X sequence: from idx to idx + seq_len
        x_seq = self.X[idx : idx + self.seq_len]
        # target: matches the end of the sequence (target_step_plus_1 represents the future of the last input step)
        y = self.y[idx + self.seq_len - 1]
        
        x_seq = np.nan_to_num(x_seq, nan=0.0)
        y = np.nan_to_num(y, nan=0.0)
        
        return torch.tensor(x_seq), torch.tensor(y)

class ConvLSTMCell(nn.Module):
    def __init__(self, input_dim, hidden_dim, kernel_size, bias):
        super(ConvLSTMCell, self).__init__()

        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.kernel_size = kernel_size
        self.padding = kernel_size // 2
        self.bias = bias
        
        self.conv = nn.Conv2d(in_channels=self.input_dim + self.hidden_dim,
                              out_channels=4 * self.hidden_dim,
                              kernel_size=self.kernel_size,
                              padding=self.padding,
                              bias=self.bias)

    def forward(self, input_tensor, cur_state):
        h_cur, c_cur = cur_state

        combined = torch.cat([input_tensor, h_cur], dim=1)  # concatenate along channel axis
        combined_conv = self.conv(combined)
        cc_i, cc_f, cc_o, cc_g = torch.split(combined_conv, self.hidden_dim, dim=1)

        i = torch.sigmoid(cc_i)
        f = torch.sigmoid(cc_f)
        o = torch.sigmoid(cc_o)
        g = torch.tanh(cc_g)

        c_next = f * c_cur + i * g
        h_next = o * torch.tanh(c_next)

        return h_next, c_next

    def init_hidden(self, batch_size, image_size):
        height, width = image_size
        device = self.conv.weight.device
        return (torch.zeros(batch_size, self.hidden_dim, height, width, device=device),
                torch.zeros(batch_size, self.hidden_dim, height, width, device=device))


class ConvLSTMModel(nn.Module):
    def __init__(self, in_channels, hidden_channels=32, out_channels=1, kernel_size=3):
        super(ConvLSTMModel, self).__init__()
        
        self.convlstm = ConvLSTMCell(input_dim=in_channels,
                                     hidden_dim=hidden_channels,
                                     kernel_size=kernel_size,
                                     bias=True)
        
        self.final_conv = nn.Conv2d(in_channels=hidden_channels, 
                                    out_channels=out_channels, 
                                    kernel_size=1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # x shape: [B, seq_len, C, H, W]
        b, seq_len, c, h, w = x.size()
        
        h_t, c_t = self.convlstm.init_hidden(b, (h, w))
        
        for t in range(seq_len):
            h_t, c_t = self.convlstm(x[:, t, :, :, :], (h_t, c_t))
            
        # h_t is the hidden state after processing the whole sequence
        out = self.final_conv(h_t)
        return self.sigmoid(out).squeeze(1)


def train_model(model, dataloader, criterion, optimizer, num_epochs=3, device='cpu'):
    model.train()
    for epoch in range(num_epochs):
        epoch_loss = 0
        for i, (inputs, targets) in enumerate(dataloader):
            inputs, targets = inputs.to(device), targets.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {epoch_loss/max(1, len(dataloader)):.4f}")

def run_spatiotemporal_dl():
    print("--- Phase 14: Level 4 Spatiotemporal DL ---")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    zarr_path = os.path.join(base_dir, 'data', 'processed', 'ml_training_data_with_targets.zarr')
    model_dir = os.path.join(base_dir, 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    if not os.path.exists(zarr_path):
        print(f"Data not found at {zarr_path}. Please complete Phase 9.")
        return

    print("Loading data...")
    ds = xr.open_zarr(zarr_path)
    
    print("Splitting dataset chronologically...")
    train_ds, val_ds, test_ds = split_dataset_chronologically(ds, train_ratio=0.7, val_ratio=0.15)
    
    target_var = 'target_step_plus_1'
    feature_vars = [var for var in ds.data_vars if 'target' not in var]
    print(f"Using features: {feature_vars}")
    
    seq_length = 4  # e.g., T-45, T-30, T-15, T
    
    train_dataset = TemporalWeatherDataset(train_ds, feature_vars, target_var, seq_len=seq_length)
    test_dataset = TemporalWeatherDataset(test_ds, feature_vars, target_var, seq_len=seq_length)
    
    if len(train_dataset) == 0 or len(test_dataset) == 0:
        print("Not enough sequences to train. You may need more time steps in the mock data.")
        return
        
    train_loader = DataLoader(train_dataset, batch_size=2, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=2, shuffle=False)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    model = ConvLSTMModel(in_channels=len(feature_vars), hidden_channels=16, out_channels=1).to(device)
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print("Training ConvLSTM Model...")
    train_model(model, train_loader, criterion, optimizer, num_epochs=3, device=device)
    
    print("Evaluating on Test Set...")
    model.eval()
    all_preds = []
    all_probs = []
    all_targets = []
    
    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            
            probs = outputs.cpu().numpy().flatten()
            preds = (probs > 0.5).astype(int)
            targs = targets.cpu().numpy().flatten()
            
            all_probs.extend(probs)
            all_preds.extend(preds)
            all_targets.extend(targs)
            
    if len(all_targets) > 0:
        print("\n--- ConvLSTM Model Results (+1 Step) ---")
        results = ThunderstormMetrics.evaluate_all(np.array(all_targets), np.array(all_preds), np.array(all_probs))
        for k, v in results.items():
            print(f"{k}: {v:.4f}")
    
    model_path = os.path.join(model_dir, 'convlstm_spatiotemporal_level4.pth')
    torch.save(model.state_dict(), model_path)
    print(f"\nModel saved to {model_path}")
    print("--- Phase 14 Complete ---")

if __name__ == "__main__":
    run_spatiotemporal_dl()

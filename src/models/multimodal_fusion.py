import os
import numpy as np
import xarray as xr
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from .evaluation_framework import ThunderstormMetrics, split_dataset_chronologically

class MultimodalWeatherDataset(Dataset):
    """
    Dataset that simulates splitting unified features into different modalities 
    (Radar, Satellite, Atmospheric) for multimodal fusion.
    """
    def __init__(self, ds: xr.Dataset, feature_vars, target_var):
        self.ds = ds
        self.times = ds.time.values
        
        # Arbitrarily split features to simulate multimodality if strict separation doesn't exist
        # In a real scenario, these come from different sources
        num_features = len(feature_vars)
        
        self.radar_vars = feature_vars[:num_features//3] if num_features >= 3 else feature_vars
        self.sat_vars = feature_vars[num_features//3 : 2*num_features//3] if num_features >= 3 else feature_vars
        self.atmos_vars = feature_vars[2*num_features//3:] if num_features >= 3 else feature_vars
        
        print(f"Loading Multimodal data... Radar: {len(self.radar_vars)}, Sat: {len(self.sat_vars)}, Atmos: {len(self.atmos_vars)}")
        
        self.target_var = target_var
        
        t = len(self.times)
        h = len(ds.latitude)
        w = len(ds.longitude)
        
        # Load modalities
        self.radar_X = self._load_vars(ds, self.radar_vars, t, h, w)
        self.sat_X = self._load_vars(ds, self.sat_vars, t, h, w)
        self.atmos_X = self._load_vars(ds, self.atmos_vars, t, h, w)
            
        self.y = ds[target_var].values.astype(np.float32)

    def _load_vars(self, ds, vars_list, t, h, w):
        c = len(vars_list)
        X = np.zeros((t, c, h, w), dtype=np.float32)
        for i, var in enumerate(vars_list):
            X[:, i, :, :] = ds[var].values
        return X

    def __len__(self):
        return len(self.times)

    def __getitem__(self, idx):
        x_radar = np.nan_to_num(self.radar_X[idx], nan=0.0)
        x_sat = np.nan_to_num(self.sat_X[idx], nan=0.0)
        x_atmos = np.nan_to_num(self.atmos_X[idx], nan=0.0)
        
        y = np.nan_to_num(self.y[idx], nan=0.0)
        
        # Simulated second target (Rain Intensity) for multi-task
        # Here we just use the storm probability scaled up to act as a placeholder for rain intensity
        y_rain = y * 5.0 
        
        return {
            'radar': torch.tensor(x_radar),
            'sat': torch.tensor(x_sat),
            'atmos': torch.tensor(x_atmos),
            'target_prob': torch.tensor(y),
            'target_rain': torch.tensor(y_rain)
        }

class ModalityEncoder(nn.Module):
    def __init__(self, in_channels, out_channels):
        super(ModalityEncoder, self).__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_channels, 16, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(16, out_channels, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2)
        )
    def forward(self, x):
        return self.net(x)

class MultimodalFusionNetwork(nn.Module):
    def __init__(self, radar_c, sat_c, atmos_c, fusion_c=32):
        super(MultimodalFusionNetwork, self).__init__()
        
        self.radar_enc = ModalityEncoder(radar_c, fusion_c)
        self.sat_enc = ModalityEncoder(sat_c, fusion_c)
        self.atmos_enc = ModalityEncoder(atmos_c, fusion_c)
        
        # Fusion layer (Concatenation of 3 encoders)
        total_fusion_c = fusion_c * 3
        
        self.decoder = nn.Sequential(
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True),
            nn.Conv2d(total_fusion_c, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 16, kernel_size=3, padding=1),
            nn.ReLU(inplace=True)
        )
        
        # Multi-task heads
        self.head_storm_prob = nn.Sequential(
            nn.Conv2d(16, 1, kernel_size=1),
            nn.Sigmoid()
        )
        self.head_rain_intensity = nn.Sequential(
            nn.Conv2d(16, 1, kernel_size=1),
            nn.ReLU() # Intensity is non-negative
        )

    def forward(self, radar, sat, atmos):
        e_r = self.radar_enc(radar)
        e_s = self.sat_enc(sat)
        e_a = self.atmos_enc(atmos)
        
        # Concatenate modalities along channel dimension
        fused = torch.cat([e_r, e_s, e_a], dim=1)
        
        dec = self.decoder(fused)
        
        # Ensure dimensions match original input (handling odd resolutions if needed)
        if dec.shape[2:] != radar.shape[2:]:
            dec = nn.functional.interpolate(dec, size=radar.shape[2:], mode='bilinear', align_corners=True)
            
        prob = self.head_storm_prob(dec).squeeze(1)
        rain = self.head_rain_intensity(dec).squeeze(1)
        
        return prob, rain


def train_multimodal(model, dataloader, optimizer, num_epochs=3, device='cpu'):
    criterion_prob = nn.BCELoss()
    criterion_rain = nn.MSELoss()
    
    model.train()
    for epoch in range(num_epochs):
        epoch_loss = 0
        for data in dataloader:
            radar = data['radar'].to(device)
            sat = data['sat'].to(device)
            atmos = data['atmos'].to(device)
            target_prob = data['target_prob'].to(device)
            target_rain = data['target_rain'].to(device)
            
            optimizer.zero_grad()
            pred_prob, pred_rain = model(radar, sat, atmos)
            
            loss_prob = criterion_prob(pred_prob, target_prob)
            loss_rain = criterion_rain(pred_rain, target_rain)
            loss = loss_prob + 0.1 * loss_rain # Weighted sum of losses
            
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{num_epochs}, Total Loss: {epoch_loss/max(1, len(dataloader)):.4f}")

def run_multimodal_dl():
    print("--- Phase 15: Level 5 Multimodal Fusion Architecture ---")
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
    
    train_dataset = MultimodalWeatherDataset(train_ds, feature_vars, target_var)
    test_dataset = MultimodalWeatherDataset(test_ds, feature_vars, target_var)
    
    if len(train_dataset) == 0:
        print("Not enough data to train.")
        return
        
    train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=4, shuffle=False)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Initialize Multi-modal network
    model = MultimodalFusionNetwork(
        radar_c=len(train_dataset.radar_vars),
        sat_c=len(train_dataset.sat_vars),
        atmos_c=len(train_dataset.atmos_vars),
        fusion_c=16
    ).to(device)
    
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print("Training Multimodal Fusion Model...")
    train_multimodal(model, train_loader, optimizer, num_epochs=3, device=device)
    
    print("Evaluating on Test Set...")
    model.eval()
    all_preds_prob = []
    all_targets_prob = []
    
    with torch.no_grad():
        for data in test_loader:
            radar = data['radar'].to(device)
            sat = data['sat'].to(device)
            atmos = data['atmos'].to(device)
            target_prob = data['target_prob'].to(device)
            
            pred_prob, _ = model(radar, sat, atmos)
            
            probs = pred_prob.cpu().numpy().flatten()
            targs = target_prob.cpu().numpy().flatten()
            
            all_preds_prob.extend(probs)
            all_targets_prob.extend(targs)
            
    print("\n--- Multimodal Fusion Model Results (+1 Step) ---")
    preds_binary = (np.array(all_preds_prob) > 0.5).astype(int)
    results = ThunderstormMetrics.evaluate_all(np.array(all_targets_prob), preds_binary, np.array(all_preds_prob))
    for k, v in results.items():
        print(f"{k}: {v:.4f}")
    
    model_path = os.path.join(model_dir, 'multimodal_fusion_level5.pth')
    torch.save(model.state_dict(), model_path)
    print(f"\nModel saved to {model_path}")
    print("--- Phase 15 Complete ---")

if __name__ == "__main__":
    run_multimodal_dl()

import os
import numpy as np
import pandas as pd
import xarray as xr
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from .evaluation_framework import ThunderstormMetrics, split_dataset_chronologically

class WeatherDataset(Dataset):
    def __init__(self, ds: xr.Dataset, feature_vars, target_var):
        self.ds = ds
        self.times = ds.time.values
        self.feature_vars = feature_vars
        self.target_var = target_var
        
        print(f"Loading data into memory for {len(self.times)} timesteps...")
        
        c = len(feature_vars)
        t = len(self.times)
        h = len(ds.latitude)
        w = len(ds.longitude)
        
        self.X = np.zeros((t, c, h, w), dtype=np.float32)
        for i, var in enumerate(feature_vars):
            self.X[:, i, :, :] = ds[var].values
            
        self.y = ds[target_var].values.astype(np.float32)

    def __len__(self):
        return len(self.times)

    def __getitem__(self, idx):
        x = self.X[idx]
        y = self.y[idx]
        
        x = np.nan_to_num(x, nan=0.0)
        y = np.nan_to_num(y, nan=0.0)
        
        return torch.tensor(x), torch.tensor(y)

class SimpleUNet(nn.Module):
    """
    A simplified UNet for the 2D spatial weather prediction
    """
    def __init__(self, in_channels, out_channels=1):
        super(SimpleUNet, self).__init__()
        
        self.enc1 = self.conv_block(in_channels, 16)
        self.pool1 = nn.MaxPool2d(2)
        
        self.enc2 = self.conv_block(16, 32)
        self.pool2 = nn.MaxPool2d(2)
        
        self.bottleneck = self.conv_block(32, 64)
        
        self.up2 = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        self.dec2 = self.conv_block(64 + 32, 32)
        
        self.up1 = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
        self.dec1 = self.conv_block(32 + 16, 16)
        
        self.final_conv = nn.Conv2d(16, out_channels, kernel_size=1)
        self.sigmoid = nn.Sigmoid()
        
    def conv_block(self, in_c, out_c):
        return nn.Sequential(
            nn.Conv2d(in_c, out_c, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_c, out_c, kernel_size=3, padding=1),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        e1 = self.enc1(x)
        p1 = self.pool1(e1)
        
        e2 = self.enc2(p1)
        p2 = self.pool2(e2)
        
        b = self.bottleneck(p2)
        
        u2 = self.up2(b)
        if u2.shape != e2.shape:
            u2 = nn.functional.interpolate(u2, size=e2.shape[2:], mode='bilinear', align_corners=True)
            
        d2 = self.dec2(torch.cat([u2, e2], dim=1))
        
        u1 = self.up1(d2)
        if u1.shape != e1.shape:
            u1 = nn.functional.interpolate(u1, size=e1.shape[2:], mode='bilinear', align_corners=True)
            
        d1 = self.dec1(torch.cat([u1, e1], dim=1))
        
        out = self.final_conv(d1)
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
            
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {epoch_loss/len(dataloader):.4f}")

def run_spatial_dl():
    print("--- Phase 13: Level 3 Spatial DL (Vision) ---")
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
    
    train_dataset = WeatherDataset(train_ds, feature_vars, target_var)
    test_dataset = WeatherDataset(test_ds, feature_vars, target_var)
    
    train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=4, shuffle=False)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    model = SimpleUNet(in_channels=len(feature_vars), out_channels=1).to(device)
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print("Training UNet Model...")
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
            
    print("\n--- UNet Model Results (+1 Step) ---")
    results = ThunderstormMetrics.evaluate_all(np.array(all_targets), np.array(all_preds), np.array(all_probs))
    for k, v in results.items():
        print(f"{k}: {v:.4f}")
        
    model_path = os.path.join(model_dir, 'unet_spatial_level3.pth')
    torch.save(model.state_dict(), model_path)
    print(f"\nModel saved to {model_path}")
    print("--- Phase 13 Complete ---")

if __name__ == "__main__":
    run_spatial_dl()

import os
import cv2
import numpy as np
import xarray as xr
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from .evaluation_framework import ThunderstormMetrics, split_dataset_chronologically

def compute_optical_flow_advection(prev_frame, curr_frame):
    """
    Computes dense optical flow using Farneback method and advects the curr_frame.
    Assuming frames are 2D numpy arrays.
    """
    # Normalize to 0-255 for OpenCV optical flow
    def normalize_frame(f):
        f_min, f_max = np.min(f), np.max(f)
        if f_max - f_min == 0:
            return np.zeros_like(f, dtype=np.uint8)
        return (255 * (f - f_min) / (f_max - f_min)).astype(np.uint8)

    prev_u8 = normalize_frame(prev_frame)
    curr_u8 = normalize_frame(curr_frame)

    # Compute Optical Flow
    flow = cv2.calcOpticalFlowFarneback(prev_u8, curr_u8, None, 
                                        pyr_scale=0.5, levels=3, winsize=15, 
                                        iterations=3, poly_n=5, poly_sigma=1.2, flags=0)
    
    # Advect current frame
    h, w = curr_frame.shape
    x, y = np.meshgrid(np.arange(w), np.arange(h))
    
    # map_x and map_y represent where a pixel at (y,x) comes from in the previous frame
    # So to predict the future, we push pixels forward.
    # A simpler approximation for advection: backwards mapping from future to current
    map_x = np.clip(x - flow[..., 0], 0, w - 1).astype(np.float32)
    map_y = np.clip(y - flow[..., 1], 0, h - 1).astype(np.float32)
    
    # Remap
    advected = cv2.remap(curr_frame, map_x, map_y, interpolation=cv2.INTER_LINEAR)
    
    return advected

class PhysicsInformedDataset(Dataset):
    def __init__(self, ds: xr.Dataset, feature_vars, target_var):
        self.ds = ds
        self.times = ds.time.values
        self.feature_vars = feature_vars
        self.target_var = target_var
        
        print(f"Loading data for Physics-Informed ML ({len(self.times)} timesteps)...")
        
        c = len(feature_vars)
        t = len(self.times)
        h = len(ds.latitude)
        w = len(ds.longitude)
        
        self.X = np.zeros((t, c, h, w), dtype=np.float32)
        for i, var in enumerate(feature_vars):
            self.X[:, i, :, :] = ds[var].values
            
        self.y = ds[target_var].values.astype(np.float32)

    def __len__(self):
        return len(self.times) - 1

    def __getitem__(self, idx):
        # We need T-1 and T to compute flow
        x_prev = np.nan_to_num(self.X[idx], nan=0.0)
        x_curr = np.nan_to_num(self.X[idx+1], nan=0.0)
        
        y_true = np.nan_to_num(self.y[idx+1], nan=0.0)
        
        # We assume the first feature (e.g., radar reflectivity or cape) is what we use for flow
        # In a real scenario, this would strictly be Radar Reflectivity (dBZ)
        flow_feature_idx = 0 
        
        adv_pred = compute_optical_flow_advection(x_prev[flow_feature_idx], x_curr[flow_feature_idx])
        
        # The ML model will predict the residual: what the optical flow missed
        residual = y_true - adv_pred
        
        return {
            'x_curr': torch.tensor(x_curr),
            'adv_pred': torch.tensor(adv_pred).unsqueeze(0), # [1, H, W]
            'y_true': torch.tensor(y_true),
            'residual': torch.tensor(residual)
        }

class ResidualNet(nn.Module):
    def __init__(self, in_channels):
        super(ResidualNet, self).__init__()
        
        # Takes current atmospheric state, plus the deterministic advection prediction
        self.net = nn.Sequential(
            nn.Conv2d(in_channels + 1, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 1, kernel_size=3, padding=1)
        )
        
    def forward(self, x_curr, adv_pred):
        # x_curr: [B, C, H, W]
        # adv_pred: [B, 1, H, W]
        combined = torch.cat([x_curr, adv_pred], dim=1)
        residual_pred = self.net(combined).squeeze(1)
        return residual_pred

def train_hybrid_model(model, dataloader, optimizer, num_epochs=3, device='cpu'):
    criterion = nn.MSELoss() # Predicting a residual which can be negative
    
    model.train()
    for epoch in range(num_epochs):
        epoch_loss = 0
        for data in dataloader:
            x_curr = data['x_curr'].to(device)
            adv_pred = data['adv_pred'].to(device)
            target_residual = data['residual'].to(device)
            
            optimizer.zero_grad()
            pred_residual = model(x_curr, adv_pred)
            
            loss = criterion(pred_residual, target_residual)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{num_epochs}, Residual Loss: {epoch_loss/max(1, len(dataloader)):.4f}")

def run_physics_informed():
    print("--- Phase 16: Physics-Informed Hybrids ---")
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
    
    train_dataset = PhysicsInformedDataset(train_ds, feature_vars, target_var)
    test_dataset = PhysicsInformedDataset(test_ds, feature_vars, target_var)
    
    if len(train_dataset) == 0:
        print("Not enough data to train.")
        return
        
    train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=4, shuffle=False)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    model = ResidualNet(in_channels=len(feature_vars)).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print("Training ML Residual Model...")
    train_hybrid_model(model, train_loader, optimizer, num_epochs=3, device=device)
    
    print("Evaluating Physics-Informed Model on Test Set...")
    model.eval()
    
    all_preds = []
    all_targets = []
    
    with torch.no_grad():
        for data in test_loader:
            x_curr = data['x_curr'].to(device)
            adv_pred = data['adv_pred'].to(device)
            y_true = data['y_true'].numpy().flatten()
            
            # Predict residual
            pred_residual = model(x_curr, adv_pred).cpu().numpy()
            
            # Final prediction = Deterministic Advection + ML Residual Correction
            final_pred = data['adv_pred'].squeeze(1).numpy() + pred_residual
            
            # Thresholding for classification
            preds_binary = (final_pred.flatten() > 0.5).astype(int)
            
            all_preds.extend(preds_binary)
            all_targets.extend(y_true)
            
    print("\n--- Physics-Informed Hybrid Model Results (+1 Step) ---")
    
    # We pass dummy probabilities as we are just doing deterministic binary thresholding for this demonstration
    dummy_probs = np.array(all_preds) 
    
    results = ThunderstormMetrics.evaluate_all(np.array(all_targets), np.array(all_preds), dummy_probs)
    for k, v in results.items():
        print(f"{k}: {v:.4f}")
    
    model_path = os.path.join(model_dir, 'physics_informed_level6.pth')
    torch.save(model.state_dict(), model_path)
    print(f"\nModel saved to {model_path}")
    print("--- Phase 16 Complete ---")

if __name__ == "__main__":
    run_physics_informed()

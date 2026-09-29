import os
import numpy as np
import xarray as xr
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torch.cuda.amp import GradScaler, autocast
import mlflow

# Reusing definitions from Phase 14
from .spatiotemporal_dl import TemporalWeatherDataset, ConvLSTMModel
from .evaluation_framework import ThunderstormMetrics, split_dataset_chronologically

def train_model_with_mlops(model, dataloader, criterion, optimizer, scaler, num_epochs=3, device='cpu'):
    model.train()
    
    for epoch in range(num_epochs):
        epoch_loss = 0
        for i, (inputs, targets) in enumerate(dataloader):
            inputs, targets = inputs.to(device), targets.to(device)
            
            optimizer.zero_grad()
            
            # 1. Autocast for Automatic Mixed Precision (AMP)
            with autocast():
                outputs = model(inputs)
                loss = criterion(outputs, targets)
            
            # 2. Scale the loss and call backward to prevent underflow
            scaler.scale(loss).backward()
            
            # 3. Update optimizer via scaler
            scaler.step(optimizer)
            scaler.update()
            
            epoch_loss += loss.item()
            
        avg_loss = epoch_loss / max(1, len(dataloader))
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_loss:.4f}")
        
        # Log to MLflow
        mlflow.log_metric("train_loss", avg_loss, step=epoch)

def run_mlops_pipeline():
    print("--- Phase 17: ML Infrastructure & Tracking ---")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    zarr_path = os.path.join(base_dir, 'data', 'processed', 'ml_training_data_with_targets.zarr')
    model_dir = os.path.join(base_dir, 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    if not os.path.exists(zarr_path):
        print(f"Data not found at {zarr_path}. Please complete Phase 9.")
        return

    # Setup MLflow
    mlflow.set_tracking_uri(f"file://{os.path.join(base_dir, 'mlruns')}")
    mlflow.set_experiment("VAJRA_Spatiotemporal_ConvLSTM")

    print("Loading data...")
    ds = xr.open_zarr(zarr_path)
    
    train_ds, val_ds, test_ds = split_dataset_chronologically(ds, train_ratio=0.7, val_ratio=0.15)
    
    target_var = 'target_step_plus_1'
    feature_vars = [var for var in ds.data_vars if 'target' not in var]
    
    seq_length = 4 
    batch_size = 4
    learning_rate = 0.001
    num_epochs = 3
    hidden_channels = 16
    
    train_dataset = TemporalWeatherDataset(train_ds, feature_vars, target_var, seq_len=seq_length)
    test_dataset = TemporalWeatherDataset(test_ds, feature_vars, target_var, seq_len=seq_length)
    
    if len(train_dataset) == 0:
        print("Not enough sequences to train.")
        return
        
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    model = ConvLSTMModel(in_channels=len(feature_vars), hidden_channels=hidden_channels, out_channels=1).to(device)
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    
    # Initialize Gradient Scaler for Mixed Precision
    scaler = GradScaler()
    
    with mlflow.start_run(run_name="AMP_Training_Run"):
        # Log Hyperparameters
        mlflow.log_param("seq_length", seq_length)
        mlflow.log_param("batch_size", batch_size)
        mlflow.log_param("learning_rate", learning_rate)
        mlflow.log_param("hidden_channels", hidden_channels)
        mlflow.log_param("num_epochs", num_epochs)
        mlflow.log_param("device", str(device))
        
        print("Training ConvLSTM Model with AMP and MLflow...")
        train_model_with_mlops(model, train_loader, criterion, optimizer, scaler, num_epochs=num_epochs, device=device)
        
        print("Evaluating on Test Set...")
        model.eval()
        all_preds = []
        all_probs = []
        all_targets = []
        
        with torch.no_grad():
            for inputs, targets in test_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                
                # Autocast during inference as well
                with autocast():
                    outputs = model(inputs)
                
                probs = outputs.cpu().numpy().flatten()
                preds = (probs > 0.5).astype(int)
                targs = targets.cpu().numpy().flatten()
                
                all_probs.extend(probs)
                all_preds.extend(preds)
                all_targets.extend(targs)
                
        if len(all_targets) > 0:
            print("\n--- Model Results (+1 Step) ---")
            results = ThunderstormMetrics.evaluate_all(np.array(all_targets), np.array(all_preds), np.array(all_probs))
            
            for k, v in results.items():
                print(f"{k}: {v:.4f}")
                # Log metrics to MLflow
                mlflow.log_metric(f"test_{k.lower()}", v)
        
        # Save PyTorch Model internally to MLflow
        # Note: In a real setup you might use mlflow.pytorch.log_model
        model_path = os.path.join(model_dir, 'convlstm_mlops_level4.pth')
        torch.save(model.state_dict(), model_path)
        mlflow.log_artifact(model_path, artifact_path="models")
        print(f"\nModel saved to {model_path} and logged to MLflow.")
        
    print("--- Phase 17 Complete ---")

if __name__ == "__main__":
    run_mlops_pipeline()

import os
import numpy as np
import pandas as pd
import xarray as xr
import xgboost as xgb
from .evaluation_framework import ThunderstormMetrics, split_dataset_chronologically
import joblib

def extract_tabular_features(ds: xr.Dataset, sample_fraction=0.01):
    """
    Flattens spatial dimensions to create tabular ML features.
    Randomly samples to prevent memory overflow during training.
    """
    print(f"Flattening and converting to tabular format (sampling {sample_fraction*100}% of data)...")
    
    # We drop any NaNs (like from edge shifts)
    # Convert dataset to a flattened pandas DataFrame
    df = ds.to_dataframe().dropna().reset_index()
    
    # If it's too large, sample it down for quick training
    if sample_fraction < 1.0:
        df = df.sample(frac=sample_fraction, random_state=42)
        
    return df

def run_classical_ml():
    print("--- Phase 12: Level 1 Classical ML ---")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    zarr_path = os.path.join(base_dir, 'data', 'processed', 'ml_training_data_with_targets.zarr')
    model_dir = os.path.join(base_dir, 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    if not os.path.exists(zarr_path):
        print(f"Data not found at {zarr_path}. Please complete Phase 9.")
        return

    print("Loading data...")
    ds = xr.open_zarr(zarr_path)
    
    # Split chronologically
    print("Splitting dataset chronologically...")
    train_ds, val_ds, test_ds = split_dataset_chronologically(ds, train_ratio=0.7, val_ratio=0.15)
    
    # Define features and targets
    target_var = 'target_step_plus_1'
    feature_vars = [var for var in ds.data_vars if 'target' not in var]
    
    print(f"Using features: {feature_vars}")
    
    # Convert to tabular structure (sampling 5% for speed in this run)
    train_df = extract_tabular_features(train_ds, sample_fraction=0.05)
    test_df = extract_tabular_features(test_ds, sample_fraction=0.05)
    
    if len(train_df) == 0 or len(test_df) == 0:
        print("Not enough data to train.")
        return
        
    X_train = train_df[feature_vars].values
    y_train = train_df[target_var].values.astype(int)
    
    X_test = test_df[feature_vars].values
    y_test = test_df[target_var].values.astype(int)
    
    print(f"Training XGBoost Model on {len(X_train)} samples...")
    # Initialize XGBoost model
    model = xgb.XGBClassifier(
        n_estimators=50, 
        max_depth=4, 
        learning_rate=0.1, 
        use_label_encoder=False, 
        eval_metric='logloss',
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    print("Evaluating on Test Set...")
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    print("\n--- XGBoost Model Results (+1 Step) ---")
    results = ThunderstormMetrics.evaluate_all(y_test, y_pred, y_prob)
    for k, v in results.items():
        print(f"{k}: {v:.4f}")
        
    # Save the model
    model_path = os.path.join(model_dir, 'xgboost_level1.joblib')
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")
    print("--- Phase 12 Complete ---")

if __name__ == "__main__":
    run_classical_ml()

import os
import numpy as np
import xarray as xr
from .evaluation_framework import ThunderstormMetrics, split_dataset_chronologically

class PersistenceModel:
    """
    Level 0 Baseline: Persistence.
    Assumes that the current state will remain identical in the future.
    """
    def __init__(self, target_variable, threshold=35.0):
        self.target_variable = target_variable
        self.threshold = threshold

    def predict(self, X):
        """
        Predicts simply by thresholding the current state variable.
        X is expected to be an xarray Dataset or DataArray.
        """
        # Event is predicted to happen if it's happening right now
        return (X[self.target_variable] > self.threshold).astype(np.int8)

class ClimatologyModel:
    """
    Level 0 Baseline: Climatology.
    Predicts based on the historical average of the target in the training set.
    """
    def __init__(self):
        self.historical_prob = 0.0
        self.historical_prediction = 0

    def fit(self, y_train):
        """
        Calculates the average event occurrence rate in the training data.
        """
        # Mean probability of event happening
        self.historical_prob = float(y_train.mean())
        # Binary prediction (1 if historically it happens > 50% of the time, else 0)
        self.historical_prediction = 1 if self.historical_prob >= 0.5 else 0

    def predict(self, X_shape):
        """
        Returns an array filled with the historically most common class.
        """
        return np.full(X_shape, self.historical_prediction, dtype=np.int8)
        
    def predict_proba(self, X_shape):
        """
        Returns the historical probability for the whole array.
        """
        return np.full(X_shape, self.historical_prob, dtype=np.float32)

def run_baselines():
    print("--- Phase 11: Level 0 Baselines ---")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    zarr_path = os.path.join(base_dir, 'data', 'processed', 'ml_training_data_with_targets.zarr')
    
    if not os.path.exists(zarr_path):
        print(f"Data not found at {zarr_path}. Please complete Phase 9.")
        return

    print("Loading data...")
    ds = xr.open_zarr(zarr_path)
    
    if 'target_step_plus_1' not in ds.data_vars:
        print("Target variables not found in dataset. Ensure Phase 9 generated them.")
        return

    # Using 'cape' as our fallback base variable for mock data as defined in Phase 9
    base_var = 'cape' if 'cape' in ds.data_vars else list(ds.data_vars.keys())[0]

    # Split Data
    print("Splitting dataset chronologically...")
    train_ds, val_ds, test_ds = split_dataset_chronologically(ds, train_ratio=0.7, val_ratio=0.15)
    
    # We will evaluate on the test set for the +1 step horizon
    # Drop NaNs created by shifting at the edge of the dataset
    y_test_true = test_ds['target_step_plus_1'].values.flatten()
    valid_indices = ~np.isnan(y_test_true)
    y_test_true_clean = y_test_true[valid_indices].astype(np.int8)

    if len(y_test_true_clean) == 0:
        print("Not enough valid data in test set to evaluate.")
        return

    print(f"\nEvaluating on Test Set ({len(y_test_true_clean)} valid points)...")
    
    # 1. Evaluate Persistence Model
    persistence_model = PersistenceModel(target_variable=base_var, threshold=35.0)
    y_pred_pers = persistence_model.predict(test_ds).values.flatten()[valid_indices]
    
    print("\n--- Persistence Model Results (+1 Step) ---")
    pers_results = ThunderstormMetrics.evaluate_all(y_test_true_clean, y_pred_pers)
    for k, v in pers_results.items():
        print(f"{k}: {v:.4f}")

    # 2. Evaluate Climatology Model
    climatology_model = ClimatologyModel()
    
    y_train_true = train_ds['target_step_plus_1'].values.flatten()
    y_train_true_clean = y_train_true[~np.isnan(y_train_true)].astype(np.int8)
    
    print("\nFitting Climatology Model on Train Set...")
    climatology_model.fit(y_train_true_clean)
    print(f"Historical probability of event: {climatology_model.historical_prob:.4f}")
    
    y_pred_clim = climatology_model.predict(y_test_true_clean.shape)
    y_prob_clim = climatology_model.predict_proba(y_test_true_clean.shape)
    
    print("\n--- Climatology Model Results (+1 Step) ---")
    clim_results = ThunderstormMetrics.evaluate_all(y_test_true_clean, y_pred_clim, y_prob_clim)
    for k, v in clim_results.items():
        print(f"{k}: {v:.4f}")

    print("\n--- Phase 11 Complete ---")

if __name__ == "__main__":
    run_baselines()

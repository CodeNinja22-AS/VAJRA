import os
import xarray as xr
import numpy as np

def define_targets():
    print("--- Phase 9: Defining ML Target Variables ---")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    zarr_path = os.path.join(base_dir, 'data', 'processed', 'ml_training_data.zarr')
    target_zarr_path = os.path.join(base_dir, 'data', 'processed', 'ml_training_data_with_targets.zarr')
    
    if not os.path.exists(zarr_path):
        print(f"Zarr store not found at {zarr_path}. Please run Phase 8 first.")
        return
        
    print(f"Loading Zarr store from {zarr_path}...")
    ds = xr.open_zarr(zarr_path)
    
    # Check available variables
    print("Available variables:", list(ds.data_vars.keys()))
    
    # We want to create binary thunderstorm occurrence labels for horizons +15, +30, +60 min
    # Assuming uniform time steps, we can use the time dimension.
    # If time steps are 15 mins apart, shift=-1 means +15 mins.
    # Let's dynamically check time delta if possible, or just assume 15 min steps.
    
    if 'time' not in ds.dims:
        print("Error: 'time' dimension not found.")
        return
        
    # We will use 'reflectivity' as the primary indicator for thunderstorms.
    # If not present, we will try to use another variable or just create a dummy one if this is mock data.
    target_var = 'reflectivity'
    if target_var not in ds.data_vars:
        print(f"'{target_var}' not found in dataset. Using a fallback or mock logic.")
        # If no reflectivity, let's create a dummy target variable based on some other var or random
        var_to_use = list(ds.data_vars.keys())[0] if ds.data_vars else None
        if var_to_use:
            print(f"Using '{var_to_use}' as proxy for target generation.")
            base_data = ds[var_to_use]
        else:
            print("No variables available to generate targets.")
            return
    else:
        base_data = ds[target_var]
        
    # Define Thunderstorm threshold (e.g., > 35 dBZ)
    threshold = 35.0
    
    print(f"Creating binary target variable based on threshold > {threshold}...")
    # 1 for event, 0 for no event
    binary_event = (base_data > threshold).astype(np.int8)
    
    # Let's assume 15-minute time steps for shifting (1 step = 15m, 2 = 30m, 4 = 60m)
    # If the time step is actually 1 hour, shift=1 is +60m. 
    # For now, we will create generic shift variables and label them as +1 step, +2 steps, +4 steps.
    
    ds_with_targets = ds.copy()
    
    print("Generating labels for future horizons...")
    # +1 time step
    ds_with_targets['target_step_plus_1'] = binary_event.shift(time=-1)
    # +2 time steps
    ds_with_targets['target_step_plus_2'] = binary_event.shift(time=-2)
    # +4 time steps
    ds_with_targets['target_step_plus_4'] = binary_event.shift(time=-4)
    
    # Drop NaNs that occur at the end of the time series due to shifting (optional, or keep and mask during training)
    # We will keep them for now, but ML pipeline needs to drop or ignore them.
    
    print(f"Writing updated dataset to {target_zarr_path}...")
    import shutil
    if os.path.exists(target_zarr_path):
        shutil.rmtree(target_zarr_path)
        
    # Chunking for targets
    ds_with_targets = ds_with_targets.chunk({'time': min(ds.sizes['time'], 24)})
    
    ds_with_targets.to_zarr(target_zarr_path, consolidated=True)
    print("--- Phase 9 Complete: Target Variables Defined and Saved ---")
    
if __name__ == "__main__":
    define_targets()

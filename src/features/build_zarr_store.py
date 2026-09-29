import os
import glob
import xarray as xr
import dask
import pandas as pd

def build_zarr_store():
    print("--- Phase 8: Building Chunked Zarr Store for ML Training ---")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    processed_dir = os.path.join(base_dir, 'data', 'processed')
    zarr_path = os.path.join(processed_dir, 'ml_training_data.zarr')
    
    radar_dir = os.path.join(processed_dir, 'radar')
    sat_dir = os.path.join(processed_dir, 'satellite')
    nwp_dir = os.path.join(processed_dir, 'nwp')
    
    datasets = []
    
    # 1. Load Processed Radar Data
    radar_files = glob.glob(os.path.join(radar_dir, "*.nc"))
    if radar_files:
        print(f"Loading {len(radar_files)} Radar files...")
        ds_radar = xr.open_mfdataset(radar_files, combine='by_coords', chunks={'time': 1, 'latitude': 250, 'longitude': 250})
        datasets.append(ds_radar)
    else:
        print("No processed Radar data found. Skipping.")
        
    # 2. Load Processed Satellite Data
    sat_files = glob.glob(os.path.join(sat_dir, "*.nc"))
    if sat_files:
        print(f"Loading {len(sat_files)} Satellite files...")
        ds_sat = xr.open_mfdataset(sat_files, combine='by_coords', chunks={'time': 1, 'latitude': 250, 'longitude': 250})
        datasets.append(ds_sat)
    else:
        print("No processed Satellite data found. Skipping.")
        
    # 3. Load Processed NWP Data (ERA5)
    nwp_files = glob.glob(os.path.join(nwp_dir, "*.nc"))
    if nwp_files:
        print(f"Loading {len(nwp_files)} NWP files...")
        ds_nwp = xr.open_mfdataset(nwp_files, combine='by_coords', chunks={'time': 1, 'latitude': 250, 'longitude': 250})
        
        # Ensure it has 'time' dimension if it only has 'valid_time'
        if 'valid_time' in ds_nwp.coords and 'time' not in ds_nwp.dims:
             ds_nwp = ds_nwp.rename({'valid_time': 'time'})
             
        # Optional: Upsample ERA5 (typically hourly) to the target 15-minute or 30-minute interval if needed.
        # Here we just keep it as is, Xarray merge handles exact matching coordinates.
        datasets.append(ds_nwp)
    else:
        print("No processed NWP data found. Skipping.")
        
    # 4. Merge all datasets along coordinates (time, latitude, longitude)
    if not datasets:
        print("No data available to build Zarr store.")
        return
        
    print("Merging datasets...")
    try:
        # Merge datasets (outer join preserves all times, ffill/bfill can be applied later in ML pipeline)
        # Using compat='override' to force merge even if some variable attributes differ
        ds_merged = xr.merge(datasets, join='outer', compat='override')
        
        # 5. Define Chunking Strategy for ML
        # ML typically consumes smaller spatial chunks across time, or full spatial slices for CNNs.
        # We chunk 24 timestamps, and 250x250 spatial blocks (good for out-of-core CNNs).
        print("Applying chunking strategy for out-of-core ML training...")
        
        # Ensure dimensions exist before chunking
        chunk_dict = {}
        if 'time' in ds_merged.dims:
            chunk_dict['time'] = min(ds_merged.sizes['time'], 24)
        if 'latitude' in ds_merged.dims:
             chunk_dict['latitude'] = min(ds_merged.sizes['latitude'], 250)
        if 'longitude' in ds_merged.dims:
             chunk_dict['longitude'] = min(ds_merged.sizes['longitude'], 250)
             
        ds_chunked = ds_merged.chunk(chunk_dict)
        
        # 6. Save to Zarr
        print(f"Writing to Zarr store at {zarr_path}...")
        
        # Remove existing Zarr store to overwrite
        import shutil
        if os.path.exists(zarr_path):
            shutil.rmtree(zarr_path)
            
        ds_chunked.to_zarr(zarr_path, consolidated=True)
        print("--- Zarr Store Built Successfully ---")
        print(ds_chunked)
        
    except Exception as e:
        print(f"Error during merge/write: {e}")

if __name__ == "__main__":
    build_zarr_store()

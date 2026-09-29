import os
import xarray as xr
import pandas as pd

def build_master_grid():
    print("--- Building Master Spatiotemporal Grid ---")
    data_dir = os.path.join(os.path.dirname(__file__), '../../data/raw')
    processed_dir = os.path.join(os.path.dirname(__file__), '../../data/processed')
    zarr_path = os.path.join(processed_dir, 'master_grid.zarr')
    
    era5_path = os.path.join(data_dir, 'era5_extracted/data_stream-oper_stepType-instant.nc')
    
    if not os.path.exists(era5_path):
        print("Raw ERA5 data not found. Run ingestion scripts first.")
        return
        
    print("1. Loading ERA5 raw data...")
    ds_era5 = xr.open_dataset(era5_path)
    
    # Rename 'valid_time' to 'time' if necessary for standard indexing
    if 'valid_time' in ds_era5.coords:
        ds_era5 = ds_era5.rename({'valid_time': 'time'})
    
    # 2. Define Master Grid Spatial Resolution (0.1 degree ~ 10km)
    print("2. Resampling spatially to 0.1 degree EPSG:4326...")
    new_lats = pd.Index(pd.Series(ds_era5.latitude.values).round(1).unique())
    new_lons = pd.Index(pd.Series(ds_era5.longitude.values).round(1).unique())
    
    # 3. Define Master Grid Temporal Resolution (1-hour)
    print("3. Upsampling temporal resolution to 1-hour via linear interpolation...")
    # ds_era5 is 3-hourly. We upsample to 1H.
    ds_era5_hourly = ds_era5.resample(time="1h").interpolate("linear")
    
    # Since we dropped radar, the master grid right now is strictly ERA5 features 
    # (IMD is daily so we'll use it later as target labels rather than input features).
    master_grid = ds_era5_hourly
    
    # 4. Save to Zarr
    print(f"4. Saving to chunked Zarr store at {zarr_path}...")
    # Chunking strategy: 24 hours of time, full spatial domain for efficient spatial convolution
    master_grid = master_grid.chunk({'time': 24, 'latitude': -1, 'longitude': -1})
    master_grid.to_zarr(zarr_path, mode='w')
    
    print("--- Master Grid Successfully Built ---")
    print(master_grid)

if __name__ == "__main__":
    build_master_grid()

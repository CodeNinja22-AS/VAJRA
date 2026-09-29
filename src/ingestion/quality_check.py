import os
import xarray as xr
import pandas as pd
import numpy as np

def check_era5_quality(era5_path):
    print("\n--- ERA5 Data Quality Check ---")
    if not os.path.exists(era5_path):
        print(f"File not found: {era5_path}")
        return
        
    ds = xr.open_dataset(era5_path)
    
    # 1. Temporal Continuity
    times = pd.to_datetime(ds.valid_time.values)
    expected_diff = pd.Timedelta(hours=3) # Based on our sample frequency
    diffs = np.diff(times)
    gaps = np.where(diffs != expected_diff)[0]
    
    print(f"Total Time Steps: {len(times)}")
    if len(gaps) == 0:
        print("[OK] Temporal Continuity: Perfect (No missing 3-hour intervals).")
    else:
        print(f"[FAIL] Temporal Continuity: Found {len(gaps)} gaps in sequence.")
        
    # 2. Spatial Boundaries
    lats = ds.latitude.values
    lons = ds.longitude.values
    print(f"Spatial Extent: Latitudes {lats.min()} to {lats.max()}, Longitudes {lons.min()} to {lons.max()}")
    
    # 3. Missing Data (NaNs)
    # Check a key variable
    if 'cape' in ds.variables:
        nan_count = int(np.isnan(ds['cape'].values).sum())
        total_count = ds['cape'].size
        print(f"NaN Check (CAPE): {nan_count} missing values out of {total_count} ({nan_count/total_count:.2%})")
        if nan_count > 0:
            print("   -> Heuristic Recommendation: ERA5 missing data is usually near terrain edges. We will apply spatial interpolation (e.g., IDW) for small gaps.")

def check_imd_quality(data_dir, year):
    print("\n--- IMD Data Quality Check ---")
    import imdlib as imd
    
    try:
        data_rain = imd.open_data('rain', year, year, 'yearwise', data_dir)
        ds_rain = data_rain.get_xarray()
        
        times = ds_rain.time.values
        print(f"Total Days available: {len(times)}")
        
        rain_values = ds_rain['rain'].values
        nan_count = int(np.isnan(rain_values).sum())
        total_count = rain_values.size
        print(f"NaN Check (Rainfall): {nan_count} missing values out of {total_count} ({nan_count/total_count:.2%})")
        if nan_count > 0:
            print("   -> Heuristic Recommendation: IMD rainfall masks the ocean with NaNs. We should keep the land mask intact or fill ocean pixels with 0 if required by ML models.")
            
    except Exception as e:
        print(f"Could not load IMD data for {year}: {e}")

if __name__ == "__main__":
    data_dir = os.path.join(os.path.dirname(__file__), '../../data/raw')
    era5_file = os.path.join(data_dir, 'era5_extracted/data_stream-oper_stepType-instant.nc')
    
    check_era5_quality(era5_file)
    check_imd_quality(data_dir, 2023)
    print("\n--- Quality Check Complete ---")

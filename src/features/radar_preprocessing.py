import os
import glob
import pyart
import numpy as np
import xarray as xr

def process_radar_file(radar_file_path, output_dir, grid_shape=(1, 500, 500), grid_limits=((0, 15000), (-250000.0, 250000.0), (-250000.0, 250000.0))):
    """
    Process a single raw polar radar file to a Cartesian grid NetCDF file.
    """
    print(f"Processing {radar_file_path}...")
    try:
        # 1. Read the radar data
        radar = pyart.io.read(radar_file_path)
    except Exception as e:
        print(f"Error reading {radar_file_path}: {e}")
        return None

    # 2. Clutter filtering / Dealiasing (Optional/Basic)
    # Applying a simple gate filter to remove noise
    gatefilter = pyart.filters.GateFilter(radar)
    gatefilter.exclude_transition()
    
    # Exclude values with low reflectivity (e.g. below 0 dBZ)
    if 'reflectivity' in radar.fields:
        gatefilter.exclude_below('reflectivity', 0)
    
    # 3. Gridding (Reprojecting polar PPI to Cartesian Grid)
    print("Gridding radar data...")
    grid = pyart.map.grid_from_radars(
        (radar,),
        gatefilters=(gatefilter,),
        grid_shape=grid_shape,
        grid_limits=grid_limits,
        fields=['reflectivity'] if 'reflectivity' in radar.fields else None
    )

    # Convert Py-ART Grid to xarray dataset for saving
    ds = grid.to_xarray()
    
    # Generate output filename
    base_name = os.path.basename(radar_file_path)
    out_name = os.path.splitext(base_name)[0] + "_gridded.nc"
    out_path = os.path.join(output_dir, out_name)
    
    # 4. Save to NetCDF
    print(f"Saving gridded data to {out_path}...")
    ds.to_netcdf(out_path)
    return out_path

def run_radar_pipeline(raw_dir, processed_dir):
    print("--- Starting Radar Preprocessing Pipeline ---")
    if not os.path.exists(processed_dir):
        os.makedirs(processed_dir)
        
    radar_files = glob.glob(os.path.join(raw_dir, "*"))
    
    if not radar_files:
        print(f"No radar files found in {raw_dir}. Please place raw radar data there.")
        return
        
    for rf in radar_files:
        # Ignore subdirectories
        if os.path.isfile(rf):
            process_radar_file(rf, processed_dir)
            
    print("--- Pipeline Completed ---")

if __name__ == "__main__":
    # Define paths
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    raw_radar_dir = os.path.join(base_dir, 'data', 'raw', 'radar')
    processed_radar_dir = os.path.join(base_dir, 'data', 'processed', 'radar')
    
    # Ensure raw directory exists (so the user knows where to put data)
    if not os.path.exists(raw_radar_dir):
        os.makedirs(raw_radar_dir)
        print(f"Created {raw_radar_dir}. Please add raw radar files here.")
        
    run_radar_pipeline(raw_radar_dir, processed_radar_dir)

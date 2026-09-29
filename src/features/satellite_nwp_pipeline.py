import os
import glob
import h5py
import numpy as np
import xarray as xr
import pandas as pd

def process_insat_3ds(insat_file_path, output_dir, grid_shape=(500, 500)):
    """
    Process INSAT-3DS HDF5 file. Extracts TIR, WV, SWIR channels and calculates Cloud Top Temperature (CTT).
    """
    print(f"Processing Satellite File: {insat_file_path}")
    try:
        with h5py.File(insat_file_path, 'r') as h5f:
            # Assuming standard MOSDAC INSAT-3D/3DS L1B/L1C structure
            # Example groups/datasets (will need adjustment based on actual keys)
            # keys might be something like: 'IMG_TIR1', 'IMG_TIR2', 'IMG_WV', 'IMG_SWIR'
            
            extracted_data = {}
            for channel in ['IMG_TIR1', 'IMG_WV', 'IMG_SWIR']:
                if channel in h5f:
                    data = np.array(h5f[channel])
                    extracted_data[channel] = data
                else:
                    # Try to search for it or mock if not present for development
                    pass
            
            # Simple Cloud Top Temperature (CTT) derived from Thermal IR (TIR1)
            # Typically TIR1 digital counts are converted to radiance then brightness temperature
            # For this pipeline, assuming we can derive CTT proxy if TIR1 exists:
            if 'IMG_TIR1' in extracted_data:
                # Placeholder: Convert digital count to Brightness Temperature using LUT/calibration coefficients
                # ctt = calibration_function(extracted_data['IMG_TIR1'])
                ctt = extracted_data['IMG_TIR1'] * 1.0 # Mock conversion
                extracted_data['CTT'] = ctt

            # Convert to xarray (mocking lat/lon grids for now since actual projection requires full INSAT LUTs)
            if extracted_data:
                shape = list(extracted_data.values())[0].shape
                lats = np.linspace(5.0, 40.0, shape[0])
                lons = np.linspace(65.0, 100.0, shape[1])
                
                ds = xr.Dataset(
                    data_vars={
                        k: (["latitude", "longitude"], v) for k, v in extracted_data.items()
                    },
                    coords={
                        "latitude": lats,
                        "longitude": lons,
                    }
                )
                
                # Interpolate to common grid shape
                print("Interpolating Satellite data to common grid...")
                new_lats = np.linspace(5.0, 40.0, grid_shape[0])
                new_lons = np.linspace(65.0, 100.0, grid_shape[1])
                ds_interp = ds.interp(latitude=new_lats, longitude=new_lons, method="nearest")

                base_name = os.path.basename(insat_file_path)
                out_name = os.path.splitext(base_name)[0] + "_processed.nc"
                out_path = os.path.join(output_dir, out_name)
                
                print(f"Saving processed Satellite data to {out_path}")
                ds_interp.to_netcdf(out_path)
                return out_path
            else:
                print("No standard channels found in the file.")
                return None
    except Exception as e:
        print(f"Failed to process {insat_file_path}: {e}")
        return None

def process_era5_nwp(era5_file_path, output_dir, grid_shape=(500, 500)):
    """
    Process ERA5 NetCDF file, extracting CAPE, shear, and wind.
    """
    print(f"Processing ERA5 File: {era5_file_path}")
    try:
        ds = xr.open_dataset(era5_file_path)
        
        # Ensure standard coordinate names
        if 'valid_time' in ds.coords:
            ds = ds.rename({'valid_time': 'time'})
            
        # Target Variables (u10, v10, cape, shear)
        # Assuming the file contains some or all of these standard short names: 'u10', 'v10', 'cape', 'cx'
        # We will interpolate these to the common grid
        print("Interpolating ERA5 data to common grid...")
        new_lats = np.linspace(5.0, 40.0, grid_shape[0])
        new_lons = np.linspace(65.0, 100.0, grid_shape[1])
        
        ds_interp = ds.interp(latitude=new_lats, longitude=new_lons, method="linear")
        
        base_name = os.path.basename(era5_file_path)
        out_name = os.path.splitext(base_name)[0] + "_processed.nc"
        out_path = os.path.join(output_dir, out_name)
        
        print(f"Saving processed ERA5 data to {out_path}")
        ds_interp.to_netcdf(out_path)
        return out_path
    except Exception as e:
        print(f"Failed to process {era5_file_path}: {e}")
        return None

def run_pipeline():
    print("--- Starting Satellite & NWP Preprocessing Pipeline ---")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    
    sat_raw_dir = os.path.join(base_dir, 'data', 'raw', 'satellite')
    sat_proc_dir = os.path.join(base_dir, 'data', 'processed', 'satellite')
    nwp_raw_dir = os.path.join(base_dir, 'data', 'raw', 'era5_extracted')
    nwp_proc_dir = os.path.join(base_dir, 'data', 'processed', 'nwp')
    
    for d in [sat_raw_dir, sat_proc_dir, nwp_raw_dir, nwp_proc_dir]:
        os.makedirs(d, exist_ok=True)
        
    # Process Satellite
    sat_files = glob.glob(os.path.join(sat_raw_dir, "*.h5"))
    if not sat_files:
        print(f"No satellite files found in {sat_raw_dir}. Please add INSAT HDF5 files.")
    for sf in sat_files:
        process_insat_3ds(sf, sat_proc_dir)
        
    # Process NWP
    nwp_files = glob.glob(os.path.join(nwp_raw_dir, "*.nc"))
    if not nwp_files:
        print(f"No NWP files found in {nwp_raw_dir}. Please run ERA5 ingestion.")
    for nf in nwp_files:
        process_era5_nwp(nf, nwp_proc_dir)

    print("--- Pipeline Completed ---")

if __name__ == "__main__":
    run_pipeline()

import os
import imdlib as imd

def download_imd_sample():
    output_dir = os.path.join(os.path.dirname(__file__), '../../data/raw')
    os.makedirs(output_dir, exist_ok=True)
    
    start_yr = 2023
    end_yr = 2023
    
    print(f"Downloading IMD Gridded Rainfall Data for {start_yr}...")
    # This downloads .grd files to the specified directory.
    # We use daily rainfall data as ground truth / secondary observation validation.
    imd.get_data('rain', start_yr, end_yr, fn_format='yearwise', file_dir=output_dir)
    print("IMD Rainfall Data Downloaded.")
    
    print(f"Downloading IMD Gridded Max Temperature Data for {start_yr}...")
    imd.get_data('tmax', start_yr, end_yr, fn_format='yearwise', file_dir=output_dir)
    print("IMD Max Temp Data Downloaded.")

if __name__ == "__main__":
    download_imd_sample()

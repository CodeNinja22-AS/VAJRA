import os
import cdsapi
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

def download_era5_sample():
    # Connect to Copernicus using the key from .env
    c = cdsapi.Client(
        url=os.environ.get("CDSAPI_URL"), 
        key=os.environ.get("CDSAPI_KEY")
    )
    
    output_dir = os.path.join(os.path.dirname(__file__), '../../data/raw')
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'era5_india_sample_july2023.nc')
    
    print(f"Downloading ERA5 sample data to {output_file}...")
    
    # Define a bounding box around India: North: 38, West: 68, South: 6, East: 98
    c.retrieve(
        'reanalysis-era5-single-levels',
        {
            'product_type': 'reanalysis',
            'variable': [
                'convective_available_potential_energy',
                'total_precipitation',
                '10m_u_component_of_wind',
                '10m_v_component_of_wind',
                '2m_temperature'
            ],
            'year': '2023',
            'month': '07',
            'day': ['01', '02', '03', '04', '05', '06', '07'],
            'time': [
                '00:00', '03:00', '06:00', '09:00',
                '12:00', '15:00', '18:00', '21:00'
            ],
            'area': [38, 68, 6, 98],
            'format': 'netcdf',
        },
        output_file)
    print("ERA5 Download Complete.")

if __name__ == "__main__":
    download_era5_sample()

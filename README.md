# VAJRA (Vision-Aided Joint Radar & Atmospheric Nowcasting)

**AI-Powered Multi-Modal Thunderstorm & Lightning Nowcasting System**

## Core Objective
Fuse radar, INSAT satellite, lightning, surface observations, and atmospheric/NWP data to detect developing convective cells and predict their **location, movement, intensity, and lightning/thunderstorm probability from 15 to 120 minutes ahead.**

## Architecture Overview
VAJRA employs a multi-modal data fusion engine to build a Spatio-temporal AI nowcasting model. 

```
                VAJRA
                  │
        ┌─────────┼─────────┐
      RADAR   SATELLITE  LIGHTNING
        │         │         │
        └─────────┼─────────┘
                  │
         ATMOSPHERIC STATE
                  │
        ┌─────────┼─────────┐
       AWS       NWP      ERA5
        │         │         │
        └─────────┼─────────┘
                  │
                  ▼
          DATA FUSION ENGINE
                  │
                  ▼
         SPATIO-TEMPORAL AI
                  │
           ┌──────┼──────┐
         STORM LIGHTNING RAIN
         PROB.   PROB. INTENSITY
           │      │      │
           └──────┼──────┘
                  ▼
            STORM TRACKING
                  │
                  ▼
          15/30/60/120 min
                  │
                  ▼
           GIS WARNING MAP
```

## Tech Stack
- **Data & Geospatial**: Python, NumPy, Pandas, xarray, NetCDF4, HDF5 / h5py, Rasterio, GeoPandas, PostGIS
- **Machine Learning**: PyTorch, scikit-learn, XGBoost, OpenCV, CNN, ConvLSTM, Temporal Transformer
- **Backend & APIs**: FastAPI, PostgreSQL, Redis
- **Frontend & GIS**: React / Next.js, TypeScript, MapLibre / Mapbox, Leaflet
- **Deployment**: Docker, GPU inference, Nginx

*For full project context and roadmap, see [Project Context](docs/project_context.md)*

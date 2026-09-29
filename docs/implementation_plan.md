# VAJRA: 20-Phase Implementation Plan

Based on the master technical blueprint, this roadmap breaks down the development of the VAJRA Nowcasting System into 20 executable phases across 5 major tracks.

## Track A: Data Acquisition & Validation
**Phase 1: Project Setup & Credentialing**
- Set up repository structure and Python environment (`uv` / virtualenv).
- Register for required APIs (MOSDAC, Copernicus CDS for ERA5, NASA Earthdata).
- Set up access keys and environment variables.

**Phase 2: Historical Data Spike**
- Write extraction scripts to download a small, overlapping historical sample (e.g., 1 week of a specific monsoon month).
- Target: ERA5 (hourly), INSAT-3DS (30-min), and any available IMD DWR radar samples.

**Phase 3: Exploratory Data Analysis (EDA) & Parsing**
- Parse complex formats: HDF5 (Satellite), NetCDF (ERA5), ODIM_H5/CfRadial (Radar).
- Visualize raw layers in Jupyter notebooks.

**Phase 4: Data Quality & Gap Analysis**
- Identify missing timeframes and spatial boundary issues.
- Establish heuristics for handling missing data (masking, forward-filling).

## Track B: Data Engineering & Pipeline
**Phase 5: Spatiotemporal Gridding Strategy**
- Define the common India-centric Cartesian grid (e.g., 0.02° ~ 2km resolution).
- Establish the temporal synchronization strategy (e.g., 15-minute or 30-minute intervals).

**Phase 6: Radar Preprocessing Pipeline**
- Implement `Py-ART` / `xradar` pipelines.
- Reproject polar radar data (PPI/CAPPI) to the common Cartesian grid.
- Apply clutter filtering and dealiasing.

**Phase 7: Satellite & NWP Pipeline**
- Process INSAT-3DS channels (TIR, WV, SWIR).
- Extract derived features (Cloud-top temperature).
- Interpolate ERA5 atmospheric features (CAPE, shear, winds) to the common grid.

**Phase 8: Zarr Storage Architecture**
- Implement `xarray` and `Dask` to write the aligned multi-dimensional arrays (time × lat × lon × variables) into a chunked `Zarr` store for out-of-core ML training.

## Track C: Labeling & Baseline Modeling
**Phase 9: Target Variable Definition**
- Define strict ML labels for prediction horizons (+15, +30, +60 min).
- E.g., Binary thunderstorm occurrence (Reflectivity > 35 dBZ or Lightning > 0).

**Phase 10: Evaluation Framework**
- Implement custom metrics suitable for rare-event forecasting: CSI, POD, FAR, F1-Score, Brier Score, and PR-AUC.
- Create train/validation/test splits (e.g., chronologically by year/month, avoiding data leakage).

**Phase 11: Level 0 Baselines**
- Implement Persistence Model (current state = future state).
- Implement Climatology Model (historical averages).
- Evaluate against Phase 10 metrics to establish the skill floor.

**Phase 12: Level 1 Classical ML**
- Engineer flattened tabular features from spatial neighborhoods.
- Train XGBoost / Random Forest models to predict storm probability.

## Track D: Advanced Deep Learning
**Phase 13: Level 3 Spatial DL (Vision)**
- Treat synchronous data slices as multi-channel images.
- Train a U-Net or ResNet to classify the next time step using spatial context.

**Phase 14: Level 4 Spatiotemporal DL**
- Implement Recurrent Convolutional networks (ConvLSTM or PredRNN).
- Train on sequential data blocks (e.g., T-60 to T) to predict future grids.

**Phase 15: Level 5 Multimodal Fusion Architecture**
- Build independent encoders for Radar, Satellite, and Atmospheric data.
- Implement a fusion layer (concatenation or cross-attention) leading into a multi-task prediction head (Storm Prob, Rain Intensity).

**Phase 16: Physics-Informed Hybrids**
- Implement optical flow (e.g., OpenCV Farneback) for deterministic radar echo advection.
- Train the ML model to predict *residuals* (corrections) to the optical flow, ensuring physics-grounded predictions.

## Track E: MLOps, Backend & UI
**Phase 17: ML Infrastructure & Tracking**
- Integrate `MLflow` or `Weights & Biases` for experiment tracking.
- Setup mixed-precision training (PyTorch AMP) and distributed data parallel (DDP) if using multiple GPUs.

**Phase 18: Model Serving & Backend API**
- Export the best performing model to ONNX or TorchScript.
- Build a `FastAPI` service with endpoints for data ingestion and `/predict`.
- Integrate `PostgreSQL/PostGIS` for metadata and storm cell tracking.

**Phase 19: Frontend GIS Dashboard**
- Develop a `Next.js` frontend.
- Integrate `MapLibre` / `Leaflet` to render raster overlays (radar/satellite) and vector storm tracks.

**Phase 20: Explainability & Deployment**
- Implement Explainable AI (SHAP / Grad-CAM) to generate feature importance maps.
- Implement Monte Carlo dropout for uncertainty estimation.
- Containerize the stack (Docker) and prepare the SIH presentation deliverables.

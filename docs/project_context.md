# VAJRA - Project Context & Vision

> **Vision-Aided Joint Radar & Atmospheric Nowcasting**
> 
> *Original Context Provided on 2026-09-29*

## 1. What is actually expected
The goal is to build a short-term severe-weather prediction system. Not "will it rain tomorrow?", but rather: "Given what is happening right now, where is a thunderstorm/lightning event likely to occur in the next 15-120 minutes, how intense will it be, and how will it move?"

Intended inputs:
- Doppler Weather Radar
- INSAT satellite observations (INSAT-3DS)
- Lightning detection networks
- AWS / automatic weather observations
- Surface & upper-air observations
- Thermodynamic indices
- NWP / model forecasts

## 2. Multi-Modal Spatiotemporal Data Fusion
This is not a simple tabular ML model. It involves:
- **Radar**: Where precipitation/storm cells are and their structure.
- **Satellite**: Cloud development, cooling tops, moisture evolution.
- **Lightning**: Where electrical activity is occurring.
- **AWS**: Temp, pressure, humidity, wind.
- **NWP/model**: Expected atmospheric state.

## 3. Data Strategy
**Layer A - Official Indian Data**
- **MOSDAC**: INSAT-3DS L1B/L1C imagery, IR/WV/VIS channels.
- **IMD APIs**: District nowcast information for validation and weak supervision.

**Fallback Strategy**
- **ERA5**: Hourly global atmospheric reanalysis.
- **NASA TRMM LIS**: Historical lightning observations.

## 4. Modeling Approach
1. **Baseline**: XGBoost/LightGBM using weather features to predict thunderstorm probability.
2. **Temporal Model**: LSTM/GRU processing weather time series.
3. **Spatial Model**: CNN extracting features from radar/satellite frames.
4. **Target Architecture**: ConvLSTM + Feature Fusion across multiple modalities to produce multi-task outputs (storm prob, lightning prob, rain intensity, storm movement).

## 5. System Features
- **Multi-horizon predictions**: +15, +30, +45, +60, +90, +120 minutes.
- **Storm Tracking**: Radar segmentation, optical flow for physical extrapolation + AI residual correction.
- **Explainability**: Highlighting primary contributors (e.g., "Rapid lightning increase", "Cloud-top cooling").
- **Uncertainty/Confidence Estimation**: Outputting confidence bounds for warnings.
- **GIS Dashboard**: Real-time map displaying storm cells, predicted tracks, and probabilities.

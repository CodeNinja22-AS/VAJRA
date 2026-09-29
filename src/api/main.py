from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import onnxruntime as ort
import numpy as np
import os
import json
from typing import List, Dict, Any

# A mock setup for SQLAlchemy/PostGIS integration
# In a real environment, you'd use geoalchemy2 for spatial data
# from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
# from geoalchemy2 import Geometry
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker

app = FastAPI(
    title="VAJRA Nowcasting API",
    description="API for high-performance thunderstorm and lightning nowcasting.",
    version="1.0.0"
)

# Global variables for model state
ort_session = None

def get_model_path():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    return os.path.join(base_dir, 'models', 'unet_spatial.onnx')

@app.on_event("startup")
async def load_model():
    """
    Loads the ONNX model into memory on API startup for fast inference.
    """
    global ort_session
    model_path = get_model_path()
    if os.path.exists(model_path):
        print(f"Loading ONNX model from {model_path}...")
        # Using onnxruntime for high performance inference (can use 'CUDAExecutionProvider')
        ort_session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        print("Model loaded successfully.")
    else:
        print(f"WARNING: Model {model_path} not found. /predict endpoint will fail.")

class InferenceRequest(BaseModel):
    # Expecting a flattened array or list of lists for spatial features
    # Shape should ideally be mapped back to [Batch, Channels, Height, Width]
    # For a JSON payload, passing large grids directly might be heavy, 
    # but for an API this is how we ingest raw arrays.
    timestamp: str
    grid_shape: List[int] # e.g. [1, 4, 64, 64]
    features_flat: List[float]
    metadata: Dict[str, Any] = {}

class InferenceResponse(BaseModel):
    timestamp: str
    storm_probability_flat: List[float]
    grid_shape: List[int] # e.g. [64, 64]
    warning_zones: List[Dict[str, Any]] # e.g. [{"lat": 28.6, "lon": 77.2, "prob": 0.85}]

@app.get("/health")
def health_check():
    """Health check endpoint to ensure API and DB connections are active."""
    return {
        "status": "healthy",
        "model_loaded": ort_session is not None
    }

@app.post("/predict", response_model=InferenceResponse)
def predict(request: InferenceRequest):
    """
    Takes atmospheric and radar features, runs through ONNX, 
    and returns a thunderstorm probability grid.
    """
    global ort_session
    if ort_session is None:
        raise HTTPException(status_code=500, detail="ONNX Model is not loaded.")
        
    expected_size = np.prod(request.grid_shape)
    if len(request.features_flat) != expected_size:
        raise HTTPException(
            status_code=400, 
            detail=f"Feature array size mismatch. Expected {expected_size}, got {len(request.features_flat)}"
        )
        
    # Reconstruct the numpy array
    input_array = np.array(request.features_flat, dtype=np.float32).reshape(request.grid_shape)
    
    # ONNX Inference
    input_name = ort_session.get_inputs()[0].name
    outputs = ort_session.run(None, {input_name: input_array})
    
    # output shape is [Batch, Height, Width]
    prob_map = outputs[0][0] # Assuming batch size 1
    
    # Mocking a PostGIS insertion for storm cell tracking
    # Normally: db_session.add(StormCell(geom=f"POINT({lon} {lat})", prob=...))
    
    # Simple extraction of hot zones (Probability > 0.7)
    hot_zones = []
    # For this demonstration, we just mock the coordinates
    # Real logic would map matrix indices to geographic lat/lon bounds
    threshold = 0.7
    h, w = prob_map.shape
    for i in range(h):
        for j in range(w):
            if prob_map[i, j] > threshold:
                hot_zones.append({
                    "grid_y": i,
                    "grid_x": j,
                    "prob": float(prob_map[i, j])
                })
                
    return InferenceResponse(
        timestamp=request.timestamp,
        storm_probability_flat=prob_map.flatten().tolist(),
        grid_shape=[h, w],
        warning_zones=hot_zones
    )

if __name__ == "__main__":
    import uvicorn
    # uvicorn src.api.main:app --host 0.0.0.0 --port 8000
    print("Run this API using 'uvicorn src.api.main:app --reload'")

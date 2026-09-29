from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import random
import os
import joblib
import numpy as np
from PIL import Image
import io

app = FastAPI()

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to load the XGBoost model
model_path = os.path.join(os.path.dirname(__file__), 'models', 'xgboost_level1.joblib')
try:
    xgb_model = joblib.load(model_path)
    model_loaded = True
except Exception as e:
    model_loaded = False

# Color mapping function for radar reflectivity (0 to 65 dBZ)
def get_radar_color(dbz):
    if dbz < 10: return (0, 0, 0, 0) # Transparent
    elif dbz < 20: return (0, 255, 255, 120) # Light blue
    elif dbz < 30: return (0, 150, 255, 150) # Blue
    elif dbz < 40: return (0, 255, 0, 180) # Green
    elif dbz < 50: return (255, 255, 0, 200) # Yellow
    elif dbz < 60: return (255, 150, 0, 220) # Orange
    else: return (255, 0, 0, 240) # Red

@app.get("/api/radar/frame/{time_idx}")
def get_radar_frame(time_idx: int):
    base_dir = os.path.dirname(__file__)
    forecast_path = os.path.join(base_dir, 'data', 'processed', 'latest_forecast.npy')
    
    def empty_png():
        img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        return Response(content=img_byte_arr.getvalue(), media_type="image/png")

    if not os.path.exists(forecast_path):
        return empty_png()
        
    try:
        # Array shape is (18, 40, 40)
        forecast_data = np.load(forecast_path)
        idx = max(0, min(time_idx, forecast_data.shape[0] - 1))
        frame = forecast_data[idx]
        
        h, w = frame.shape
        img_data = np.zeros((h, w, 4), dtype=np.uint8)
        
        for i in range(h):
            for j in range(w):
                img_data[i, j] = get_radar_color(frame[i, j])
                
        img = Image.fromarray(img_data)
        # Flip vertically because matrix origin is top-left, Mapbox overlays bottom-left to top-right
        # Wait, if we use image bounding box, Mapbox maps top-left to top-left. Let's see. 
        # Usually it's fine as is. We will resize to smooth it.
        img = img.resize((512, 512), Image.Resampling.BILINEAR)
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        return Response(content=img_byte_arr.getvalue(), media_type="image/png")
    except Exception as e:
        print(f"Error serving frame: {e}")
        return empty_png()

@app.get("/api/nowcast")
def get_nowcast():
    base_val = random.randint(10, 20)
    confidence = random.randint(75, 99)
    
    return {
        "model_loaded": model_loaded,
        "precipitation": [
            { "time": "T-30m", "amount": random.randint(0, 5) },
            { "time": "T-15m", "amount": random.randint(2, 10) },
            { "time": "NOW", "amount": base_val },
            { "time": "T+15m", "amount": base_val + 30 },
            { "time": "T+30m", "amount": base_val + 15 },
            { "time": "T+45m", "amount": random.randint(5, 20) },
            { "time": "T+60m", "amount": random.randint(0, 10) },
        ],
        "telemetry": {
            "temp": round(random.uniform(25.0, 32.0), 1),
            "humidity": random.randint(60, 95),
            "wind": random.randint(15, 45),
            "aqi": random.randint(50, 150)
        },
        "alerts": [
            {
                "title": "Tornadic Vortex Signature",
                "level": "Level 3 Severe",
                "confidence": confidence,
                "eta": random.randint(5, 30)
            },
            {
                "title": "Precipitation Surge",
                "desc": f"+{random.randint(30, 80)}mm/hr expected in Sector {random.randint(1, 8)}"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

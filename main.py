import os
import sys

# Add project root to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from src.api.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("ENV", "development").lower() == "development"
    print(f"Starting VAJRA Server on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)

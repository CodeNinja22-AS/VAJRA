import os
import torch
import torch.onnx
from src.models.spatial_dl import SimpleUNet

def export_model_to_onnx():
    print("--- Phase 18: Exporting Model to ONNX ---")
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    model_dir = os.path.join(base_dir, 'models')
    
    # We will export the SimpleUNet from Phase 13 as our representative model
    pth_path = os.path.join(model_dir, 'unet_spatial_level3.pth')
    onnx_path = os.path.join(model_dir, 'unet_spatial.onnx')
    
    if not os.path.exists(pth_path):
        print(f"Warning: {pth_path} not found. Using an initialized (untrained) model for export demonstration.")
    
    # Assume 4 input channels for the mock features (cape, t2m, etc.)
    num_features = 4
    model = SimpleUNet(in_channels=num_features, out_channels=1)
    
    if os.path.exists(pth_path):
        # Load weights
        model.load_state_dict(torch.load(pth_path, map_location='cpu'))
        
    model.eval()
    
    # Create dummy input that matches the model's expected input shape: [Batch_Size, Channels, Height, Width]
    # Assuming a 64x64 spatial grid for demonstration
    dummy_input = torch.randn(1, num_features, 64, 64)
    
    print(f"Exporting model to {onnx_path}...")
    
    torch.onnx.export(
        model, 
        dummy_input, 
        onnx_path, 
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size', 2: 'height', 3: 'width'},
                      'output': {0: 'batch_size', 1: 'height', 2: 'width'}}
    )
    
    print("Export successful!")

if __name__ == "__main__":
    export_model_to_onnx()

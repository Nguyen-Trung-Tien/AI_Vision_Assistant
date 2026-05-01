import os
import torch
from pathlib import Path


def download_and_export_midas():
    # Setup paths
    ai_worker_dir = Path(__file__).resolve().parent.parent
    models_dir = ai_worker_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    onnx_path = models_dir / "depth_model.onnx"

    if onnx_path.exists():
        print(f"[*] ONNX model already exists at: {onnx_path}")
        return

    print("[*] Downloading MiDaS Small model from torch hub...")
    # MiDaS_small is efficient and lightweight (around 24MB)
    model_type = "MiDaS_small"
    model = torch.hub.load("intel-isl/MiDaS", model_type)

    # Set model to evaluation mode
    model.eval()

    print("[*] Exporting model to ONNX format...")
    # Create dummy input with optimal size for speed
    # MiDaS accepts varied sizes, but sizes must be multiple of 32.
    # Workflow asks for 256x256 for optimal latency.
    dummy_input = torch.randn(1, 3, 256, 256)

    # Export it
    torch.onnx.export(
        model,
        dummy_input,
        str(onnx_path),
        export_params=True,
        opset_version=11,  # Standard opset version, compatible with OpenCV DNN
        do_constant_folding=True,  # Optimize the ONNX graph
        input_names=["input"],  # Input tensor name
        output_names=["output"],  # Output tensor name
        dynamic_axes={
            "input": {0: "batch_size", 2: "height", 3: "width"},
            "output": {0: "batch_size", 1: "height", 2: "width"},
        },
    )

    print(f"[+] Successfully exported MiDaS model to {onnx_path}")
    print(f"[+] File Size: {os.path.getsize(onnx_path) / (1024 * 1024):.2f} MB")


if __name__ == "__main__":
    download_and_export_midas()

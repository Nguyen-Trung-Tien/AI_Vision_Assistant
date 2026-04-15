import cv2
import numpy as np
import onnxruntime as ort
from pathlib import Path

from .constants import DEPTH_CALIBRATION_POLY_COEFS, USE_DEPTH_ESTIMATION

class DepthEstimator:
    """Wrapper that runs monocular depth estimation using MiDaS Small."""
    _instance = None
    
    def __init__(self):
        self.model = None
        self.enabled = USE_DEPTH_ESTIMATION
        
        if not self.enabled:
            return
            
        service_dir = Path(__file__).resolve().parent
        ai_worker_dir = service_dir.parent
        model_path = ai_worker_dir / "models" / "depth_model.onnx"
        
        if not model_path.exists():
            print(f"[DepthEstimator] WARNING: Model missing at {model_path}. Depth estimation disabled.")
            self.enabled = False
            return
            
        try:
            # Re-check onnxruntime availability
            self.session = ort.InferenceSession(
                str(model_path), 
                providers=['CPUExecutionProvider']
            )
            # MiDaS small optimal resolution
            self.input_size = (256, 256)
            print("[DepthEstimator] ONNX Runtime Session loaded successfully.")
        except Exception as e:
            print(f"[DepthEstimator] Failed to load ONNX model via ORT: {e}")
            self.enabled = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def estimate_depth(self, image: np.ndarray) -> np.ndarray:
        """
        Runs the MiDaS inference and returns a depth map
        matching the original image's aspect ratio/size.
        """
        if not self.enabled or self.model is None:
            return None
            
        img_h, img_w = image.shape[:2]
        
        # 1. Preprocess: Resize & convert image for the MiDaS model
        blob = cv2.dnn.blobFromImage(
            image, 
            1.0 / 255.0, 
            self.input_size, 
            mean=(0.485 * 255, 0.456 * 255, 0.406 * 255), 
            swapRB=True, 
            crop=False
        )
        
        # 2. Add std deviation scaling (MiDaS uses standard ImageNet std)
        blob[0, 0, :, :] /= 0.229
        blob[0, 1, :, :] /= 0.224
        blob[0, 2, :, :] /= 0.225
        
        # 3. Forward pass
        input_name = self.session.get_inputs()[0].name
        output_name = self.session.get_outputs()[0].name
        depth_map = self.session.run([output_name], {input_name: blob})[0]
        
        # 4. Post-process
        depth_map = depth_map[0, :, :] 
        
        # Resize to original image size
        depth_map = cv2.resize(depth_map, (img_w, img_h), interpolation=cv2.INTER_CUBIC)
        
        return depth_map

    def depth_to_meters(self, depth_value: float) -> float:
        """Maps inverse relative depth value to absolute distance in meters using polynomial config."""
        # Use simple dummy equation for now if calibration is missing 
        if not DEPTH_CALIBRATION_POLY_COEFS:
            # Dummy function until `calibrate_depth.py` outputs real coefficents
            if depth_value <= 0:
                return 10.0
            return float(abs(100.0 / depth_value))
            
        c = DEPTH_CALIBRATION_POLY_COEFS
        f = np.poly1d(c)
        return float(f(depth_value))

    def get_distance_at_bbox(self, depth_map: np.ndarray, bbox: list[int]) -> float | None:
        """Calculate the median depth within the bounding box and map to meters."""
        if depth_map is None:
            return None
            
        x1, y1, x2, y2 = bbox
        img_h, img_w = depth_map.shape[:2]
        
        # Constrain bbox to image
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img_w, x2), min(img_h, y2)
        
        if x1 >= x2 or y1 >= y2:
            return None
            
        region = depth_map[y1:y2, x1:x2]
        median_depth = np.median(region)
        
        # Convert to absolute meters
        return round(self.depth_to_meters(median_depth), 1)


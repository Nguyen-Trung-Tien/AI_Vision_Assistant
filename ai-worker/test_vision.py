import base64
import sys
from pathlib import Path

# Add services to path
sys.path.append(str(Path.cwd()))

from services.ai_service import AIService

def run_test():
    print("=== Vision Assistant Image Test ===\n")
    
    test_images = [
        "dataset/images/train/100k_frame_00230.jpg",
        "dataset/images/train/20k_frame_00185.jpg",
        "dataset/images/train/10k_frame_00145.jpg",
        "dataset/images/train/frame_01946.jpg", # Likely a street scene
    ]
    
    for img_path_str in test_images:
        img_path = Path(img_path_str)
        if not img_path.exists():
            print(f"[!] File not found: {img_path_str}")
            continue
            
        print(f"Testing: {img_path.name}")
        
        with open(img_path, "rb") as f:
            base64_data = base64.b64encode(f.read()).decode("utf-8")
            
        # 1. Test OCR (Money Recognition)
        print("  - Running OCR (Money)...")
        ocr_res = AIService.process_ocr(base64_data, client_id="test_user")
        print(f"    Result: {ocr_res['text']}")
        print(f"    Conf: {ocr_res['confidence_score']}")
        
        # 2. Test Captioning (Street Scene)
        print("  - Running CAPTION (Scene)...")
        cap_res = AIService.process_captioning(base64_data, client_id="test_user")
        print(f"    Result: {cap_res['text']}")
        print(f"    Obj Count: {cap_res.get('object_count', 0)}")
        print("-" * 40)

if __name__ == "__main__":
    run_test()

import base64
import sys
from pathlib import Path

# Add services to path
sys.path.append(str(Path.cwd()))

from services.ai_service import AIService

def run_debug():
    img_path = Path("dataset/images/train/100k_frame_00230.jpg")
    with open(img_path, "rb") as f:
        base64_data = base64.b64encode(f.read()).decode("utf-8")
        
    image = AIService._decode_base64_image(base64_data)
    detections = AIService._detect(image)
    
    print(f"Debug for {img_path.name}")
    for d in detections:
        label = d["label"]
        denom = AIService._extract_denomination(label)
        print(f"  Det: label={label}, conf={d['confidence']:.2f}, extracted_denom={denom}")
        
    res = AIService.process_ocr(base64_data)
    print(f"Final Text: {res['text']}")

if __name__ == "__main__":
    run_debug()

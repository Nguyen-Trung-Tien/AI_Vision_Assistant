import sys
from pathlib import Path

# Add the current directory to sys.path to import services
sys.path.append(str(Path.cwd()))

from services.ai_service import AIService

def test_advanced_logic():
    print("--- Running Advanced Safety Feature Tests ---\n")
    
    # 1. Test Distance Estimation
    print("[1] Testing Distance Estimation")
    # Formula: Distance = (RealHeight * FocalLength) / PixelHeight
    # focal_length ~ 640 for 640px image
    test_cases = [
        ("person", 320, 640, 3.4), # Height is half of image -> Distance should be 2 * RealHeight (1.7 * 2 = 3.4)
        ("car", 320, 640, 3.0),    # RealHeight 1.5 -> Distance 3.0
        ("bus", 640, 640, 3.0),    # RealHeight 3.0 -> Distance 3.0
    ]
    for label, box_h, img_h, expected in test_cases:
        dist = AIService._estimate_distance(label, box_h, img_h)
        status = "PASS" if dist == expected else "FAIL"
        print(f"Object: {label:10} | BoxH: {box_h:3} | Dist: {dist:3} | Expected: {expected:3} | {status}")

    # 2. Test Clear Path Detection
    print("\n[2] Testing Path Recommendation")
    img_w = 640
    # Case: Objects on left and center, gap on right
    mock_dets = [
        {"confidence": 0.9, "box": [0, 100, 200, 200]},   # Left
        {"confidence": 0.9, "box": [210, 100, 400, 200]}, # Center
    ]
    paths = AIService._find_clear_paths(mock_dets, img_w)
    print(f"Detections cover [0-400]. ImgWidth 640. Gap [400-640].")
    print(f"Result: {paths}")
    
    # Case: Objects on left and right, gap in center
    mock_dets_2 = [
        {"confidence": 0.9, "box": [0, 100, 150, 200]},   # Left
        {"confidence": 0.9, "box": [490, 100, 640, 200]}, # Right
    ]
    paths_2 = AIService._find_clear_paths(mock_dets_2, img_w)
    print(f"\nDetections cover [0-150] and [490-640]. Gap [150-490].")
    print(f"Result: {paths_2}")

if __name__ == "__main__":
    test_advanced_logic()

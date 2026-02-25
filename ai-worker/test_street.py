import sys
from pathlib import Path

# Add the current directory to sys.path to import services
sys.path.append(str(Path.cwd()))

from services.ai_service import AIService

def test_captioning_logic():
    print("--- Running Street Scene Captioning Tests ---\n")
    
    # Mock data
    img_width = 640
    mock_detections = [
        {"label": "person", "box": [300, 100, 340, 200], "confidence": 0.9}, # Center
        {"label": "car", "box": [50, 100, 150, 200], "confidence": 0.8},    # Left
        {"label": "car", "box": [500, 100, 600, 200], "confidence": 0.7},   # Right
        {"label": "motorcycle", "box": [320, 150, 360, 250], "confidence": 0.6}, # Center
    ]

    # Test spatial position
    print("[1] Testing Spatial Positioning")
    for d in mock_detections:
        pos = AIService._get_spatial_position(d["box"], img_width)
        print(f"Object: {d['label']:10} | Center X: {(d['box'][0]+d['box'][2])/2:3} | Position: {pos}")

    # Test constructing text (simulated logic from process_captioning)
    print("\n[2] Testing Caption Construction")
    spatial_groups = {"Phía trước": {}, "Bên trái": {}, "Bên phải": {}}
    for d in mock_detections:
        label = d["label"]
        translated = AIService._label_translations.get(label, label)
        pos = AIService._get_spatial_position(d["box"], img_width)
        if translated not in spatial_groups[pos]: spatial_groups[pos][translated] = 0
        spatial_groups[pos][translated] += 1

    parts = []
    for pos, objects in spatial_groups.items():
        if not objects: continue
        obj_strings = [f"{count} {name}" if count > 1 else name for name, count in objects.items()]
        parts.append(f"{pos} có {', '.join(obj_strings)}")
    
    final_text = ". ".join(parts) + "."
    print(f"Final Text: {final_text}")

if __name__ == "__main__":
    test_captioning_logic()

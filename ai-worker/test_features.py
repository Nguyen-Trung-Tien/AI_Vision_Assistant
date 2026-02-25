import sys
from pathlib import Path

# Add the current directory to sys.path to import services
sys.path.append(str(Path.cwd()))

from services.ai_service import AIService

def test_feature_validation():
    print("--- Running Banknote Feature Validation Tests ---\n")
    
    # 1. Test Aspect Ratio
    print("[1] Testing Aspect Ratio Validation")
    ratio_test_cases = [
        # (box, expected)
        ([0, 0, 220, 100], True),   # 2.2 ratio (Good)
        ([0, 0, 100, 220], True),   # 2.2 ratio vertical (Good)
        ([0, 0, 150, 100], False),  # 1.5 ratio (Too square)
        ([0, 0, 300, 100], False),  # 3.0 ratio (Too long)
    ]
    for box, expected in ratio_test_cases:
        result = AIService._validate_aspect_ratio(box)
        status = "PASS" if result == expected else "FAIL"
        print(f"Box: {box} | Expected: {expected:5} | Result: {result:5} | {status}")

    # 2. Test Landmarks
    print("\n[2] Testing Landmark Retrieval")
    landmark_test_cases = [
        ("100000", "Văn Miếu - Quốc Tử Giám"),
        ("20000", "Chùa Cầu (Hội An)"),
        ("500000", "ngôi nhà tranh của Bác Hồ ở Kim Liên"),
    ]
    for denom, expected in landmark_test_cases:
        result = AIService._denomination_features.get(denom)
        status = "PASS" if result == expected else "FAIL"
        print(f"Denom: {denom:6} | Expected: {expected:40} | Result: {result:40} | {status}")

    # 3. Test Integrated Logic (Simulated)
    # Since process_ocr requires a base64 image, we test the scoring logic inside the loop if possible, 
    # but here we just verify the components are integrated.

if __name__ == "__main__":
    test_feature_validation()

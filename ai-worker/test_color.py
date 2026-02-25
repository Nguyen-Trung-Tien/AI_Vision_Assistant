import sys
from pathlib import Path

# Add the current directory to sys.path to import services
sys.path.append(str(Path.cwd()))

from services.ai_service import AIService

def test_color_validation():
    test_cases = [
        # (Hue, Saturation, Value, Denomination, ExpectedResult)
        (115, 150, 200, "20000", True),   # 20k - Blue (H ~ 115)
        (60, 150, 200, "100000", True),   # 100k - Green (H ~ 60)
        (160, 150, 200, "50000", True),   # 50k - Pink (H ~ 160)
        (20, 100, 200, "10000", True),    # 10k - Yellow/Brown (H ~ 20)
        (10, 150, 200, "200000", True),   # 200k - Orange/Red (H ~ 10)
        (95, 150, 200, "500000", True),   # 500k - Cyan (H ~ 95)
        
        # False cases
        (60, 150, 200, "20000", False),   # Green color for 20k (Blue)
        (115, 150, 200, "100000", False),  # Blue color for 100k (Green)
    ]
    
    print("Running color validation tests...")
    success_count = 0
    for h, s, v, denom, expected in test_cases:
        result = AIService._validate_denomination_by_color((h, s, v), denom)
        status = "PASS" if result == expected else "FAIL"
        print(f"Denom: {denom:6} | HSV: ({h:3}, {s:3}, {v:3}) | Expected: {expected:5} | Result: {result:5} | {status}")
        if result == expected:
            success_count += 1
            
    print(f"\nTests passed: {success_count}/{len(test_cases)}")

if __name__ == "__main__":
    test_color_validation()

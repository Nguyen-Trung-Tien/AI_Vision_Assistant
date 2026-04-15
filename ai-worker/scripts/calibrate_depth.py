import numpy as np

def print_calibration_info():
    print("=" * 50)
    print("           DEPTH ESTIMATION CALIBRATION")
    print("=" * 50)
    print("1. Please collect 5-10 pairs of (Real Distance, MiDaS Median Depth Value)")
    print("2. You can get the Median Depth Value by placing an object at known distance")
    print("   and printing the value of `median_depth` in DepthEstimator.get_distance_at_bbox")
    print("3. Enter your values below to fit a polynomial mapping.\n")

    distances = []
    depths = []
    
    try:
        while True:
            pair_str = input("Enter pair -> Format: distance_in_m depth_value (or type 'q' to finish): ")
            if pair_str.strip().lower() == 'q':
                break
            parts = pair_str.split()
            if len(parts) != 2:
                print("Invalid format. Expecting: 1.5 45.2")
                continue
            dist_m = float(parts[0])
            depth_val = float(parts[1])
            distances.append(dist_m)
            depths.append(depth_val)
    except Exception as e:
        print(f"Error parsing input: {e}")
        return

    if len(distances) < 2:
        print("Need at least 2 pairs to fit a line.")
        return

    d_arr = np.array(distances)
    v_arr = np.array(depths)
    
    # We fit: distance = f(depth_val)
    deg = 1 if len(distances) <= 3 else 2
    
    coefs = np.polyfit(v_arr, d_arr, deg)
    
    print("\nCalibration successful!")
    print(f"Polynomial Degree Used: {deg}")
    print("Coefficients:")
    print(coefs.tolist())
    print("\n[+] Add these to constants.py -> DEPTH_CALIBRATION_POLY_COEFS:")
    print(f"DEPTH_CALIBRATION_POLY_COEFS = {coefs.tolist()}")

if __name__ == "__main__":
    print_calibration_info()

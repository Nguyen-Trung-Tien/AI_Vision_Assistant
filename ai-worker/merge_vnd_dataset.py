import os
import shutil
import yaml
import argparse
from pathlib import Path

CANONICAL_CLASSES = [
    "car",              # 0
    "truck",            # 1
    "chair",            # 2
    "manhole",          # 3
    "person",           # 4
    "phone",            # 5
    "road",             # 6
    "sidewalk",         # 7
    "stairs_down",      # 8
    "stairs_up",        # 9
    "water_bottle",     # 10
    "tien_1k",          # 11
    "tien_2k",          # 12
    "tien_5k",          # 13
    "tien_10k",         # 14
    "tien_20k",         # 15
    "tien_50k",         # 16
    "tien_100k",
    "tien_200k",
    "tien_500k",        # 17
    "motorbike",        # 18
    "bus",              # 19
    "pothole",          # 20
    "open_manhole",     # 21
    "traffic_light_red",    # 22
    "traffic_light_yellow", # 23
    "traffic_light_green",  # 24
    # New classes (separate "noise"/extra labels)
    "crosswalk_line",          # 25
    "crosswalk_marker",        # 26
    "crosswalk_meta",          # 27
    "flood",                   # 28
    "off_street",              # 29
    "obstacle",                # 30
    "roadway",                 # 31
    "alligator_crack",         # 32
    "lateral_crack",           # 33
    "longitudinal_crack",      # 34
    "surface_defect",          # 35
    "vehicle_generic",         # 36
    "foam",                    # 37
    "pastry_bag_plastic",      # 38
    "straw",                   # 39
    "traffic_light_rear",      # 40
    "traffic_light_bottom_view",# 41
    "traffic_light_side_view", # 42
]

VND_MAP = {
    # 1k
    "1k": "tien_1k", "1000": "tien_1k", "1_000": "tien_1k", "1000vnd": "tien_1k", "1000v": "tien_1k", "1000_vnd": "tien_1k",
    "1k_vnd": "tien_1k", "tien_1k": "tien_1k", "tien1k": "tien_1k", "1000vnđ": "tien_1k",
    # 2k
    "2k": "tien_2k", "2000": "tien_2k", "2_000": "tien_2k", "2000vnd": "tien_2k", "2000v": "tien_2k", "2000_vnd": "tien_2k",
    "2k_vnd": "tien_2k", "tien_2k": "tien_2k", "tien2k": "tien_2k", "2000vnđ": "tien_2k",
    # 5k
    "5k": "tien_5k", "5000": "tien_5k", "5_000": "tien_5k", "5000vnd": "tien_5k", "5000v": "tien_5k", "5000_vnd": "tien_5k",
    "5k_vnd": "tien_5k", "tien_5k": "tien_5k", "tien5k": "tien_5k", "5000vnđ": "tien_5k",
    # 10k
    "10k": "tien_10k", "10000": "tien_10k", "10_000": "tien_10k", "10000_vnd": "tien_10k", "10000v": "tien_10k", "10kvnd": "tien_10k",
    "10k_vnd": "tien_10k", "tien_10k": "tien_10k", "tien10k": "tien_10k", "10000vnđ": "tien_10k",
    # 20k
    "20k": "tien_20k", "20000": "tien_20k", "20_000": "tien_20k", "20000_vnd": "tien_20k", "20000v": "tien_20k", "20kvnd": "tien_20k",
    "20k_vnd": "tien_20k", "tien_20k": "tien_20k", "tien20k": "tien_20k", "20000vnđ": "tien_20k",
    # 50k
    "50k": "tien_50k", "50000": "tien_50k", "50_000": "tien_50k", "50000_vnd": "tien_50k", "50000v": "tien_50k", "50kvnd": "tien_50k",
    "50k_vnd": "tien_50k", "tien_50k": "tien_50k", "tien50k": "tien_50k", "50000vnđ": "tien_50k",
    # 100k
    "100k": "tien_100k", "100000": "tien_100k", "100_000": "tien_100k", "100000_vnd": "tien_100k", "100000v": "tien_100k", "100kvnd": "tien_100k",
    "100k_vnd": "tien_100k", "tien_100k": "tien_100k", "tien100k": "tien_100k", "100000vnđ": "tien_100k",
    # Vehicles
    "motorbike": "motorbike", "motorcycle": "motorbike", "xe_may": "motorbike", "xe may": "motorbike", "xemay": "motorbike",
    "bus": "bus", "xe_khach": "bus", "xe khach": "bus", "coach": "bus", "xe_bus": "bus", "xe_buyt": "bus",
    "car": "car", "oto": "car", "xe_hoi": "car", "automobile": "car",
    "truck": "truck", "xe_tai": "truck", "xe tai": "truck",
    # People
    "male": "person", "nam": "person", "nguoi_nam": "person", "nguoi nam": "person", "man": "person", "boy": "person",
    "female": "person", "nu": "person", "nguoi_nu": "person", "nguoi nu": "person", "woman": "person", "girl": "person",
    "person": "person", "nguoi": "person", "human": "person",
    # Bottles (dropped: plastic_bottle, glass_bottle)
    # Hazards
    "pothole": "pothole", "o_ga": "pothole", "o_voi": "pothole", "o ga": "pothole", "o voi": "pothole", "ổ gà": "pothole", "ổ voi": "pothole",
    "open_manhole": "open_manhole", "nap_cong_mo": "open_manhole", "nap cong mo": "open_manhole", "nắp cống mở": "open_manhole", "nắp cống đang mở": "open_manhole",
    "manhole": "manhole", "nap_cong": "manhole", "nap cong": "manhole", "nắp cống": "manhole",
    # Default objects
    "chair": "chair", "ghe": "chair", "ghế": "chair",
    "chair - v2 v1": "chair",
    "phone": "phone", "dien_thoai": "phone", "điện thoại": "phone", "smartphone": "phone",
    "cell-phone": "phone", "-phone-": "phone",
    "water_bottle": "water_bottle", "chai_nuoc": "water_bottle", "chai nước": "water_bottle",
    "road": "road", "duong": "road", "đường": "road",
    "street": "roadway",
    "sidewalk": "sidewalk", "vi_he": "sidewalk", "vỉa hè": "sidewalk",
    "sidewalk_structure": "sidewalk", "walkable_path": "sidewalk",
    "stairs_down": "stairs_down", "cau_thang_xuong": "stairs_down",
    "stairs_up": "stairs_up", "cau_thang_len": "stairs_up",
    "stairsdown": "stairs_down", "downstair": "stairs_down", "stairs down": "stairs_down",
    "stairsup": "stairs_up", "upstair": "stairs_up", "stairs up": "stairs_up",
    "stairs": "stairs_up",
    # Traffic Lights
    "traffic_light_red": "traffic_light_red", "đèn đỏ": "traffic_light_red", "den_do": "traffic_light_red", "red_light": "traffic_light_red", "đèn giao thông đỏ": "traffic_light_red", "red": "traffic_light_red",
    "traffic light red": "traffic_light_red", "traffic light red and yellow": "traffic_light_red",
    
    "traffic_light_yellow": "traffic_light_yellow", "đèn vàng": "traffic_light_yellow", "den_vang": "traffic_light_yellow", "yellow_light": "traffic_light_yellow", "đèn giao thông vàng": "traffic_light_yellow", "yellow": "traffic_light_yellow",
    "traffic light yellow": "traffic_light_yellow",
    
    "traffic_light_green": "traffic_light_green", "đèn xanh": "traffic_light_green", "den_xanh": "traffic_light_green", "green_light": "traffic_light_green", "đèn giao thông xanh": "traffic_light_green", "green": "traffic_light_green",
    "traffic light green": "traffic_light_green", "traffic light green turn left": "traffic_light_green", "traffic light green turn right": "traffic_light_green",
    "traffic light green and turn left": "traffic_light_green", "traffic light green go straight": "traffic_light_green", "traffic light red yellow and green": "traffic_light_green",

    # Trash (plastic/glass removed)
    "foam": "foam", "pastry_bag": "pastry_bag_plastic", "straw": "straw",

    # Vehicles variants
    "truckrotation": "truck",

    # Crosswalk dataset junk labels -> separated classes
    "-": "crosswalk_line",
    "crosswalk identifier - v10 80-10-10 pt2": "crosswalk_marker",
    "this dataset was exported via roboflow.com on december 12- 2023 at 12-06 pm gmt": "crosswalk_meta",

    # Street segmentation extra labels
    "flood": "flood",
    "non street": "off_street",
    "obstacle": "obstacle",
    "ngap": "flood", "ngập": "flood", "ngap nuoc": "flood", "ngập nước": "flood", "lut": "flood", "lụt": "flood",
    "ngoai duong": "off_street", "ngoài đường": "off_street",
    "chuong ngai vat": "obstacle", "chướng ngại vật": "obstacle", "vat can": "obstacle", "vật cản": "obstacle",

    # Cracks dataset labels
    "alligator cracks": "alligator_crack",
    "lateral cracks": "lateral_crack",
    "longitudinal cracks": "longitudinal_crack",
    "nut da ca sau": "alligator_crack", "nứt da cá sấu": "alligator_crack",
    "nut ngang": "lateral_crack", "nứt ngang": "lateral_crack",
    "nut doc": "longitudinal_crack", "nứt dọc": "longitudinal_crack",

    # Sidewalk dataset extra labels
    "surface_damage": "surface_defect",
    "vehicle": "vehicle_generic",
    "hu hong be mat": "surface_defect", "hư hỏng bề mặt": "surface_defect",
    "phuong tien": "vehicle_generic", "phương tiện": "vehicle_generic",

    # Traffic light view labels
    "traffic light back": "traffic_light_rear",
    "traffic light bottom view": "traffic_light_bottom_view",
    "traffic light side view": "traffic_light_side_view",
    "traffic light sdie view": "traffic_light_side_view",
    "den giao thong mat sau": "traffic_light_rear", "đèn giao thông mặt sau": "traffic_light_rear",
    "den giao thong nhin tu duoi": "traffic_light_bottom_view", "đèn giao thông nhìn từ dưới": "traffic_light_bottom_view",
    "den giao thong nhin nghieng": "traffic_light_side_view", "đèn giao thông nhìn nghiêng": "traffic_light_side_view",
}

def map_label(old_label_name):
    clean_name = old_label_name.strip().lower()
    mapped = VND_MAP.get(clean_name, None)
    if mapped is None:
        return None
    if mapped not in CANONICAL_CLASSES:
        return None
    return mapped

def merge_datasets(source_dir, target_dir):
    source_path = Path(source_dir)
    target_path = Path(target_dir)

    yaml_file = source_path / "data.yaml"
    if not yaml_file.exists():
        print(f"Error: {yaml_file} not found.")
        return

    with open(yaml_file, "r") as f:
        source_yaml = yaml.safe_load(f)
    
    source_names = source_yaml.get("names", [])
    if isinstance(source_names, dict):
        source_names = [source_names[k] for k in sorted(source_names.keys())]

    class_index_map = {}
    print("\n--- Mapping Labels ---")
    for i, name in enumerate(source_names):
        canon_name = map_label(str(name))
        if canon_name:
            canon_index = CANONICAL_CLASSES.index(canon_name)
            class_index_map[i] = canon_index
            print(f"[OK] Mapped source label '{name}' -> '{canon_name}' (ID: {canon_index})")
        else:
            print(f"[SKIP] Unknown source label '{name}', ignoring it.")

    splits = ["train", "valid", "test", "val"]
    
    print("\n--- Merging Data ---")
    for split in splits:
        img_src = source_path / split / "images"
        lbl_src = source_path / split / "labels"
        
        target_split = split if split != "valid" else "val"
        img_dest = target_path / target_split / "images"
        lbl_dest = target_path / target_split / "labels"
        
        if img_src.exists() and lbl_src.exists():
            img_dest.mkdir(parents=True, exist_ok=True)
            lbl_dest.mkdir(parents=True, exist_ok=True)
            
            copied_files = 0
            for lbl_file in lbl_src.glob("*.txt"):
                valid_lines = []
                with open(lbl_file, "r") as f:
                    lines = f.readlines()
                for line in lines:
                    parts = line.strip().split()
                    if not parts:
                        continue
                    try:
                        old_class_id = int(parts[0])
                        if old_class_id in class_index_map:
                            new_class_id = class_index_map[old_class_id]
                            parts[0] = str(new_class_id)
                            valid_lines.append(" ".join(parts) + "\n")
                    except ValueError:
                        continue
                
                if valid_lines:
                    img_file = img_src / lbl_file.with_suffix(".jpg").name
                    if not img_file.exists():
                        img_file = img_src / lbl_file.with_suffix(".png").name
                    if not img_file.exists():
                        img_file = img_src / lbl_file.with_suffix(".jpeg").name
                        
                    if img_file.exists():
                        prefix = source_path.name.replace(" ", "_")
                        new_lbl_name = f"{prefix}_{lbl_file.name}"
                        new_img_name = f"{prefix}_{img_file.name}"
                        with open(lbl_dest / new_lbl_name, "w") as f:
                            f.writelines(valid_lines)
                        shutil.copy(img_file, img_dest / new_img_name)
                        copied_files += 1
            
            print(f"Copied {copied_files} valid images and labels for split '{split}' -> '{target_split}'")

    print("\n--- Updating target data.yaml ---")
    with open(target_path / "data.yaml", "w", encoding="utf-8") as f:
        f.write("path: .\n")
        f.write("train: train/images\n")
        f.write("val: val/images\n")
        f.write("test: test/images\n\n")
        f.write(f"nc: {len(CANONICAL_CLASSES)}\n")
        f.write("names:\n")
        for name in CANONICAL_CLASSES:
            f.write(f"  - {name}\n")
    
    print("Done! Target dataset is ready for training.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge VND dataset from Roboflow to target dataset")
    parser.add_argument("--source", type=str, required=True, help="Path to the downloaded YOLOv8 dataset folder")
    parser.add_argument("--target", type=str, default="dataset_roboflow", help="Path to the target combined dataset")
    args = parser.parse_args()
    merge_datasets(args.source, args.target)

import os
import shutil
import yaml
import argparse
from pathlib import Path

CANONICAL_CLASSES = [
    "xe_oto",
    "xe_tai",
    "xe_buyt",
    "nguoi",
    "cau_thang",
    "o_ga",
    "o_voi",
    "den_do",
    "den_vang",
    "den_xanh",
    "vach_qua_duong",
    "tien_1k",
    "tien_2k",
    "tien_5k",
    "tien_10k",
    "tien_20k",
    "tien_50k",
    "tien_100k",
    "tien_200k",
    "tien_500k",
]

VND_MAP = {
    # Money
    "1k": "tien_1k", "1000": "tien_1k", "1_000": "tien_1k", "1000vnd": "tien_1k", "1000_vnd": "tien_1k", "tien_1k": "tien_1k", "tien1k": "tien_1k",
    "2k": "tien_2k", "2000": "tien_2k", "2_000": "tien_2k", "2000vnd": "tien_2k", "2000_vnd": "tien_2k", "tien_2k": "tien_2k", "tien2k": "tien_2k",
    "5k": "tien_5k", "5000": "tien_5k", "5_000": "tien_5k", "5000vnd": "tien_5k", "5000_vnd": "tien_5k", "tien_5k": "tien_5k", "tien5k": "tien_5k",
    "10k": "tien_10k", "10000": "tien_10k", "10_000": "tien_10k", "10000vnd": "tien_10k", "10000_vnd": "tien_10k", "tien_10k": "tien_10k", "tien10k": "tien_10k",
    "20k": "tien_20k", "20000": "tien_20k", "20_000": "tien_20k", "20000vnd": "tien_20k", "20000_vnd": "tien_20k", "tien_20k": "tien_20k", "tien20k": "tien_20k",
    "50k": "tien_50k", "50000": "tien_50k", "50_000": "tien_50k", "50000vnd": "tien_50k", "50000_vnd": "tien_50k", "tien_50k": "tien_50k", "tien50k": "tien_50k",
    "100k": "tien_100k", "100000": "tien_100k", "100_000": "tien_100k", "100000vnd": "tien_100k", "100000_vnd": "tien_100k", "tien_100k": "tien_100k", "tien100k": "tien_100k",
    "200k": "tien_200k", "200000": "tien_200k", "200_000": "tien_200k", "200000vnd": "tien_200k", "200000_vnd": "tien_200k", "tien_200k": "tien_200k", "tien200k": "tien_200k",
    "500k": "tien_500k", "500000": "tien_500k", "500_000": "tien_500k", "500000vnd": "tien_500k", "500000_vnd": "tien_500k", "tien_500k": "tien_500k", "tien500k": "tien_500k",

    # Vehicles
    "car": "xe_oto", "oto": "xe_oto", "xe_hoi": "xe_oto", "xe hoi": "xe_oto", "automobile": "xe_oto",
    "truck": "xe_tai", "xe_tai": "xe_tai", "xe tai": "xe_tai",
    "bus": "xe_buyt", "xe_buyt": "xe_buyt", "xe_bus": "xe_buyt", "coach": "xe_buyt",

    # Human / stairs
    "person": "nguoi", "nguoi": "nguoi", "human": "nguoi", "man": "nguoi", "woman": "nguoi",
    "stairs": "cau_thang", "stairs_up": "cau_thang", "stairs_down": "cau_thang", "cau_thang": "cau_thang",

    # Hazards
    "pothole": "o_ga", "o_ga": "o_ga", "o ga": "o_ga",
    "open_manhole": "o_voi", "manhole": "o_voi", "o_voi": "o_voi", "o voi": "o_voi", "ho ga": "o_voi", "ho_ga": "o_voi",

    # Traffic lights
    "traffic_light_red": "den_do", "den_do": "den_do", "red": "den_do",
    "traffic_light_yellow": "den_vang", "den_vang": "den_vang", "yellow": "den_vang",
    "traffic_light_green": "den_xanh", "den_xanh": "den_xanh", "green": "den_xanh",

    # Crosswalk
    "crosswalk": "vach_qua_duong", "vach_qua_duong": "vach_qua_duong", "zebra": "vach_qua_duong",
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


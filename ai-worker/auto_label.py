import os
import cv2
import shutil
import glob
from ultralytics import YOLO

# Bản đồ ánh xạ ID từ COCO sang Custom Dataset
# COCO: 0=person, 2=car, 3=motorcycle, 5=bus, 7=truck
# Custom: 0=nguoi, 1=o_to, 2=xe_may, 3=xe_khach_tai
CLASS_MAP = {
    0: 0, # person -> nguoi
    2: 1, # car -> o_to
    3: 2, # motorcycle -> xe_may
    5: 3, # bus -> xe_khach_tai
    7: 3  # truck -> xe_khach_tai
}

# Mệnh giá tiền → Class ID
MONEY_CLASS_MAP = {
    "200d":  4,
    "500d":  5,
    "1k":    6,
    "2k":    7,
    "5k":    8,
    "10k":   9,
    "20k":  10,
    "50k":  11,
    "100k": 12,
    "200k": 13,
    "500k": 14,
}

ALL_CLASS_NAMES = {
    0: "nguoi",
    1: "o_to",
    2: "xe_may",
    3: "xe_khach_tai",
    4: "tien_200d",
    5: "tien_500d",
    6: "tien_1k",
    7: "tien_2k",
    8: "tien_5k",
    9: "tien_10k",
    10: "tien_20k",
    11: "tien_50k",
    12: "tien_100k",
    13: "tien_200k",
    14: "tien_500k",
}

def setup_dataset_dirs(base_dir="dataset"):
    for split in ["train", "valid"]:
        os.makedirs(os.path.join(base_dir, "images", split), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "labels", split), exist_ok=True)

def generate_yaml(base_dir="dataset"):
    names_block = "\n".join(f"  {k}: {v}" for k, v in ALL_CLASS_NAMES.items())
    yaml_content = f"""path: {os.path.abspath(base_dir)}
train: images/train
val: images/train

names:
{names_block}
"""
    with open(os.path.join(base_dir, "data.yaml"), "w", encoding="utf-8") as f:
        f.write(yaml_content)

def auto_label_street(model, input_dir, output_images_dir, output_labels_dir):
    print(f"[*] Đang Auto-Label thư mục đường phố: {input_dir}")
    images = glob.glob(os.path.join(input_dir, "*.jpg"))
    total_images = len(images)
    labeled_count = 0
    unreadable_count = 0
    print(f"[*] Street images found: {total_images}")
    for img_path in images:
        filename = os.path.basename(img_path)
        img = cv2.imread(img_path)
        if img is None:
            unreadable_count += 1
            continue
        
        # Chạy AI gốc nhận diện
        results = model(img, verbose=False)
        
        label_lines = []
        for det in results[0].boxes.data.tolist():
            x1, y1, x2, y2, conf, cls_id = det
            cls_id = int(cls_id)
            if cls_id in CLASS_MAP and conf > 0.4:
                # Chuyển đổi sang format YOLO chuẩn: x_center, y_center, width, height (normalize 0-1)
                h, w, _ = img.shape
                x_center = ((x1 + x2) / 2) / w
                y_center = ((y1 + y2) / 2) / h
                width = (x2 - x1) / w
                height = (y2 - y1) / h
                
                custom_id = CLASS_MAP[cls_id]
                label_lines.append(f"{custom_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
        
        # Chỉ lưu lại nếu có vật thể
        if label_lines:
            shutil.copy(img_path, os.path.join(output_images_dir, filename))
            with open(os.path.join(output_labels_dir, filename.replace(".jpg", ".txt")), "w") as f:
                f.write("\n".join(label_lines))
            labeled_count += 1
    print(f"[+] Street labeled: {labeled_count}/{total_images} images (unreadable: {unreadable_count})")

def auto_label_money(money_base_dir, output_images_dir, output_labels_dir):
    """
    Scan từng thư mục con mệnh giá trong money_base_dir (200d/, 1k/, 2k/, ..., 500k/)
    và gán class ID tương ứng.
    """
    labeled_count = 0
    for denomination, class_id in MONEY_CLASS_MAP.items():
        denom_dir = os.path.join(money_base_dir, denomination)
        if not os.path.isdir(denom_dir):
            print(f"[!] Thư mục {denom_dir} không tồn tại, bỏ qua mệnh giá {denomination}.")
            continue
        
        images = glob.glob(os.path.join(denom_dir, "*.jpg"))
        if not images:
            print(f"[!] Không tìm thấy ảnh .jpg trong {denom_dir}, bỏ qua.")
            continue
        
        print(f"[*] Đang label {len(images)} ảnh mệnh giá {denomination} (class_id={class_id})...")

        for img_path in images:
            filename = os.path.basename(img_path)
            img = cv2.imread(img_path)
            if img is None: continue
            
            h, w, _ = img.shape
            # Box hờ ở trung tâm (60% khung hình) - giả lập tờ tiền chiếm phần lớn ảnh
            x_center, y_center = 0.5, 0.5
            box_w, box_h = 0.6, 0.6
            
            # Tên file tránh trùng: thêm prefix mệnh giá
            safe_filename = f"{denomination}_{filename}"
            shutil.copy(img_path, os.path.join(output_images_dir, safe_filename))
            with open(os.path.join(output_labels_dir, safe_filename.replace(".jpg", ".txt")), "w") as f:
                f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {box_w:.6f} {box_h:.6f}\n")
            labeled_count += 1
    
    print(f"[+] Tổng cộng {labeled_count} ảnh tiền đã được label theo mệnh giá.")

if __name__ == "__main__":
    print("Khởi động AI Giáo Viên (yolo11n.pt)...")
    try:
        model = YOLO("yolo11n.pt")
    except:
        model = YOLO("yolov8n.pt") # Fallback
        
    setup_dataset_dirs("dataset")
    generate_yaml("dataset")
    
    # Label đường phố (Bỏ vào tập train)
    auto_label_street(model, "frames/xe-co-duong-pho", "dataset/images/train", "dataset/labels/train")
    
    # Label tiền mặt theo từng mệnh giá (Bỏ vào tập train)
    auto_label_money("frames/tien-vn", "dataset/images/train", "dataset/labels/train")
    
    print("[+] Hoàn thành Auto-Labeling. Sẵn sàng cho train_yolo.py!")

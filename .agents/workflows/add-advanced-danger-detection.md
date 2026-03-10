---
description: Thêm tính năng phát hiện nguy hiểm nâng cao - nhận diện lửa, nước tràn, ổ điện hở, vật nhọn
---

## Mục tiêu

Mở rộng khả năng phát hiện nguy hiểm hiện tại bằng cách thêm các class mới vào model YOLO:
lửa/khói, nước tràn sàn, ổ điện hở, vật nhọn nằm dưới đất. Cảnh báo khẩn cấp qua TTS và rung mạnh.

---

## Bước 1: Thu thập và chuẩn bị dataset

1. Tải dataset từ các nguồn public miễn phí:
   - **Lửa/Khói**: Search "fire smoke detection" trên [Roboflow Universe](https://universe.roboflow.com)
   - **Nước tràn**: Search "water floor detection" hoặc tự thu thập ảnh
   - **Vật nhọn**: Search "sharp objects detection" trên Roboflow
   - **Ổ điện hở**: Thu thập ảnh thủ công, cần khoảng 200-300 ảnh
2. Export dataset theo định dạng **YOLOv8** (folder `images/` + `labels/` + `data.yaml`)
3. Ghép với dataset hiện có trong `ai-worker/dataset/`:
   - Cập nhật file `data.yaml` thêm class mới vào danh sách `names`

---

## Bước 2: Train thêm model YOLO

1. Mở terminal và bật môi trường:
   ```bash
   cd ai-worker
   .\.venv\Scripts\activate
   ```
2. Sử dụng best.pt hiện tại làm base để fine-tune (transfer learning):
   ```bash
   yolo task=detect mode=train \
     model=runs/detect/vision_assistant_model/weights/best.pt \
     data=dataset/data.yaml \
     epochs=30 imgsz=640 batch=8 \
     name=danger_v2_model
   ```
3. Model mới lưu tại: `ai-worker/runs/detect/danger_v2_model/weights/best.pt`

---

## Bước 3: Cập nhật Model Manager

1. Mở `ai-worker/services/model_manager.py`
2. Cập nhật đường dẫn model mới:
   ```python
   MODEL_PATH = "runs/detect/danger_v2_model/weights/best.pt"
   ```
3. Thêm mapping class mới vào dict `DANGER_CLASSES`:
   ```python
   DANGER_CLASSES = {
       "fire": "NGUY HIỂM! Phát hiện lửa",
       "smoke": "Cảnh báo có khói",
       "water_floor": "Sàn nhà có nước, trơn trượt",
       "sharp_object": "Vật nhọn dưới đất, cẩn thận",
       "exposed_socket": "Ổ điện hở, nguy hiểm điện",
       # ... các class hiện tại ...
   }
   ```

---

## Bước 4: Phân loại mức độ cảnh báo

1. Mở `ai-worker/services/detection_service.py` (hoặc file xử lý tương ứng)
2. Thêm logic phân mức cảnh báo:
   - 🔴 **Khẩn cấp** (lửa, ổ điện hở): Phát âm thanh còi + TTS ngay lập tức, lặp lại 3 lần
   - 🟡 **Cảnh báo** (nước sàn, vật nhọn): TTS 1 lần, rung haptic
   - 🟢 **Thông tin** (khói nhẹ): TTS nhẹ nhàng
3. Bổ sung field `severity` vào response gửi về Mobile.

---

## Bước 5: Cập nhật Mobile App xử lý cảnh báo khẩn cấp

1. Mở file xử lý WebSocket result trong `mobile_app/lib/`
2. Với cảnh báo mức **Khẩn cấp**:
   - Phát âm thanh cảnh báo riêng (file MP3 lưu trong `assets/sounds/`)
   - Rung mạnh (pattern: 500ms - 200ms - 500ms)
   - TTS đọc lặp lại 3 lần với giọng khẩn cấp
3. Thêm file âm thanh cảnh báo: `mobile_app/assets/sounds/danger_alert.mp3`
4. Cập nhật `pubspec.yaml` để khai báo asset mới.

---

## Bước 6: Kiểm thử

Các case cần test:

- [ ] Hướng camera vào ngọn lửa/video lửa → cảnh báo ngay lập tức
- [ ] Sàn ướt → phát hiện và thông báo
- [ ] Ổ điện hở → cảnh báo khẩn cấp kèm âm thanh còi
- [ ] Vật thể thông thường → không báo nhầm (tránh false positive)
- [ ] Nhiều nguy hiểm cùng lúc → ưu tiên cảnh báo mức cao nhất trước

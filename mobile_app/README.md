# Mobile App (Flutter)

Ứng dụng trợ năng dành cho người suy giảm thị lực. App chụp ảnh, gửi lên Gateway qua WebSocket để AI xử lý, đọc kết quả bằng TTS và rung cảnh báo. Ngoài ra có điều hướng GPS, SOS và nhận diện offline.

---

## Chức năng hiện có

- Nhận diện tiền online (YOLO) + fallback offline (TFLite nếu có model).
- OCR online bằng Tesseract (TEXT_OCR).
- OCR offline/nhanh bằng ML Kit (Text + Barcode).
- Mô tả cảnh + cảnh báo nguy hiểm theo vị trí trái/giữa/phải.
- Điều hướng cơ bản (GPS + la bàn + OSRM).
- Visual Q&A (nút riêng, dùng Gemini từ AI Worker).
- SOS khẩn cấp (nhấn giữ hoặc nút cứng).

---

## 🧭 Các chế độ chính

- **Mode 0 – Tổng hợp/Tiền:** `OCR` online, fallback offline nếu có TFLite.
- **Mode 1 – Đọc văn bản online:** `TEXT_OCR` trên server.
- **Mode 2 – Đọc nhanh offline:** ML Kit Text + Barcode.
- **Mode 3 – Mô tả cảnh:** `CAPTION` + danger alerts.
- **Mode 4 – Điều hướng:** GPS + la bàn + hướng dẫn đường.

---

## Yêu cầu

- Flutter SDK mới nhất
- Android Studio hoặc Xcode
- Backend Gateway đang chạy
- Quyền: camera, microphone, location, notification

---

## ⚙️ Cài đặt & chạy

```bash
cd mobile_app
flutter pub get
```

### Chạy trên Android Emulator

```bash
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000
```

### Chạy trên máy thật

```bash
flutter run --dart-define=BACKEND_URL=http://192.168.1.X:3000
```

### Optional: WS_TOKEN khi muốn test nhanh

```bash
flutter run \
  --dart-define=BACKEND_URL=http://10.0.2.2:3000 \
  --dart-define=WS_TOKEN=<jwt>
```

Ghi chú: bình thường app sẽ login và tự set token vào WebSocket, `WS_TOKEN` chỉ để test.

---

## 📦 Offline TFLite

Thêm file model `.tflite` vào:

```
mobile_app/assets/models/money_detector.tflite
```

Và chắc chắn `pubspec.yaml` đã include `assets/models/`.

---

## 🌐 Phụ thuộc mạng

Các tính năng sau cần Internet:

- Điều hướng (OSRM, Nominatim).
- Barcode lookup (OpenFoodFacts).
- Visual Q&A (Gemini).
- AI online (YOLO/OCR).

---

## 🛠 Troubleshooting

- **Không kết nối WebSocket:** kiểm tra login và `BACKEND_URL`.
- **Không có offline model:** chưa đặt file `.tflite` vào `assets/models/`.
- **OCR online lỗi:** kiểm tra AI Worker + Tesseract.
- **Không điều hướng:** kiểm tra permission GPS.

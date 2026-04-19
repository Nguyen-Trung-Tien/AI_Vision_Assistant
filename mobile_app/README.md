# Mobile App (Flutter)

Ứng dụng trợ năng thông minh dành cho người khiếm thị và người bị suy giảm thị lực. Sử dụng sức mạnh của Flutter và AI để mang lại khả năng "nhìn" thông qua phản hồi bằng giọng nói và rung động.

---

## 🌟 Tính năng nổi bật (v1.5.0)

- **Continuous Stream (Walking Mode)**: Chế độ đi bộ 3-5 FPS, phân tích môi trường liên tục mà không cần thao tác tay.
- **Face Recognition**: Nhận diện người thân, bạn bè đã đăng ký và phát tên qua giọng nói.
- **MiDaS Depth Estimation**: Ước lượng khoảng cách vật cản chính xác hơn bằng mô hình chiều sâu chuyên dụng.
- **Smart OCR**: Sử dụng Gemini AI để đọc thực đơn, hóa đơn và biển báo phức tạp.
- **Emergency Network**: Tự động liên hệ người thân (SMS/Cuộc gọi) khi kích hoạt SOS.
- **Spatial Audio 3D**: Cảnh báo hướng vật cản (Trái/Phải/Giữa) qua âm thanh nổi (Stereo).
- **Visual Feedback**: Hiển thị khung bao vật thể (Bounding Boxes) ngay trên màn hình preview.

---

## 🧭 Các chế độ hoạt động

| Chế độ | Tên | Chức năng |
| --- | --- | --- |
| **Mode 0** | Nhận diện vật thể | Nhận diện 20 lớp đối tượng và tiền VNĐ. |
| **Mode 1** | OCR Online | Đọc văn bản tiếng Việt qua máy chủ (Tesseract/Gemini). |
| **Mode 2** | OCR Offline | Đọc nhanh văn bản và mã vạch (Google ML Kit). |
| **Mode 3** | Mô tả cảnh | Phân tích không gian, vật cản và đo khoảng cách MiDaS. |
| **Mode 4** | Điều hướng GPS | Chỉ đường bằng giọng nói qua OSRM & OpenStreetMap. |
| **Mode 5** | Chế độ đi bộ | **Walking Mode**: Stream liên tục, tích hợp Face Recognition. |
| **Q&A** | Hỏi đáp AI | Trò chuyện trực tiếp với Gemini về hình ảnh trước mặt. |

---

## ⚙️ Cài đặt & Chạy

### 1. Yêu cầu hệ thống
- **Flutter SDK**: Phiên bản 3.10 trở lên.
- **Quyền truy cập**: Camera, GPS, Microphone, Notification, Contacts, Bluetooth (cho Spatial Audio).

### 2. Khởi chạy

```bash
cd mobile_app
flutter pub get

# Chạy trên Android Emulator (Backend mặc định là 10.0.2.2)
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000

# Chạy trên máy thật (Thay X bằng địa chỉ IP máy tính của bạn)
flutter run --dart-define=BACKEND_URL=http://192.168.1.X:3000
```

---

## 📂 Cài đặt Offline Model (TFLite)

Để ứng dụng hoạt động khi không có Internet (Mode 0 & Mode 2), hãy đặt các file mô hình vào:
- `mobile_app/assets/models/best_float32.tflite`
- `mobile_app/assets/models/best_float16.tflite`

Đảm bảo đã khai báo các file này trong `pubspec.yaml`.

---

## 🛠 Xử lý sự cố

- **Lỗi kết nối Backend**: Kiểm tra `BACKEND_URL` trong lệnh chạy. Đảm bảo điện thoại và máy tính cùng mạng WiFi.
- **Không nghe thấy giọng nói**: Kiểm tra âm lượng Media và cài đặt TTS trên điện thoại.
- **SOS không hoạt động**: Đảm bảo đã cấp quyền gửi SMS và quản lý danh bạ.
- **Lag/Giật**: Kiểm tra dung lượng pin. Chế độ Walking Mode sẽ tự động giảm FPS khi pin yếu để tiết kiệm năng lượng.


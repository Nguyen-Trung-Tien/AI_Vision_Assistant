<div align="center">

# 📱 Mobile App (Flutter)

### Con mắt thông minh trên nền tảng di động

_Giao diện tương tác trực tiếp với người khiếm thị. Sử dụng sức mạnh phần cứng di động (Camera, GPS, Haptic) kết hợp phản hồi giọng nói (TTS) để dẫn đường và nhận diện._

<br/>

![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter&logoColor=white&style=for-the-badge)
![Dart](https://img.shields.io/badge/Dart-3.x-0175C2?logo=dart&logoColor=white&style=for-the-badge)
![Android](https://img.shields.io/badge/Android_Ready-3DDC84?logo=android&logoColor=white&style=for-the-badge)
![TFLite](https://img.shields.io/badge/TFLite-Offline_AI-FF6F00?logo=tensorflow&logoColor=white&style=for-the-badge)

</div>

---

## 🌟 Tính năng trải nghiệm nổi bật

- 🎨 **Thiết kế thân thiện (Thumb Zone Design)**: Tối ưu UI cho việc thao tác một ngón cái. Giao diện HUD không chồng chéo, màn hình Settings dạng Card hiện đại.
- 🚶 **Continuous Stream (Walking Mode)**: Tự động phân tích môi trường xung quanh với tốc độ 3-5 FPS, điều chỉnh thông minh theo dung lượng pin.
- 🔊 **Speaking Overlay & Spatial Audio 3D**: Âm thanh không gian trái/phải báo hiệu hướng vật cản. Có hình ảnh sóng âm trực quan khi TTS phát giọng nói.
- 🎯 **Mode Animations & Color System**: Mỗi chế độ (Mode) đều có màu sắc đại diện (Gold/Blue/Teal...) kèm animation riêng, mang lại trải nghiệm sống động.
- 🚨 **Mạng lưới Khẩn cấp (SOS Network)**: Gửi tín hiệu cấp cứu kèm tọa độ GPS trực tiếp lên Admin Dashboard.
- 📺 **Visual Feedback Real-time**: Khung bao (Bounding Boxes) vẽ mượt mà trực tiếp trên camera preview.

---

## 🧭 Bảng chế độ điều khiển (Carousel Modes)

| 🎛️ Chế độ | 🎨 Màu sắc | 🎯 Tính năng cốt lõi | Môi trường |
| :--- | :--- | :--- | :--- |
| **Mode 0: Nhận diện tổng hợp** | 🟡 Gold | Tìm kiếm chướng ngại vật đường phố, định vị và đọc mệnh giá tiền VNĐ. | Online / Offline |
| **Mode 1: Mô tả không gian** | 🔵 Blue | Quét cấu trúc cảnh, thông báo vị trí các vật cản (trái, phải, giữa) và ước tính khoảng cách. | Online |
| **Mode 2: Nhận diện người** | 🩵 Teal | Gọi tên chính xác người thân/bạn bè đã đăng ký trước. | Online |
| **Mode 3: Chỉ hướng** | 💜 Purple | Tích hợp la bàn và dẫn đường qua hệ thống OpenStreetMap. | Online |
| **Mode 4: Đọc văn bản (Online)**| 🔹 Cyan | Engine đọc OCR mạnh mẽ thông qua Server. | Online |
| **Mode 5: Đọc tệp** | 🟠 Orange | Nghe đọc nội dung từ file PDF, DOCX, TXT. | Offline |
| **Mode 6: Đọc siêu tốc (Offline)**| 🟢 Green | Nhận diện mã vạch và Text bằng ML Kit hoàn toàn không cần mạng. | Offline |
| **Mode 7: Phân tích bố cục** | 🩷 Pink | Đọc sách và thực đơn phân tầng phức tạp bằng Gemini. | Online |

> 💡 **Q&A Mode**: Được kích hoạt riêng qua phím nóng, cho phép hội thoại trực tiếp với AI về khung cảnh trước mặt.

---

## ⚙️ Hướng dẫn cài đặt & Chạy ứng dụng

### 1️⃣ Yêu cầu môi trường
- **Flutter SDK**: Phiên bản `3.10` trở lên.
- **Quyền (Permissions)**: Camera, Micro (STT), GPS (Vị trí), Bluetooth (Âm thanh nổi).

### 2️⃣ Cài đặt thư viện

```bash
cd mobile_app
flutter pub get
```

### 3️⃣ Biên dịch và Chạy

**Nếu chạy trên máy ảo Android (Emulator):**
```bash
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000
```

**Nếu chạy trên thiết bị thật (Physical Device):**
Hãy chắc chắn điện thoại và máy tính nằm chung mạng Wi-Fi. (Ví dụ IP máy tính là `192.168.1.15`)
```bash
flutter run --dart-define=BACKEND_URL=http://192.168.1.15:3000
```

---

## 📂 Triển khai AI Ngoại tuyến (TFLite)

Để tính năng nhận diện tiền/vật thể hoạt động mượt mà ở nơi mất sóng Internet, bạn cần đặt các file model đã train vào thư mục assets:

1. Đặt model tại: `mobile_app/assets/models/best_float32.tflite`
2. Kiểm tra lại việc khai báo tài nguyên trong `pubspec.yaml`:
   ```yaml
   assets:
     - assets/models/best_float32.tflite
   ```

---

## 🛠 Xử lý sự cố (Troubleshooting)

- 🔴 **Lỗi kết nối (Connection Refused)**: Do sai địa chỉ `BACKEND_URL`. Đảm bảo Gateway đang chạy trên máy chủ ở cổng `3000`.
- 🔴 **Không nghe TTS**: Kiểm tra âm lượng Media của điện thoại và đảm bảo thiết bị đã cài đặt "Google Text-To-Speech" cho tiếng Việt.
- 🔴 **App lag, khung hình giật**: Tính năng *Walking Mode* liên tục vắt kiệt sức mạnh máy. Hệ thống tự động giảm FPS khi pin yếu để cân bằng năng lượng.

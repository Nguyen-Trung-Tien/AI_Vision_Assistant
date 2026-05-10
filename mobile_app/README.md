# Mobile App (Flutter)

Ứng dụng trợ năng thông minh dành cho người khiếm thị và người bị suy giảm thị lực. Sử dụng sức mạnh của Flutter và AI để mang lại khả năng "nhìn" thông qua phản hồi bằng giọng nói và rung động.

---

## 🗓️ Lịch sử cập nhật (Mobile)

| Ngày | Cập nhật | Chi tiết |
| --- | --- | --- |
| **10/05** | 📱 Layout Optimization | Tối ưu bố cục: HUD và các nút chức năng không chồng chéo, tối ưu cho thao tác một tay. |
| **10/05** | ⚙️ Modern Settings | Giao diện Cài đặt mới dạng Card, hiện đại và dễ truy cập hơn. |
| **10/05** | 🎨 Mode Animations | Animation riêng cho 7 chế độ (Money/Caption/Face/OCR/File/Layout) với màu sắc và hiệu ứng khác biệt. |
| **10/05** | 🔊 Speaking Overlay | Hiệu ứng sóng âm waveform khi TTS đang đọc kết quả, giữ overlay cho đến khi đọc xong. |
| **10/05** | 🎯 Mode Color System | Mỗi chế độ có màu riêng (Gold/Blue/Teal/Cyan/Orange/Green/Pink) trên carousel, icon và indicator. |
| **17/04** | 🧠 Face Registration | Thêm phản hồi giọng nói & rung khi đăng ký khuôn mặt thành công. |
| **17/04** | 📄 File Reader Fix | Sửa lỗi OCR Offline, trích xuất văn bản từ file PDF và .txt. |
| **15/04** | 📺 Visual Feedback | Hiển thị Bounding Boxes + Object Chips trực tiếp trên camera preview. |
| **15/04** | 🔊 Spatial Audio 3D | Cảnh báo vật cản trái/phải qua tai nghe stereo. |
| **04/04** | 🚨 Emergency Network | Tự động SMS + cuộc gọi đến người thân khi SOS. |
| **04/04** | 🚶 Walking Mode | Hoàn thiện luồng stream 3-5 FPS liên tục. |
| **27/02** | 🗺️ OSM Migration | Chuyển từ Google Maps sang OpenStreetMap & OSRM. |
| **25/02** | 🎤 Voice Commands | Điều khiển ứng dụng bằng giọng nói (STT). |

---

## 🌟 Tính năng nổi bật (v1.9.0)

- **Layout Optimization**: Tự động sắp xếp các thành phần UI để tránh chồng chéo (HUD, Banners, Buttons).
- **Modern Settings Screen**: Thiết kế card-based hiện đại, phân loại cài đặt khoa học và trực quan.
- **Thumb Zone Design**: Các nút tương tác chính được đặt ở vị trí thuận tiện nhất cho thao tác một ngón cái.
- **Mode-Specific Animations**: Mỗi chế độ có animation và màu sắc riêng biệt (Gold/Blue/Teal/Cyan/Orange/Green/Pink).
- **Speaking Overlay**: Hiệu ứng sóng âm waveform hiển thị trong suốt quá trình TTS đọc kết quả.
- **Continuous Stream (Walking Mode)**: Chế độ đi bộ 3-5 FPS, phân tích môi trường liên tục mà không cần thao tác tay.
- **Face Recognition**: Nhận diện người thân, bạn bè đã đăng ký và phát tên qua giọng nói.
- **MiDaS Depth Estimation**: Ước lượng khoảng cách vật cản chính xác hơn bằng mô hình chiều sâu chuyên dụng.
- **Smart OCR**: Sử dụng Gemini AI để đọc thực đơn, hóa đơn và biển báo phức tạp.
- **Emergency Network**: Tự động liên hệ người thân (SMS/Cuộc gọi) khi kích hoạt SOS.
- **Spatial Audio 3D**: Cảnh báo hướng vật cản (Trái/Phải/Giữa) qua âm thanh nổi (Stereo).
- **Visual Feedback**: Hiển thị khung bao vật thể (Bounding Boxes) ngay trên màn hình preview.

---

## 🧭 Các chế độ hoạt động

| Chế độ | Tên | Màu | Chức năng |
| --- | --- | --- | --- |
| **Mode 0** | Nhận diện tiền | 🟡 Gold | Nhận diện tiền VNĐ và vật thể. |
| **Mode 1** | Mô tả cảnh | 🔵 Blue | Phân tích không gian, vật cản và khoảng cách. |
| **Mode 2** | Nhận diện mặt | 🩵 Teal | Nhận diện người thân đã đăng ký. |
| **Mode 3** | Điều hướng GPS | 💜 Purple | Chỉ đường bằng giọng nói qua OSRM & OSM. |
| **Mode 4** | OCR Online | 🔹 Cyan | Đọc văn bản tiếng Việt qua máy chủ AI. |
| **Mode 5** | Đọc tệp | 🟠 Orange | Đọc file PDF, TXT, DOCX. |
| **Mode 6** | OCR Offline | 🟢 Green | Đọc nhanh văn bản (Google ML Kit). |
| **Mode 7** | Phân tích bố cục | 🩷 Pink | Phân tích layout trang/tài liệu. |
| **Q&A** | Hỏi đáp AI | — | Trò chuyện với Gemini về hình ảnh. |

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


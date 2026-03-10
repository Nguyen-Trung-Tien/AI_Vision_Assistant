---
description: Thêm tính năng GPS điều hướng ngoài trời - hướng dẫn đường bằng giọng tiếng Việt cho người khiếm thị
---

## Mục tiêu

Tích hợp Google Maps SDK vào mobile app, cho phép người dùng nói tên điểm đến → AI lập lịch trình
→ hướng dẫn từng bước đường đi bằng TTS tiếng Việt, kết hợp với camera nhận diện vật cản.

---

## Bước 1: Đăng ký Google Maps API

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Bật các API:
   - **Maps SDK for Android/iOS**
   - **Directions API**
   - **Places API** (để tìm kiếm điểm đến bằng giọng nói)
   - **Geocoding API**
3. Tạo API Key và giới hạn theo package name của app.
4. Thêm key vào:
   - Android: `mobile_app/android/app/src/main/AndroidManifest.xml`
   - iOS: `mobile_app/ios/Runner/AppDelegate.swift`

---

## Bước 2: Thêm dependency vào Mobile App

1. Mở `mobile_app/pubspec.yaml`, thêm:
   ```yaml
   google_maps_flutter: ^2.6.0
   geolocator: ^11.0.0
   flutter_tts: ^4.0.2 # Đã có sẵn
   speech_to_text: ^6.6.0 # Đã có sẵn từ Visual Q&A
   dio: ^5.4.3 # HTTP client để gọi Directions API
   ```
2. Chạy `flutter pub get`

---

## Bước 3: Tạo màn hình điều hướng

1. Tạo `mobile_app/lib/screens/navigation_screen.dart`
2. Layout gồm:
   - **Nút mic lớn** ở giữa màn hình để nói tên điểm đến
   - **GoogleMap widget** nhỏ ở góc (hoặc ẩn hoàn toàn để tiết kiệm pin)
   - **Thanh thông tin** hiển thị bước hướng dẫn hiện tại (text lớn, tương phản cao)
3. Khi vào màn hình: TTS nói ngay _"Hãy nói tên địa điểm bạn muốn đến"_

---

## Bước 4: Xử lý tìm kiếm điểm đến bằng giọng nói

1. Tạo `mobile_app/lib/services/navigation_service.dart`
2. Luồng xử lý:
   - Ghi âm giọng nói → convert to text (Speech-to-Text)
   - Gọi Places API với text tìm kiếm → lấy `place_id` và tọa độ
   - Nếu tìm thấy: TTS xác nhận _"Bạn muốn đến [Tên địa điểm] không? Bấm xác nhận hoặc nói Có"_
   - Nếu nhiều kết quả: đọc to 3 lựa chọn đầu để user chọn
3. Gọi Directions API để lấy lộ trình từ vị trí hiện tại đến đích.

---

## Bước 5: Implement hướng dẫn từng bước real-time

1. Parse response từ Directions API, lấy danh sách `steps`
2. Loại bỏ HTML tags trong `html_instructions`, chuyển sang text thuần
3. Theo dõi vị trí GPS real-time bằng `Geolocator.getPositionStream()`
4. Khi đến gần điểm rẽ (< 30m): TTS đọc hướng dẫn bước tiếp theo
   - Ví dụ: _"Sau 50 mét, rẽ phải vào đường Nguyễn Huệ"_
5. Đặt lại lộ trình tự động nếu user đi sai đường (recalculate khi lệch > 50m).

---

## Bước 6: Tích hợp với camera nhận diện vật cản

1. Khi đang điều hướng, duy trì chế độ camera nhận diện vật cản song song
2. Ưu tiên cảnh báo: Vật cản (ngay lập tức) > Hướng dẫn rẽ (chờ sau cảnh báo)
3. Tránh TTS chồng lên nhau: dùng queue, đọc xong cái trước mới đọc cái sau.

---

## Bước 7: Kiểm thử

Các case cần test:

- [ ] Nói _"Cà phê Starbucks gần nhất"_ → tìm đúng địa điểm
- [ ] Đi đúng đường → hướng dẫn đúng từng bước
- [ ] Đi sai → tự tính lại lộ trình trong < 5 giây
- [ ] Mất GPS → thông báo qua TTS
- [ ] Cùng lúc phát hiện vật cản và cần hướng dẫn rẽ → ưu tiên đúng
- [ ] Pin tiêu thụ: theo dõi không tăng quá 30%/giờ so với không dùng tính năng

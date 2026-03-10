---
description: Thêm tính năng quét QR Code / Barcode để tra cứu thông tin sản phẩm và đọc TTS cho người khiếm thị
---

## Mục tiêu

Người dùng hướng camera vào mã QR hoặc barcode → app tự động nhận diện và đọc to tên sản phẩm,
hạn sử dụng, và thông tin cơ bản qua TTS. Không cần server xử lý, xử lý hoàn toàn trên thiết bị.

---

## Bước 1: Thêm dependency vào Mobile App

1. Mở `mobile_app/pubspec.yaml`
2. Thêm các package sau vào `dependencies`:
   ```yaml
   mobile_scanner: ^5.0.0
   http: ^1.2.0 # Đã có sẵn, dùng để tra API sản phẩm
   ```
3. Chạy lệnh cập nhật:
   ```bash
   cd mobile_app
   flutter pub get
   ```

---

## Bước 2: Tạo màn hình Scanner

1. Tạo file `mobile_app/lib/screens/barcode_scanner_screen.dart`
2. Dùng widget `MobileScanner` để hiển thị camera preview với overlay khung quét.
3. Callback `onDetect`: khi phát hiện mã → gọi hàm xử lý và tạm dừng scan.
4. Thiết kế UI tối giản, nút lớn, contrast cao (dễ nhận biết kể cả người thị lực kém).

---

## Bước 3: Tra cứu thông tin sản phẩm qua API

1. Tạo file `mobile_app/lib/services/product_lookup_service.dart`
2. Với **QR Code**: parse trực tiếp nội dung text, URL, hoặc JSON trong mã.
3. Với **Barcode (EAN/UPC)**: gọi API miễn phí:
   - Open Food Facts: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
   - Trả về: tên sản phẩm, thương hiệu, hạn dùng, thành phần.
4. Xử lý lỗi: trả về thông báo TTS _"Không tìm thấy thông tin sản phẩm này"_ nếu API không có dữ liệu.

---

## Bước 4: Tích hợp TTS để đọc kết quả

1. Mở `mobile_app/lib/services/tts_service.dart` (file đã có)
2. Sau khi tra cứu xong, gọi TTS đọc chuỗi kết quả, ví dụ:
   > _"Sản phẩm: Sữa TH True Milk. Thương hiệu: TH. Hạn sử dụng: 20 tháng 5 năm 2025."_
3. Thêm rung (haptic feedback) khi phát hiện mã thành công.

---

## Bước 5: Thêm vào navigation chính

1. Mở `mobile_app/lib/main.dart` hoặc file routing chính.
2. Thêm mode/nút mới: **"Quét mã sản phẩm"** vào màn hình điều hướng.
3. Gán gesture kép (double tap) hoặc nút vật lý volume để kích hoạt nhanh.

---

## Bước 6: Kiểm thử

Các case cần test:

- [ ] Quét QR Code chứa URL → đọc to URL
- [ ] Quét barcode sản phẩm có trên Open Food Facts → đọc tên đúng
- [ ] Quét barcode không tồn tại → thông báo lỗi rõ ràng
- [ ] Ánh sáng yếu → camera vẫn nhận diện được
- [ ] Từ lúc quét đến lúc TTS đọc < 2 giây

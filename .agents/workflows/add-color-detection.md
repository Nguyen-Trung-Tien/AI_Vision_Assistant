---
description: Thêm tính năng nhận diện màu sắc quần áo và vật thể - đọc TTS mô tả màu sắc
---

## Mục tiêu

Người dùng hướng camera vào quần áo hoặc vật thể, app tự động phân tích và đọc to màu chủ đạo.
Ví dụ: _"Chiếc áo màu xanh dương đậm"_, _"Chiếc cốc màu đỏ tươi bên tay trái"_.
Xử lý hoàn toàn trên thiết bị, không cần server.

---

## Bước 1: Thêm dependency vào Mobile App

1. Mở `mobile_app/pubspec.yaml`
2. Thêm package:
   ```yaml
   palette_generator: ^0.3.3
   image: ^4.1.7
   ```
3. Cập nhật:
   ```bash
   cd mobile_app
   flutter pub get
   ```

---

## Bước 2: Tạo service phân tích màu sắc

1. Tạo file `mobile_app/lib/services/color_detection_service.dart`
2. Implement hàm `detectDominantColors(Uint8List imageBytes) -> List<ColorResult>`:
   - Dùng `PaletteGenerator.fromImageProvider()` để lấy 3-5 màu chủ đạo
   - Map giá trị HSV sang tên màu tiếng Việt (đỏ, xanh lam, vàng, trắng, đen, nâu...)
   - Trả về danh sách màu theo tỷ lệ xuất hiện (màu chiếm nhiều nhất ở đầu)
3. Bảng map màu cần xây dựng:
   - Đỏ: Hue 0-15°, 345-360°
   - Cam: Hue 15-45°
   - Vàng: Hue 45-70°
   - Xanh lá: Hue 70-150°
   - Xanh lam/dương: Hue 150-250°
   - Tím: Hue 250-310°
   - Hồng: Hue 310-345°

---

## Bước 3: Tích hợp vào chế độ chụp ảnh

1. Thêm nút **"Nhận diện màu"** vào màn hình camera chính.
2. Khi bấm: chụp frame → gọi `ColorDetectionService.detectDominantColors()`
3. Format kết quả thành câu tự nhiên:
   - 1 màu: _"Màu chủ đạo là xanh dương"_
   - Nhiều màu: _"Chủ yếu màu trắng, điểm thêm màu xanh lá và đỏ"_
4. Gọi TTS đọc kết quả.

---

## Bước 4: Thêm tính năng nhận diện màu vùng cụ thể

1. Nâng cao: Cho phép người dùng chỉ định vùng ảnh bằng giọng nói:
   - _"Màu sắc bên trái"_ → crop 1/3 trái ảnh rồi phân tích
   - _"Màu sắc chính giữa"_ → crop vùng trung tâm
2. Tích hợp với Google ML Kit Object Detection để xác định vị trí vật thể trước khi lấy màu.

---

## Bước 5: Kiểm thử

Các case cần test:

- [ ] Áo đơn sắc → nhận đúng màu
- [ ] Áo kẻ sọc nhiều màu → mô tả đủ các màu chính
- [ ] Ảnh tối → thông báo "ánh sáng không đủ"
- [ ] Vật thể trắng trên nền trắng → nhận diện và phân biệt được
- [ ] Độ trễ xử lý < 500ms (xử lý on-device)

---
description: Thêm tính năng nhận diện khuôn mặt người quen - thông báo tên người đứng trước mặt qua TTS
---

## Mục tiêu

Người dùng đăng ký trước ảnh khuôn mặt người thân/bạn bè. Khi gặp ngoài đời thực,
AI so sánh khuôn mặt trong camera và thông báo qua TTS: _"Nguyễn Văn A đang đứng trước mặt bạn"_.
Không cần train model, dùng thư viện `face_recognition` (dlib).

---

## Bước 1: Cài thư viện face_recognition trong AI Worker

```bash
cd ai-worker
.\.venv\Scripts\activate
pip install face_recognition numpy pillow
pip freeze > requirements.txt
```

> ⚠️ Trên Windows cần cài CMake và Visual Studio Build Tools trước nếu dlib chưa có.

---

## Bước 2: Tạo service nhận diện khuôn mặt

1. Tạo file `ai-worker/services/face_recognition_service.py`
2. Implement các hàm:
   - `load_known_faces(user_id: str) -> list`: Load encoding khuôn mặt từ database/file
   - `recognize_face(image_bytes: bytes, user_id: str) -> str | None`: So khớp và trả tên
   - `register_face(image_bytes: bytes, name: str, user_id: str) -> bool`: Đăng ký khuôn mặt mới
3. Lưu face encodings dưới dạng `.npy` file theo từng `user_id` (hoặc lưu vào PostgreSQL dạng JSON).

---

## Bước 3: Thêm endpoint đăng ký khuôn mặt vào Backend Gateway

1. Tạo module mới: `backend-gateway/src/face/`
2. Tạo file `face.controller.ts` với các endpoint:
   - `POST /face/register` — Nhận ảnh + tên → gửi AI Worker xử lý encoding → lưu DB
   - `GET /face/list` — Lấy danh sách khuôn mặt đã đăng ký của user
   - `DELETE /face/:id` — Xóa khuôn mặt đã đăng ký
3. Kết nối AI Worker qua HTTP hoặc RabbitMQ để xử lý encoding.

---

## Bước 4: Thêm mode nhận diện vào RabbitMQ Consumer

1. Mở `ai-worker/rabbitmq_consumer.py`
2. Thêm case `mode = "face_recognition"`:
   - Nhận frame từ mobile
   - Gọi `face_recognition_service.recognize_face(image, user_id)`
   - Trả về tên người nhận diện được hoặc `"unknown"`

---

## Bước 5: Thêm màn hình đăng ký khuôn mặt trên Mobile App

1. Tạo `mobile_app/lib/screens/face_register_screen.dart`
2. UI gồm:
   - Ô nhập tên người (bàn phím hoặc giọng nói)
   - Camera preview để chụp ảnh khuôn mặt
   - Hướng dẫn bằng âm thanh: _"Đưa khuôn mặt người cần đăng ký vào giữa khung hình"_
   - Nút chụp và xác nhận
3. Gửi ảnh + tên lên endpoint `POST /face/register`.

---

## Bước 6: Tích hợp nhận diện real-time

1. Trong chế độ stream camera chính, khi phát hiện khuôn mặt (dùng ML Kit Face Detection):
   - Crop vùng khuôn mặt → gửi lên server với `mode = "face_recognition"`
   - Giới hạn tần suất gửi: 1 lần/2 giây để tránh spam
2. Nhận kết quả → TTS đọc tên nếu nhận ra, im lặng nếu không nhận ra.
3. Không lặp lại thông báo cùng một người trong 10 giây.

---

## Bước 7: Kiểm thử

Các case cần test:

- [ ] Đăng ký 3 khuôn mặt khác nhau → nhận diện đúng từng người
- [ ] Người lạ (chưa đăng ký) → không thông báo hoặc thông báo "người lạ"
- [ ] Nhiều người trong khung hình → nhận diện và đọc tên tất cả
- [ ] Ánh sáng yếu, khuôn mặt nghiêng → kiểm tra độ chính xác
- [ ] Xóa khuôn mặt → không nhận diện nữa

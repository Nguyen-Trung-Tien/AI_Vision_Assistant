---
description: Thêm tính năng Visual Q&A - Hỏi đáp bằng giọng nói qua ảnh camera (Gemini Vision API)
---

## Mục tiêu

Cho phép người dùng chụp ảnh và đặt câu hỏi bằng giọng nói. AI phân tích ảnh và trả lời qua TTS.
Ví dụ: "Đây là loại thuốc gì?", "Cái bảng kia ghi gì?"

---

## Bước 1: Cấu hình API Key Gemini

1. Vào [Google AI Studio](https://aistudio.google.com/app/apikey) và tạo API Key.
2. Thêm key vào file `ai-worker/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Kiểm tra biến môi trường được load đúng trong `ai-worker/services/`.

---

## Bước 2: Tạo service Gemini Vision trong AI Worker

1. Tạo file mới: `ai-worker/services/gemini_service.py`
2. Cài thư viện cần thiết:
   ```bash
   cd ai-worker
   .\.venv\Scripts\activate
   pip install google-generativeai
   pip freeze > requirements.txt
   ```
3. Implement hàm `ask_gemini_vision(image_bytes: bytes, question: str) -> str`:
   - Encode ảnh sang base64
   - Gọi `gemini-1.5-flash` model với ảnh + câu hỏi
   - Trả về chuỗi text câu trả lời

---

## Bước 3: Thêm mode mới vào RabbitMQ Consumer

1. Mở file `ai-worker/rabbitmq_consumer.py`
2. Thêm case xử lý `mode = "visual_qa"` trong hàm dispatch chính:
   - Nhận thêm field `question` từ message payload
   - Gọi `gemini_service.ask_gemini_vision(image, question)`
   - Gửi kết quả text về `ai_results_queue`

---

## Bước 4: Cập nhật Backend Gateway

1. Mở `backend-gateway/src/vision/vision.gateway.ts`
2. Thêm xử lý event `visual_qa` từ mobile:
   - Nhận payload `{ frame, question, userId }`
   - Đẩy vào RabbitMQ với `{ mode: "visual_qa", image, question }`
3. Đảm bảo kết quả từ AI Worker được forward về đúng client WebSocket.

---

## Bước 5: Thêm UI và Speech-to-Text trên Mobile App

1. Mở `mobile_app/lib/`
2. Tạo widget `VisualQAButton` — nút giữ để nói câu hỏi:
   - Tích hợp plugin `speech_to_text` để ghi âm câu hỏi
   - Khi nhả nút: chụp frame hiện tại + gửi câu hỏi lên server
3. Thêm vào màn hình chính của app, hiển thị nút micro rõ ràng.
4. Khi nhận kết quả từ WebSocket: gọi TTS đọc câu trả lời.

---

## Bước 6: Kiểm thử

// turbo

```bash
cd ai-worker && python rabbitmq_consumer.py
```

Các case cần test:

- [ ] Hỏi về nội dung văn bản trong ảnh
- [ ] Hỏi về màu sắc, vật thể
- [ ] Hỏi câu hỏi mơ hồ → AI phải trả lời hợp lý
- [ ] Kiểm tra độ trễ tổng (chụp → nhận TTS) dưới 3 giây
- [ ] Trường hợp mất mạng: thông báo lỗi qua TTS

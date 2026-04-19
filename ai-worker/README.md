# AI Worker (Python Processing Engine)

Đây là thành phần xử lý AI lõi của hệ thống, chịu trách nhiệm nhận diện vật thể, đọc văn bản, mô tả cảnh và hỏi đáp hình ảnh.

---

## 🗓️ Lịch sử cập nhật (AI Engine)

| Ngày | Cập nhật | Chi tiết |
| --- | --- | --- |
| **17/04** | 👤 InsightFace | Tích hợp nhận diện khuôn mặt Buffalo_L cho người quen. |
| **17/04** | 📏 MiDaS Depth | Triển khai mô hình ước lượng chiều sâu đơn mục MiDaS Small. |
| **17/04** | 📄 Gemini Smart OCR | Chế độ đọc thông minh (menu, hóa đơn) qua Gemini AI. |
| **04/04** | 🚶 Smart Throttle | Tối ưu hóa hàng đợi Latest-only cho Continuous Stream. |
| **28/03** | 🚦 Traffic Lights | Mở rộng dataset YOLO lên 29 lớp (thêm đèn giao thông, ổ gà, nắp cống). |
| **27/03** | 🎓 YOLO Pipeline | Hoàn thiện quy trình training tự động: Roboflow → Colab → Deploy. |
| **26/02** | 🤖 Visual Q&A | Tích hợp Google Gemini Vision API cho hỏi đáp tự nhiên. |
| **25/02** | 🗣️ TTS Cache | Sử dụng Redis để lưu trữ kết quả TTS, giảm latency phát giọng nói. |

---

## 🧠 Các dịch vụ AI tích hợp

- **Object Detection (YOLO v11)**: Nhận diện xe cộ, người, vật cản với mô hình Nano tối ưu tốc độ.
- **Face Recognition (InsightFace)**: Nhận diện người quen sử dụng model Buffalo_L.
- **Depth Estimation (MiDaS)**: Ước lượng khoảng cách từ camera đến vật thể bằng mô hình MiDaS Small.
- **Smart OCR (Gemini Vision)**: Đọc thông minh thực đơn, hóa đơn và biển báo phức tạp.
- **Scene Captioning**: Phân tích không gian và đưa ra mô tả bằng ngôn ngữ tự nhiên.
- **Money Detector**: Nhận diện các mệnh giá tiền Việt Nam kèm xác minh màu sắc (HSV).
- **Visual Q&A**: Hỏi đáp về hình ảnh thông qua Google Gemini API.

---

## 🛠 Công nghệ & Thư viện

- **FastAPI**: Cung cấp health check và API endpoint bổ trợ.
- **Ultralytics**: Chạy mô hình YOLO v11.
- **InsightFace**: Thư viện nhận diện khuôn mặt chuyên sâu.
- **Pika**: Kết nối và tiêu thụ task từ RabbitMQ.
- **Redis**: Cache audio TTS để giảm độ trễ phản hồi.
- **Google GenAI**: Tích hợp mô hình Gemini 1.5 Flash.

---

## ⚙️ Cài đặt & Chạy

### 1. Yêu cầu hệ thống

- **Python**: 3.10 - 3.12 (Khuyến nghị 3.11).
- **RabbitMQ**: Phải đang chạy (thường qua Docker trong `backend-gateway`).
- **Redis**: Phải đang chạy trên cổng 6379.
- **Tesseract OCR**: Cần cài đặt trên hệ điều hành để dùng OCR cơ bản.

### 2. Thiết lập môi trường

```bash
cd ai-worker

# Tạo và kích hoạt Virtual Environment
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt
```

### 3. Cấu hình Biến môi trường

Tạo file `.env` tại `ai-worker/`:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Khởi chạy

Có 2 cách chạy:

- **Cách 1: Chỉ chạy Worker (Consumer)**
  ```bash
  python rabbitmq_consumer.py
  ```

- **Cách 2: Chạy Web Server + Worker (Khuyến nghị)**
  ```bash
  python main.py
  ```

---

## 📁 Cấu trúc thư mục AI

- `models/`: Chứa các file trọng số `.pt` (YOLO) và mô hình face/depth.
- `services/`: Logic xử lý của từng dịch vụ AI riêng biệt.
- `scripts/`: Các công cụ hỗ trợ training và chuẩn bị dataset.
- `dataset/`: (Tùy chọn) Nơi lưu trữ dữ liệu để training thêm.

---

## 🚨 Lưu ý quan trọng

- **GPU**: Nếu có NVIDIA GPU, hãy cài đặt `torch` phiên bản CUDA để tăng tốc độ xử lý gấp 5-10 lần.
- **Gemini API**: Cần có API Key từ Google AI Studio để sử dụng các tính năng Smart OCR và Visual Q&A.
- **Face Registration**: Ảnh khuôn mặt đăng ký nên được chụp rõ nét, chính diện.

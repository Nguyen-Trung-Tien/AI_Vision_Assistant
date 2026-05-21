<div align="center">

# 🧠 AI Worker Engine

### Trái tim AI của hệ thống Vision Assistant

_Đảm nhận toàn bộ trọng trách xử lý hình ảnh phức tạp: nhận diện vật thể, ước lượng chiều sâu, phân tích chữ viết (OCR), và hỏi đáp hình ảnh (Q&A)._

<br/>

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white&style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-005571?logo=fastapi&style=for-the-badge)
![YOLOv11](https://img.shields.io/badge/YOLOv11-Ultralytics-00FFFF?style=for-the-badge)
![OpenCV](https://img.shields.io/badge/OpenCV-Image_Processing-5C3EE8?logo=opencv&logoColor=white&style=for-the-badge)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?logo=rabbitmq&logoColor=white&style=for-the-badge)

</div>

---

## 🤖 Các dịch vụ AI cốt lõi

- 🎯 **Object Detection (YOLO v11)**: Nhận diện theo thời gian thực 29 lớp đối tượng (xe cộ, người, ổ gà, cầu thang, nắp cống, v.v.).
- 💵 **Money Detector**: Nhận diện 9 mệnh giá tiền Việt Nam kết hợp thuật toán kiểm tra màu sắc (HSV) và OCR.
- 👤 **Face Recognition (InsightFace)**: Nhận diện khuôn mặt người quen với độ chính xác cao bằng mô hình `Buffalo_L`.
- 📏 **Depth Estimation (MiDaS)**: Ước lượng khoảng cách từ camera đến vật thể bằng mô hình chiều sâu đơn mục MiDaS Small.
- 📄 **Smart OCR (Gemini Vision)**: AI đọc hiểu thực đơn, hóa đơn, biển báo phức tạp vượt trội hơn OCR truyền thống.
- 🗣️ **Scene Captioning**: Nhận thức không gian, vị trí (trái/giữa/phải) và tạo mô tả bằng ngôn ngữ tự nhiên.

---

## 🛠 Công nghệ & Thư viện

- **FastAPI / Uvicorn**: Cung cấp API endpoints cho health check và cấu hình động.
- **Ultralytics**: Chạy suy luận (inference) cho mô hình YOLO v11.
- **InsightFace & MiDaS**: Thư viện xử lý khuôn mặt và chiều sâu bằng Deep Learning.
- **Pika**: Tiêu thụ (consume) task từ RabbitMQ Queue và trả kết quả bất đồng bộ.
- **Redis**: Bộ đệm (Cache) âm thanh Text-To-Speech (TTS) giúp giảm triệt để độ trễ.
- **Google GenAI**: Tích hợp các luồng tác vụ phức tạp với `Gemini-3-flash-preview`.

---

## ⚙️ Hướng dẫn cài đặt & Chạy

### 1️⃣ Yêu cầu hệ thống
- **Python**: `3.10 - 3.12` (Khuyến nghị `3.11`).
- **RabbitMQ**: Đang chạy qua Docker trên cổng `5672` (nằm trong `backend-gateway`).
- **Redis**: Đang chạy trên cổng `6379`.
- **Tesseract OCR**: (Tùy chọn) Cần cài ở mức hệ điều hành để dùng bộ đọc OCR truyền thống.

### 2️⃣ Thiết lập môi trường Python

```bash
cd ai-worker

# Tạo và kích hoạt Virtual Environment
python -m venv .venv

# Trên Windows:
.\.venv\Scripts\activate
# Trên Linux/macOS:
source .venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt
```

### 3️⃣ Cấu hình Biến môi trường

Tạo file `.env` tại `ai-worker/`:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4️⃣ Khởi chạy Worker

**Cách 1: Chỉ chạy Worker đa luồng (Consumer - Dành cho Production)**
```bash
python rabbitmq_consumer.py
```

**Cách 2: Chạy Web Server + Worker (Có endpoint phục vụ TTS audio URL)**
```bash
python main.py
```

---

## 📁 Cấu trúc thư mục lõi

- `models/`: Chứa các trọng số `.pt` (YOLO) và mô hình TFLite/ONNX.
- `services/`: Chứa các module xử lý cho YOLO, InsightFace, MiDaS, OCR...
- `scripts/`: Chứa script Python chuẩn bị dataset, resize, merge hình ảnh.
- `dataset/`: Nơi lưu trữ tập ảnh raw dùng cho quá trình huấn luyện mô hình.

---

## 🚨 Khuyến cáo hiệu năng

> [!TIP]
> **Tăng tốc với GPU**: Nếu bạn có card đồ họa NVIDIA, hãy gỡ cài đặt `torch` CPU hiện tại và cài phiên bản hỗ trợ **CUDA** để tăng tốc suy luận lên gấp 5-10 lần.
> Cài đặt mẫu: `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118`

> [!WARNING]
> **Gemini API Limit**: Các luồng nhận diện thông minh phụ thuộc vào rate limit của Gemini API. Hãy đảm bảo API Key của bạn còn quota.

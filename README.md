<div align="center">

# 👁️ AI Vision Assistant

**Hệ thống trợ lý thị giác cho người suy giảm thị lực bằng AI**

![Flutter](https://img.shields.io/badge/Flutter-02569B?logo=flutter&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?logo=rabbitmq&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

</div>

---

> [!WARNING]
> **TÌNH TRẠNG DỰ ÁN (Local, In Development)**
>
> - Hệ thống tối ưu cho chạy **local**; chưa triển khai cloud.
> - Luồng AI đang xử lý **frame theo yêu cầu**; đang hướng tới stream liên tục 3–5 FPS.
> - Một số tính năng cần Internet: điều hướng, tra cứu barcode, Visual Q&A.
> - Không thay thế các hệ thống an toàn tuyệt đối trong môi trường nguy hiểm.

---

## 🌟 Giới thiệu

**AI Vision Assistant** là hệ thống trợ lý thị giác thời gian thực kết hợp **Mobile App**, **Gateway/API**, **AI Worker** và **Admin Dashboard**. Dự án tập trung vào:

- Nhận diện tiền Việt Nam và vật thể nguy hiểm trên đường.
- Đọc văn bản/nhãn mác, mô tả cảnh.
- Điều hướng an toàn.
- Hỏi đáp trực quan bằng giọng nói.
- SOS khẩn cấp.

---

## 🧭 Kiến trúc tổng quan

| Thành phần      | Công nghệ                    | Vai trò chính                                                  |
| --------------- | ---------------------------- | -------------------------------------------------------------- |
| **Mobile App**  | Flutter, FlutterMapX         | Chụp ảnh, điều hướng, TTS + rung, ML Kit offline, giao tiếp WS |
| **Gateway/API** | NestJS, PostgreSQL, RabbitMQ | Xác thực, nhận frame WS, đẩy queue, lưu log/feedback/SOS       |
| **AI Worker**   | Python, FastAPI, YOLO, OCR   | Inference YOLO, OCR, mô tả cảnh, TTS cache, Visual Q&A         |
| **Dashboard**   | React, Vite, Tailwind        | Thống kê sự cố, heatmap nguy hiểm, SOS, review feedback        |

---

## ✅ Tính năng hiện có

- **Nhận diện đa vật thể & tiền VN:** YOLO ; có **fallback offline** bằng TFLite (nếu có model cục bộ).
- **Đọc văn bản & nhãn mác:** OCR (Tesseract) (ML Kit Text + Barcode).
- **Mô tả cảnh & cảnh báo nguy hiểm:** định vị trái/giữa/phải, ước lượng khoảng cách tương đối.
- **Visual Q&A:** hỏi đáp trực quan bằng giọng nói (Gemini qua AI Worker).
- **Điều hướng thông minh:** GPS + la bàn + bản đồ OSM/OSRM.
- **SOS khẩn cấp:** thao tác nhanh (giữ màn hình/phím cứng).
- **Dashboard quản trị & feedback:** ghi nhận sự kiện, heatmap, review dữ liệu.

---

## 🔁 Luồng xử lý chính (Frame-by-frame)

1. Mobile đăng nhập và mở WebSocket tới `backend-gateway`.
2. Người dùng thao tác (double-tap, Q&A…) → gửi frame kèm `task_type`.
3. Gateway đẩy task vào RabbitMQ (`ai_tasks_queue`).
4. AI Worker xử lý (YOLO/OCR/Gemini) → đẩy kết quả vào `ai_results_queue`.
5. Gateway lưu DB và trả kết quả về WS (kèm cảnh báo nếu cần).
6. Mobile phát TTS và rung phản hồi.

---

## 🧭 Các chế độ chính trên Mobile

- **Mode 0 – Tổng hợp/nhận diện môi trường:** YOLO online, TFLite offline nếu có.
- **Mode 1 – OCR online:** dùng Tesseract qua server.
- **Mode 2 – OCR offline/nhanh:** ML Kit Text + Barcode.
- **Mode 3 – Mô tả cảnh:** `CAPTION` + cảnh báo nguy hiểm.
- **Mode 4 – Điều hướng:** GPS + la bàn + chỉ đường (OSRM/OSM).
- **Visual Q&A:** nút riêng, hỏi đáp tự do bằng giọng nói.

---

## 📁 Cấu trúc thư mục

- `mobile_app` – Flutter app cho người dùng.
- `backend-gateway` – NestJS Gateway + DB + RabbitMQ.
- `ai-worker` – FastAPI + consumer + xử lý AI.
- `admin-dashboard` – React dashboard quản trị.

---

## 🚀 Quick Start (Local)

### Yêu cầu môi trường

- **Node.js**: 22+ (npm 10+)
- **Python**: 3.10–3.11
- **Flutter SDK**: mới nhất
- **Docker Desktop**: dùng cho RabbitMQ
- **PostgreSQL**: cổng `5433`
- **Redis**: cổng `6379` (cache TTS)

### 1) RabbitMQ

```bash
cd backend-gateway
docker compose up -d
```

### 2) Backend Gateway

```bash
cd backend-gateway
npm install
npm run start:dev
```

### 3) AI Worker

```bash
cd ai-worker
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt

# Chỉ chạy consumer
python rabbitmq_consumer.py

# Hoặc chạy FastAPI + consumer (phục vụ TTS audio_url)
python main.py
```

### 4) Admin Dashboard

```bash
cd admin-dashboard
npm install
npm run dev
```

### 5) Mobile App

```bash
cd mobile_app
flutter pub get

# Android Emulator
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000

# Thiết bị thật (đổi IP LAN của máy dev)
flutter run --dart-define=BACKEND_URL=http://192.168.1.X:3000
```

---

## 🔑 Biến môi trường (.env)

Mỗi service có file `.env` mẫu. Lưu ý **không commit API keys** khi chia sẻ public.

- `backend-gateway/.env`
  - `PORT`, `DB_*`, `RABBITMQ_URL`, `JWT_SECRET`, `ADMIN_DEFAULT_PASSWORD`
- `ai-worker/.env`
  - `RABBITMQ_URL`, `REDIS_URL`, `GEMINI_API_KEY`

---

## 🧪 Dataset & Training YOLO

Các công cụ liên quan nằm trong `ai-worker/`:

- `prepare_dataset_from_roboflow.py` – chuẩn hóa dataset Roboflow.
- `merge_vnd_dataset.py` – gộp dataset tiền VN với dataset vật thể.
- `package_for_colab.py` – đóng gói dataset cho Google Colab.
- `COLAB_TRAINING.md` – hướng dẫn train với `yolo11n.pt`.

---

## 📌 Roadmap gần

- Stream 3–5 FPS cho chế độ đi bộ.
- Spatial audio (trái/phải) theo vị trí vật cản.
- Monocular depth estimation chính xác hơn.
- Layout analysis (đọc menu/sách).
- Nhận diện khuôn mặt người quen.

---

## 👨‍💻 Tác giả & Liên hệ

- **Nguyễn Trung Tiến**
- **Email:** 2251120447@ut.edu.vn || trungtiennguyen910@gmail.com
- **GitHub:** @Nguyen-Trung-Tien

---

# Vision Assistant

Hệ thống hỗ trợ người dùng bằng AI theo thời gian thực, gồm:

- `mobile_app`: ứng dụng Flutter gửi frame và nhận cảnh báo.
- `backend-gateway`: NestJS gateway (REST + WebSocket + RabbitMQ + PostgreSQL).
- `ai-worker`: FastAPI + YOLO worker xử lý OCR/CAPTION và trả kết quả qua RabbitMQ.
- `admin-dashboard`: React dashboard theo dõi thống kê.

## 1) Kiến trúc tổng quan

Luồng chính:

1. Mobile đăng nhập qua `POST /auth/login`.
2. Mobile mở WebSocket đến gateway, gửi event `frame_stream`.
3. Gateway đẩy task nặng sang RabbitMQ queue `ai_tasks_queue`.
4. AI Worker consume task, xử lý AI, publish kết quả vào `ai_results_queue`.
5. Gateway nhận kết quả, lưu PostgreSQL (`detection_logs`) và emit `ai_result` / `danger_alert` về đúng client.
6. Admin dashboard gọi API `/api/stats/*` để hiển thị số liệu.

## 2) Công nghệ sử dụng

- Backend: NestJS 11, TypeORM, PostgreSQL, RabbitMQ, Socket.IO, JWT.
- AI Worker: Python, FastAPI, Ultralytics YOLO, OpenCV, Redis cache URL TTS.
- Mobile: Flutter, Socket.IO client, ML Kit OCR/Barcode, camera, TTS.
- Dashboard: React 19 + Vite + Tailwind + Recharts.

## 3) Yêu cầu môi trường

Cài trước:

- Node.js 22+
- npm 10+
- Python 3.10+ (khuyến nghị 3.10/3.11 cho stack ML)
- Flutter SDK (kèm Android Studio nếu chạy Android)
- Docker Desktop (để chạy RabbitMQ nhanh)
- PostgreSQL (local, cổng `5433` theo cấu hình hiện tại)
- Redis (cổng `6379`, dùng cho cache TTS URL)

## 4) Cấu trúc thư mục

```text
Vision Assistant/
  admin-dashboard/     # React dashboard
  backend-gateway/     # NestJS API + WS + queue producer/consumer bridge
  ai-worker/           # AI processing worker + health API
  mobile_app/          # Flutter client
  .gitignore
```

## 5) Cấu hình biến môi trường

### 5.1 Backend (`backend-gateway/.env`)

Dự án hiện dùng các biến sau:

```env
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASS=your_password
DB_NAME=AI_Vision_Assistant
DB_SYNC=true
JWT_SECRET=change_this_secret
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672
```

Gợi ý:

- Khi production, đặt `DB_SYNC=false`.
- Thay `JWT_SECRET` bằng giá trị mạnh.

### 5.2 AI Worker (`ai-worker/.env`)

```env
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672/
REDIS_URL=redis://127.0.0.1:6379
```

## 6) Khởi động hạ tầng phụ trợ

### 6.1 RabbitMQ

Trong `backend-gateway` đã có `docker-compose.yml`:

```bash
cd backend-gateway
docker compose up -d
```

RabbitMQ UI: `http://localhost:15672` (`guest/guest`).

### 6.2 PostgreSQL

Tạo DB:

- Tên DB: `AI_Vision_Assistant`
- Port: `5433`

### 6.3 Redis

Chạy local Redis trên cổng `6379`.

## 7) Chạy từng service

Mở 4 terminal riêng.

### 7.1 Backend Gateway

```bash
cd backend-gateway
npm install
npm run start:dev
```

Mặc định chạy ở: `http://localhost:3000`

### 7.2 AI Worker

```bash
cd ai-worker
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python rabbitmq_consumer.py
```

Tùy chọn health-check API:

```bash
python main.py
```

Health endpoint: `http://localhost:8000/health`

### 7.3 Admin Dashboard

```bash
cd admin-dashboard
npm install
npm run dev
```

Mặc định chạy: `http://127.0.0.1:4200`

Dashboard đã cấu hình Vite proxy `/api` và `/auth` sang `http://localhost:3000`.

### 7.4 Mobile App (Flutter)

```bash
cd mobile_app
flutter pub get
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000
```

Lưu ý:

- Android Emulator: `10.0.2.2` trỏ về máy host.
- Nếu chạy thiết bị thật, thay bằng IP LAN của máy backend.
- Có thể truyền thêm token WS tạm:

```bash
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000 --dart-define=WS_TOKEN=<jwt_token>
```

## 8) API và WebSocket chính

### 8.1 Auth REST

- `POST /auth/login`
- `POST /auth/register`

Payload mẫu:

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

### 8.2 Stats REST (cần Bearer token)

- `GET /api/stats/overview`
- `GET /api/stats/by-type`
- `GET /api/stats/by-day?days=30`
- `GET /api/stats/logs?page=1&limit=20`

### 8.3 WebSocket events

Client -> Server:

- `frame_stream`

Server -> Client:

- `stream_ack`
- `ai_result`
- `danger_alert`

## 9) Model AI và dữ liệu

`ai-worker/services/model_manager.py` sẽ tìm model theo thứ tự ưu tiên:

- `runs/detect/vision_assistant_model5/weights/best.pt`
- ...
- `yolo11n.pt`

Nếu thiếu model sẽ báo `No YOLO model found for detection`.

## 10) Quy trình chạy nhanh (quick start)

1. Bật PostgreSQL + Redis.
2. Chạy RabbitMQ (`docker compose up -d` trong `backend-gateway`).
3. Chạy `backend-gateway` (`npm run start:dev`).
4. Chạy `ai-worker` (`python rabbitmq_consumer.py`).
5. Chạy `admin-dashboard` (`npm run dev`).
6. Chạy `mobile_app` (`flutter run ...`).

## 11) Troubleshooting nhanh

- Lỗi DB connect:
  - Kiểm tra `DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME` trong `backend-gateway/.env`.
- Lỗi RabbitMQ connect:
  - Kiểm tra `RABBITMQ_URL` ở cả backend và worker.
  - Đảm bảo port `5672` mở.
- Không nhận AI result:
  - Kiểm tra worker có chạy `rabbitmq_consumer.py`.
  - Kiểm tra queue `ai_tasks_queue` và `ai_results_queue` trong RabbitMQ UI.
- Mobile không kết nối WS:
  - Kiểm tra `BACKEND_URL`, token JWT và mạng giữa máy/devices.

## 12) Quy ước Git (đã cấu hình)

Root `.gitignore` đã bỏ qua:

- `node_modules`, `dist`, `build`, `.venv`, logs
- dữ liệu/model AI lớn
- ảnh `ai-worker/frames/`, `ai-worker/dataset/`
- ảnh có tên/thư mục `datasheet`

Nếu file lớn đã từng add vào git index trước đó, chạy:

```bash
git rm -r --cached ai-worker/frames
git rm -r --cached ai-worker/dataset
git rm -r --cached ai-worker/runs
```

## 13) Push GitHub

```bash
git init
git branch -M main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Nguyen-Trung-Tien/AI_Vision_Assistant.git
git push -u origin main
```

---

Nếu bạn muốn, bước tiếp theo mình có thể tạo luôn:

- `backend-gateway/.env.example`
- `ai-worker/.env.example`
- checklist release trước khi deploy.

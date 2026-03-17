# Backend Gateway (NestJS)

API Gateway trung tâm cho AI Vision Assistant. Nơi nhận WebSocket từ mobile, đẩy task vào RabbitMQ, lưu log, quản trị user, feedback, SOS, broadcast, heatmap và thống kê dashboard.

---

## ✅ Chức năng chính

- JWT auth (login/register/admin login).
- WebSocket gateway nhận frame + trả kết quả AI.
- RabbitMQ producer/consumer bridge cho AI Worker.
- Lưu Detection Logs, Feedback, SOS, Broadcast, Users.
- Heatmap nguy hiểm theo thời gian.
- API phục vụ dashboard admin.

---

## 📌 Yêu cầu môi trường

- Node.js `v22+` và npm `v10+`
- PostgreSQL chạy local (cổng `5433`)
- RabbitMQ (Docker)

---

## ⚙️ Cài đặt & chạy

### 1. Hạ tầng RabbitMQ

```bash
cd backend-gateway
docker compose up -d
```

RabbitMQ UI: `http://localhost:15672` (guest/guest)

### 2. Tạo `.env`

Tạo `backend-gateway/.env`:

```env
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASS=your_password
DB_NAME=AI_Vision_Assistant
DB_SYNC=true
JWT_SECRET=super_secret_key
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672
# Optional: nơi lưu ảnh feedback sai để export YOLO dataset
FEEDBACK_DATASET_DIR=
```

### 3. Chạy server

```bash
cd backend-gateway
npm install
npm run start:dev
```

Server chạy tại `http://localhost:3000`.

---

## 🔌 WebSocket Events

**Kết nối:**
- Client cần gửi JWT trong handshake auth: `{ token: <jwt> }`
- Sau khi connect, client gọi `join_user`.
- Admin dashboard gọi `join_admin`.

**Client → Server**
- `frame_stream`
  ```json
  {
    "frame": "<base64>",
    "task_type": "OCR|TEXT_OCR|CAPTION",
    "lang": "vi",
    "warning_distance_m": 2.0,
    "latitude": 10.123,
    "longitude": 106.123
  }
  ```
- `visual_qa`
  ```json
  { "frame": "<base64>", "question": "Cái gì đây?" }
  ```
- `sos_alert`
  ```json
  { "latitude": 10.1, "longitude": 106.1, "imageBase64": "<base64>" }
  ```

**Server → Client**
- `stream_ack` (received / throttled)
- `ai_result` (text + audio_url + danger_alerts)
- `danger_alert` (cảnh báo nguy hiểm realtime)

**Server → Admin**
- `sos_incoming`
- `tts_broadcast`

---

## 📬 RabbitMQ Queues

- `ai_tasks_queue`: Gateway đẩy task AI sang Python.
- `ai_results_queue`: AI Worker trả kết quả về Gateway.

---

## 📚 REST API chính (Dashboard)

Các endpoint này phục vụ dashboard:

- `POST /auth/admin/login`
- `GET /stats/overview`
- `GET /stats/by-type`
- `GET /stats/by-day?days=30`
- `GET /stats/logs?page=1&limit=20`
- `GET /sos`
- `PATCH /sos/:id/acknowledge`
- `PATCH /sos/:id/resolve`
- `GET /feedback`
- `PATCH /feedback/:id/review`
- `GET /feedback/stats`
- `GET /feedback/export`
- `POST /broadcast`
- `GET /broadcast`
- `GET /detections/heatmap`
- `GET /users`

---

## 🛠 Troubleshooting

- **Không kết nối DB**: kiểm tra `DB_*` trong `.env`.
- **Không kết nối RabbitMQ**: kiểm tra Docker và `RABBITMQ_URL`.
- **WS bị từ chối**: JWT invalid hoặc thiếu `token` trong handshake.
- **Rate limit**: Gateway giới hạn ~2 FPS per client.


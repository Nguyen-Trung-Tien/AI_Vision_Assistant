<div align="center">
  
  <h1>👁️ AI Vision Assistant</h1>
  
  <p>
    <b>Hệ thống hỗ trợ người bị suy giảm thị lực bằng AI theo thời gian thực</b>
  </p>

  <p>
    <img alt="Flutter" src="https://img.shields.io/badge/Flutter-%2302569B.svg?logo=flutter&logoColor=white" />
    <img alt="NestJS" src="https://img.shields.io/badge/nestjs-%23E0234E.svg?logo=nestjs&logoColor=white" />
    <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-005571?logo=fastapi" />
    <img alt="React" src="https://img.shields.io/badge/react-%2320232a.svg?logo=react&logoColor=%2361DAFB" />
    <img alt="RabbitMQ" src="https://img.shields.io/badge/Rabbitmq-FF6600?logo=rabbitmq&logoColor=white" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/postgresql-4169e1?logo=postgresql&logoColor=white" />
  </p>

</div>

---

## 🌟 Giới thiệu

**AI Vision Assistant** là một giải pháp công nghệ toàn diện nhằm hỗ trợ người dùng nhận biết môi trường xung quanh, đọc văn bản, nhận diện mệnh giá tiền, cảnh báo nguy hiểm bằng âm thanh và AI theo thời gian thực. Hệ thống được thiết kế với độ trễ thấp, kết hợp giữa Edge AI (trên thiết bị) và Cloud AI (xử lý sâu).

## 🏗️ Cấu trúc hệ thống

Dự án bao gồm 4 thành phần chính được thiết kế theo kiến trúc Microservices & Event-driven:

| Thành phần         | Công nghệ lõi               | Chức năng chính                                                                             |
| :----------------- | :-------------------------- | :------------------------------------------------------------------------------------------ |
| 📱 **Mobile App**  | `Flutter`                   | Ứng dụng client, chụp/stream camera, nhận diện cơ bản (ML Kit), phát âm thanh (TTS).        |
| 🔀 **Gateway/API** | `NestJS`, `PostgreSQL`      | Nhận kết nối WebSocket từ mobile, phân phối task vào Queue, lưu trữ lịch sử, quản lý user.  |
| 🧠 **AI Worker**   | `Python`, `FastAPI`, `YOLO` | Xử lý AI nặng (OCR nâng cao, Scene Captioning, Object Detection), trả kết quả qua RabbitMQ. |
| 📊 **Dashboard**   | `React`, `Vite`, `Tailwind` | Giao diện quản trị, thống kê người dùng, kiểm soát system logs và hiệu suất AI.             |

---

## ⚙️ Kiến trúc luồng dữ liệu (Data Flow)

1. **Client**: Mobile app đăng nhập và khởi tạo kết nối WebSocket tới `backend-gateway`.
2. **Stream**: Mobile gửi liên tục hình ảnh (frame) qua sự kiện `frame_stream`.
3. **Queue**: Gateway đẩy frame vào RabbitMQ (`ai_tasks_queue`) để xử lý bất đồng bộ.
4. **Processing**: `ai-worker` nhận hình ảnh, chạy các model phân tích (YOLO, OCR) rổi đẩy kết quả lại RabbitMQ (`ai_results_queue`).
5. **Feedback**: Gateway nhận kết quả, lưu vào PostgreSQL và báo ngay về Mobile qua WebSocket (sự kiện `ai_result` hoặc `danger_alert`).
6. **Voice**: Mobile nhận text kết quả và chuyển thành giọng nói (TTS) báo cho người dùng.

---

## 🚀 Hướng dẫn cài đặt & Chạy (Quick Start)

### 📌 Yêu cầu môi trường

- **Node.js**: `v22+` & **npm**: `v10+`
- **Python**: `3.10` hoặc `3.11`
- **Flutter SDK**: Mới nhất (kèm Android Studio / Xcode)
- **Docker Desktop**: Cần thiết để chạy RabbitMQ
- **PostgreSQL**: Cổng map nội bộ `5433`
- **Redis**: Cổng `6379` (Dùng cho Cache TTS)

### 1️⃣ Khởi động hạ tầng (RabbitMQ, DB, Redis)

Vào thư mục `backend-gateway` và khởi động RabbitMQ bằng Docker:

```bash
cd backend-gateway
docker compose up -d
```

> _RabbitMQ UI Management:_ `http://localhost:15672` (guest/guest)

Đảm bảo **PostgreSQL** (cổng `5433`, DB `AI_Vision_Assistant`) và **Redis** (cổng `6379`) đang chạy.

---

### 2️⃣ Khởi động API Gateway (NestJS)

Mở một terminal mới:

```bash
cd backend-gateway
npm install
npm run start:dev
```

> _Server chạy tại:_ `http://localhost:3000`

---

### 3️⃣ Khởi động AI Worker (Python)

Mở một terminal mới:

```bash
cd ai-worker
python -m venv .venv
# Activate venv:
# Windows: .\.venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt
python rabbitmq_consumer.py
```

_(Tùy chọn: Chạy `python main.py` để bật thêm FastAPI health-check ở `http://localhost:8000/health`)_

---

### 4️⃣ Khởi động Admin Dashboard (React)

Mở một terminal mới:

```bash
cd admin-dashboard
npm install
npm run dev
```

> _Dashboard truy cập tại:_ `http://127.0.0.1:4200`

---

### 5️⃣ Khởi động Mobile App (Flutter)

Mở terminal cuối cùng:

```bash
cd mobile_app
flutter pub get

# Chạy trên máy ảo Android (10.0.2.2 trỏ về localhost của máy host)
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000

# Chạy trên máy vật lý (Thay IP bằng IP LAN của máy backend)
flutter run --dart-define=BACKEND_URL=http://192.168.1.X:3000
```

---

## 🔑 Biến môi trường (.env)

Hệ thống cung cấp sẵn file mẫu. Bạn cần tạo tĩnh file `.env` ở các thư mục tương ứng.

### Backend (`backend-gateway/.env`)

```env
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASS=your_password
DB_NAME=AI_Vision_Assistant
DB_SYNC=true               # Đổi thành false khi đưa lên Production
JWT_SECRET=super_secret_key
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672
```

### AI Worker (`ai-worker/.env`)

```env
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672/
REDIS_URL=redis://127.0.0.1:6379
```

---

## 🛠 Troubleshooting (Các lỗi thường gặp)

| Hiện tượng                           | Cách khắc phục                                                                                               |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Lỗi kết nối DB (Gateway)**         | Kiểm tra thông tin `DB_*` trong `backend-gateway/.env`.                                                      |
| **Lỗi kết nối RabbitMQ**             | Đảm bảo Docker Container đang chạy, port `5672` open. Kiểm tra `RABBITMQ_URL`.                               |
| **Mobile ko kết nối được WebSocket** | Thay `BACKEND_URL` ở lệnh `flutter run` cho đúng bằng IP máy ảo (`10.0.2.2`) hoặc IP LAN WiFi (`192.x.x.x`). |
| **Thiếu Model YOLO**                 | Đảm bảo tải hoặc train file `yolo11n.pt` / `best.pt` bỏ vào mục `ai-worker/runs/detect/...` thư mục gốc.     |

---

## 📜 Giấy phép & Đóng góp

Dự án được phát triển dưới dạng mã nguồn mở cho mục đích giáo dục và hỗ trợ cộng đồng. Các tính năng và tài liệu sẽ liên tục được cập nhật. Mọi đóng góp (Pull Request, Issues) đều được hoan nghênh.

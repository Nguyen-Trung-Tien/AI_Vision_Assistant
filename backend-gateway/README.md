<div align="center">

# 🔗 Backend Gateway (NestJS)

### Xương sống giao tiếp và điều phối trung tâm

_API Gateway quản lý toàn bộ kết nối WebSocket, xác thực người dùng (JWT), điều phối tác vụ xử lý AI qua RabbitMQ và lưu trữ sự kiện hệ thống._

<br/>

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white&style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?logo=rabbitmq&logoColor=white&style=for-the-badge)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real_Time-010101?logo=socket.io&logoColor=white&style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker&logoColor=white&style=for-the-badge)

</div>

---

## ✅ Vai trò & Chức năng chính

- 🔐 **Xác thực & Bảo mật (Auth)**: Quản lý đăng ký, đăng nhập bằng JWT, bảo mật toàn diện cho cả REST API và WebSocket (WS Guards).
- ⚡ **WebSocket Real-time**: Kênh giao tiếp độ trễ cực thấp giữa Mobile App và AI Worker. Nhận luồng khung hình (frame) và trả về kết quả âm thanh/cảnh báo.
- 📨 **Task Orchestration (RabbitMQ)**: Vai trò "Người điều phối" – đưa request từ Mobile vào Queue và lắng nghe kết quả từ AI Worker thông qua giao thức AMQP.
- 🚨 **Hệ thống SOS & Liên lạc khẩn cấp**: Tiếp nhận cảnh báo nguy hiểm, lưu lại tọa độ GPS, cảnh báo lên Dashboard và kích hoạt SMS tự động cho người thân.
- 📊 **Thu thập Thống kê**: Log lại tất cả truy vấn, cảnh báo, heatmap để cung cấp insight chuyên sâu cho Admin Dashboard.

---

## 🛠 Tech Stack

- **NestJS**: Framework Node.js kiến trúc Enterprise, module hóa mạnh mẽ.
- **PostgreSQL**: Cơ sở dữ liệu quan hệ mạnh mẽ, lưu trữ bền vững.
- **TypeORM**: Object-Relational Mapper (ORM) giúp thao tác DB an toàn.
- **RabbitMQ**: Message Queue broker, giải pháp hàng đầu cho xử lý tác vụ bất đồng bộ.
- **Socket.IO**: Engine WebSocket phổ biến, hỗ trợ tự động kết nối lại (reconnect).

---

## ⚙️ Hướng dẫn cài đặt & Chạy

### 1️⃣ Khởi động Hạ tầng Docker (Database & Queue)

Dự án cung cấp sẵn file `docker-compose.yml` để dựng Postgres, Redis và RabbitMQ.

```bash
cd backend-gateway
docker compose up -d
```

### 2️⃣ Cấu hình Biến môi trường

Tạo file `.env` tại thư mục gốc `backend-gateway/`:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASS=your_password
DB_NAME=AI_Vision_Assistant
DB_SYNC=true

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
```

### 3️⃣ Khởi chạy Gateway

```bash
npm install
npm run start:dev
```
> 🚀 Server sẽ lắng nghe tại `http://localhost:3000`

---

## 🔌 Giao thức kết nối (WebSocket)

Kênh kết nối WebSocket (`ws://localhost:3000`) cung cấp các Events chính:

| Event Name | Hướng | Mô tả |
| :--- | :--- | :--- |
| `frame_stream` | Client ➡️ Server | Gửi một base64 frame ảnh cùng yêu cầu tác vụ (YOLO, OCR, ...). |
| `visual_qa` | Client ➡️ Server | Gửi frame ảnh kèm giọng nói STT để hỏi đáp AI. |
| `sos_alert` | Client ➡️ Server | Bắn tín hiệu cầu cứu khẩn cấp (kèm tọa độ GPS). |
| `ai_result` | Server ➡️ Client | Trả về thông tin cảnh báo, text nhận diện hoặc audio TTS. |
| `broadcast_tts` | Server ➡️ Client | Gửi thông báo hệ thống bằng giọng nói đến tất cả Users. |

---

## 🛠 Xử lý sự cố (Troubleshooting)

- 🔴 **Lỗi kết nối RabbitMQ**: Hãy kiểm tra lệnh `docker ps` xem container RabbitMQ đã chạy trên cổng `5672` chưa.
- 🔴 **Lỗi Database Connection Refused**: Đảm bảo cổng Postgres (mặc định trong code là `5433`) không bị xung đột.
- 🔴 **WebSocket Disconnected / Unauthorized**: Mobile app chưa gửi token JWT trong `handshake` hoặc token đã hết hạn.

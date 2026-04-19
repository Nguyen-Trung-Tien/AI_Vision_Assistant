# Backend Gateway (NestJS)

API Gateway trung tâm đóng vai trò là "nhà điều phối" toàn bộ hệ thống AI Vision Assistant. Chịu trách nhiệm quản lý kết nối, xác thực, điều phối tác vụ AI và lưu trữ dữ liệu.

---

## ✅ Chức năng chính

- **Xác thực & Bảo mật**: Quản lý tài khoản người dùng, JWT Authentication và WebSocket Guards.
- **WebSocket Gateway**: Nhận frame ảnh từ Mobile và trả kết quả AI real-time với độ trễ cực thấp.
- **Task Orchestration**: Điều phối các tác vụ AI thông qua RabbitMQ (Producer/Consumer).
- **Quản lý SOS**: Tiếp nhận cảnh báo khẩn cấp, lưu vị trí GPS và thông báo tức thời cho Admin.
- **Liên hệ khẩn cấp**: Hệ thống CRUD thông tin người thân để tự động gửi SMS khi có sự cố.
- **Thống kê & Dashboard**: Cung cấp API cho Admin Dashboard về hiệu suất hệ thống và heatmap nguy hiểm.
- **AI Feedback**: Thu thập phản hồi từ người dùng để cải thiện độ chính xác của mô hình AI.

---

## 🛠 Công nghệ sử dụng

- **NestJS**: Framework Node.js mạnh mẽ, dễ mở rộng.
- **PostgreSQL**: Cơ sở dữ liệu quan hệ lưu trữ logs, users và settings.
- **RabbitMQ**: Message Queue trung gian giữa Backend và AI Worker.
- **Socket.IO**: Giao thức truyền tải frame ảnh và kết quả AI real-time.
- **TypeORM**: Quản lý truy vấn database một cách chuyên nghiệp.

---

## ⚙️ Cài đặt & Chạy

### 1. Hạ tầng cơ sở (Docker)

```bash
cd backend-gateway
docker compose up -d
```
*Lệnh này sẽ khởi chạy RabbitMQ container trên cổng 5672.*

### 2. Cấu hình Biến môi trường

Tạo file `.env` tại `backend-gateway/`:

```env
PORT=3000
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASS=your_password
DB_NAME=AI_Vision_Assistant
DB_SYNC=true

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672

# Auth
JWT_SECRET=your_jwt_secret
```

### 3. Khởi chạy server

```bash
npm install
npm run start:dev
```

---

## 🔌 Giao thức kết nối chính

### WebSocket Events (Socket.IO)
- `frame_stream`: Gửi ảnh để xử lý AI (OCR, Caption, Money...).
- `visual_qa`: Gửi câu hỏi về hình ảnh hiện tại.
- `sos_alert`: Thông báo tình trạng khẩn cấp.
- `join_user` / `join_admin`: Phân loại phòng kết nối để nhận thông báo phù hợp.

### REST API Endpoints
- `/api/auth`: Đăng ký, đăng nhập.
- `/api/sos`: Quản lý danh sách cảnh báo khẩn cấp.
- `/api/emergency-contact`: Quản lý danh bạ liên hệ khi có sự cố.
- `/api/feedback`: Ghi nhận và xử lý phản hồi người dùng.
- `/api/stats`: Thống kê dữ liệu cho dashboard.

---

## 🛠 Troubleshooting

- **Lỗi kết nối RabbitMQ**: Đảm bảo Docker container đã chạy và cổng 5672 không bị chặn.
- **Lỗi Database**: Kiểm tra cổng PostgreSQL (mặc định trong code là 5433).
- **WebSocket Disconnected**: Đảm bảo gửi token JWT hợp lệ trong handshake.



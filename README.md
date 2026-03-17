<div align="center">
  
  <h1>👁️ AI Vision Assistant</h1>
  
  <p>
    <b>Hệ thống hỗ trợ người suy giảm thị lực bằng AI & trợ năng</b>
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

> [!WARNING]
>
> 🚧 **TÌNH TRẠNG DỰ ÁN (Local, In Development)**
>
> - **Hiện trạng:** Dự án đang phát triển, kết quả AI còn dao động tùy môi trường thực tế.
> - **Môi trường chạy:** Hệ thống hiện tối ưu cho **Local**. Chưa triển khai Cloud.
> - **Luồng AI:** Xử lý theo dạng **chụp từng khung hình theo yêu cầu** (không stream liên tục 3-5 FPS).
> - **Phụ thuộc Internet:** Điều hướng (OSRM/Nominatim), barcode (OpenFoodFacts), Visual Q&A (Gemini) cần mạng.
> - **An toàn:** Không sử dụng như hệ thống an toàn tuyệt đối trong môi trường nguy hiểm.

---

## 🌟 Giới thiệu

**AI Vision Assistant** là một hệ thống trợ năng hỗ trợ người suy giảm thị lực bằng AI thời gian thực, kết hợp Mobile, Gateway, AI Worker và Dashboard quản trị. Dự án hiện tập trung vào nhận diện tiền, đọc văn bản, mô tả cảnh và hỗ trợ điều hướng cơ bản.

---

## Chức năng hiện có (theo code hiện tại)

- Nhận diện tiền Việt Nam online bằng YOLO (có ổn định kết quả theo thời gian).
- Nhận diện tiền offline bằng TFLite (nếu có model trong app).
- Đọc văn bản online bằng Tesseract OCR.
- Đọc nhanh offline bằng ML Kit (Text + Barcode, tra cứu OpenFoodFacts).
- Mô tả cảnh với vị trí trái/giữa/phải, ước lượng khoảng cách theo bounding box.
- Cảnh báo vật thể nguy hiểm gần (car, motorcycle, bus, truck, bicycle, dog).
- Visual Q&A bằng Gemini (tùy chọn khi có API key).
- Điều hướng cơ bản: la bàn, GPS, đọc tên đường, dẫn đường đi bộ (OSRM).
- SOS khẩn cấp bằng nhấn giữ hoặc phím cứng (power/volume).
- Lịch sử phát hiện + phản hồi đúng/sai để cải thiện mô hình.
- Dashboard quản trị: thống kê, log, heatmap, SOS, feedback, broadcast, users.

---

## 🏗️ Cấu trúc hệ thống

| Thành phần         | Công nghệ lõi                      | Chức năng chính                                                             |
| :----------------- | :--------------------------------- | :-------------------------------------------------------------------------- |
| 📱 **Mobile App**  | `Flutter`                          | Chụp ảnh, gọi WebSocket/HTTP, TTS + rung, ML Kit offline, điều hướng GPS.   |
| 🔀 **Gateway/API** | `NestJS`, `PostgreSQL`, `RabbitMQ` | Xác thực JWT, WS nhận frame, đẩy queue, lưu log, quản lý user/feedback/SOS. |
| 🧠 **AI Worker**   | `Python`, `FastAPI`, `YOLO`, `OCR` | Inference YOLO, OCR, mô tả cảnh, cảnh báo nguy hiểm, TTS cache, Visual Q&A. |
| 📊 **Dashboard**   | `React`, `Vite`, `Tailwind`        | Thống kê, log, SOS, feedback review, broadcast, quản lý người dùng.         |

---

## 🔁 Luồng xử lý hiện tại (Frame-by-frame)

1. **Mobile** đăng nhập và mở WebSocket tới `backend-gateway`.
2. Người dùng **double-tap** hoặc ra lệnh → app chụp 1 ảnh và gửi `frame_stream` (kèm `task_type`).
3. **Gateway** đẩy task vào RabbitMQ (`ai_tasks_queue`).
4. **AI Worker** xử lý và đẩy kết quả về RabbitMQ (`ai_results_queue`).
5. **Gateway** lưu log và trả `ai_result` + `danger_alert` qua WebSocket.
6. **Mobile** đọc kết quả bằng TTS + rung cảnh báo.

Ghi chú: Rate limit ~2 FPS để tránh overload. Chưa có stream 3-5 FPS.

---

## 🧭 Các chế độ trên Mobile

- **Mode 0 – Tổng hợp/Tiền:** `OCR` online. Offline fallback bằng TFLite nếu có model.
- **Mode 1 – Đọc văn bản online:** `TEXT_OCR` dùng Tesseract trên server.
- **Mode 2 – Đọc nhanh offline:** ML Kit Text + Barcode, tra cứu OpenFoodFacts.
- **Mode 3 – Mô tả cảnh:** `CAPTION` với YOLO + khoảng cách + gợi ý lối đi.
- **Mode 4 – Điều hướng:** GPS + la bàn, dẫn đường OSRM, đọc tên đường.
- **Visual Q&A:** Nút riêng, gửi ảnh + câu hỏi tới Gemini.

---

## 📌 Những phần chưa có / đang lên kế hoạch

- Stream camera 3-5 FPS cho chế độ đi bộ + TTL drop frame trong RabbitMQ.
- Spatial audio trái/phải theo vị trí bounding box.
- Monocular depth estimation (hiện dùng heuristic theo bounding box).
- Smart OCR với edge detection + layout analysis (menu, bảng biểu).
- Cooking assistant (nhận diện bếp/nước sôi/trạng thái thực phẩm).
- Face recognition và mô tả người quen.
- Triển khai cloud và tối ưu độ trễ end-to-end.

---

## 🚀 Hướng dẫn cài đặt & Chạy (Quick Start)

### 📌 Yêu cầu môi trường

- **Node.js**: `v22+` & **npm**: `v10+`
- **Python**: `3.10` hoặc `3.11`
- **Flutter SDK**: Mới nhất (kèm Android Studio / Xcode)
- **Docker Desktop**: Dùng cho RabbitMQ
- **PostgreSQL**: cổng `5433`
- **Redis**: cổng `6379` (cache TTS)

### 1️⃣ Hạ tầng (RabbitMQ)

```bash
cd backend-gateway
docker compose up -d
```

RabbitMQ UI: `http://localhost:15672` (guest/guest)

PostgreSQL và Redis cần chạy riêng (local hoặc Docker khác).

---

### 2️⃣ Backend Gateway (NestJS)

```bash
cd backend-gateway
npm install
npm run start:dev
```

Server chạy tại `http://localhost:3000`.

---

### 3️⃣ AI Worker (Python)

```bash
cd ai-worker
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt

# Chỉ chạy consumer
python rabbitmq_consumer.py

# Hoặc chạy FastAPI + consumer (khuyến nghị nếu dùng TTS audio_url)
python main.py
```

---

### 4️⃣ Admin Dashboard (React)

```bash
cd admin-dashboard
npm install
npm run dev
```

Dashboard truy cập tại `http://127.0.0.1:4200`.

---

### 5️⃣ Mobile App (Flutter)

```bash
cd mobile_app
flutter pub get

# Android Emulator (10.0.2.2 trỏ về localhost host)
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000

# Máy thật (thay IP LAN)
flutter run --dart-define=BACKEND_URL=http://192.168.1.X:3000
```

---

## 🔑 Biến môi trường (.env)

### Backend (`backend-gateway/.env`)

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

### AI Worker (`ai-worker/.env`)

```env
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672/
REDIS_URL=redis://127.0.0.1:6379

# OCR
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

# Visual QA (optional)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_MAX_OUTPUT_TOKENS=256

# TTS cache (optional)
TTS_AUDIO_DIR=
```

---

## 📦 Phụ thuộc ngoài (cần cài thêm)

- **Tesseract OCR**: bắt buộc cho `TEXT_OCR`.
- **edge-tts**: chỉ cần nếu dùng TTS audio_url (`pip install edge-tts`).
- **Internet**: OSRM/Nominatim, OpenFoodFacts, Gemini.

---

## 🔬 Training YOLO (tùy chọn)

1. Chuẩn bị dataset tại `ai-worker/dataset/` với `data.yaml`, `images/`, `labels/`.
2. Train:
   ```bash
   cd ai-worker
   python train_yolo.py --dataset dataset/data.yaml --epochs 20 --model yolo11n.pt --run-name vision_assistant_model
   ```
3. Model sẽ nằm tại `ai-worker/runs/detect/vision_assistant_model/weights/best.pt`.
4. `ModelManager` tự ưu tiên load `best.pt` nếu có.

---

## 🛠 Troubleshooting

| Hiện tượng                         | Cách khắc phục                                           |
| :--------------------------------- | :------------------------------------------------------- |
| **Không kết nối RabbitMQ**         | Kiểm tra Docker chạy và `RABBITMQ_URL`.                  |
| **OCR không hoạt động**            | Cài Tesseract và set `TESSERACT_CMD`.                    |
| **Không có audio_url**             | Cài `edge-tts` hoặc dùng TTS on-device.                  |
| **Mobile không kết nối WebSocket** | Đảm bảo login lấy JWT, và `BACKEND_URL` trỏ đúng IP LAN. |
| **Offline TFLite không chạy**      | Thêm model `.tflite` vào `mobile_app/assets/models/`.    |
| **Visual Q&A báo lỗi**             | Kiểm tra `GEMINI_API_KEY` và kết nối mạng.               |

---

## 👨‍💻 Tác giả & Liên hệ

- **Nguyễn Trung Tiến**
- **Email sinh viên:** 2251120447@ut.edu.vn
- **Email cá nhân:** trungtiennguyen910@gmail.com
- **GitHub:** [@Nguyen-Trung-Tien](https://github.com/Nguyen-Trung-Tien)

---

## 📜 Giấy phép

Dự án được phát triển dưới dạng mã nguồn mở cho mục đích giáo dục và hỗ trợ cộng đồng.

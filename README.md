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
> - **Hiện trạng:** Dự án đang phát triển nhanh chóng, tích hợp thêm nhiều lớp nhận diện vật thể và công nghệ bản đồ mới.
> - **Môi trường chạy:** Hệ thống hiện tối ưu cho **Local**. Chưa triển khai Cloud.
> - **Luồng AI:** Xử lý theo dạng **chụp từng khung hình theo yêu cầu** (đang hướng tới hỗ trợ stream liên tục 3-5 FPS).
> - **Phụ thuộc Internet:** Điều hướng (OpenStreetMap API/Nominatim), barcode (OpenFoodFacts), Visual Q&A (Gemini) cần mạng.
> - **An toàn:** Không sử dụng như hệ thống an toàn tuyệt đối trong môi trường nguy hiểm.

---

## 🌟 Giới thiệu

**AI Vision Assistant** là một hệ thống trợ năng hỗ trợ người suy giảm thị lực bằng AI thời gian thực, kết hợp Mobile, Gateway, AI Worker và Dashboard quản trị. Dự án hiện tập trung vào nhận diện tiền, chỉ hướng đường đi an toàn, cảnh báo chướng ngại vật/vật thể đa dạng, đọc văn bản và hỗ trợ hỏi đáp trực quan.

---

## 🎯 Chức năng hiện có (theo code hiện tại)

- **Nhận diện đa vật thể & Tiền:** Sử dụng mô hình YOLO online để nhận dạng tiền Việt Nam và các chướng ngại vật phổ biến (`car, truck, chair, manhole, person, phone, road, sidewalk, stairs_down, stairs_up, water_bottle`). Có hỗ trợ fallback offline bằng TFLite trên thiết bị.
- **Đọc văn bản & Nhãn mác:** 
  - Đọc văn bản online bằng Tesseract OCR.
  - Đọc tốc độ cao offline thông qua ML Kit (Text + Barcode), hỗ trợ tra cứu thông tin sản phẩm bằng OpenFoodFacts.
- **Mô tả cảnh & Cảnh báo nguy hiểm:** Cung cấp thông tin vật thể (bên trái/giữa/phải), ước lượng khoảng cách dựa trên bounding box và phát âm thanh cảnh báo/rung cho người dùng khi có phương tiện/chướng ngại quá gần.
- **Hỏi đáp trực quan (Visual Q&A):** Ứng dụng sức mạnh của Gemini Vision API, cho phép hỏi đáp trực tiếp bằng giọng nói về hình ảnh hiện tại quét qua camera.
- **Điều hướng thông minh:** Sử dụng la bàn, định vị GPS, đọc tên đường, phân tích tuyến đường đi bộ cực chuẩn với cập nhật mới dựa trên **OpenStreetMap API** & **FlutterMapX**.
- **SOS khẩn cấp:** Chế độ cầu cứu nhanh qua nhấn giữ màn hình hay phím cứng (Power/Volume).
- **Hệ thống Quản trị & RLHF (Feedback):** Admin dashboard ghi nhận lịch sử phát hiện, thu thập phản hồi đúng/sai để huấn luyện cải thiện model. Tích hợp heatmap, xem log, broadcast thông báo và quản lý người dùng UI/UX hiện đại.

---

## 🏗️ Cấu trúc hệ thống

| Thành phần         | Công nghệ lõi                      | Chức năng chính                                                             |
| :----------------- | :--------------------------------- | :-------------------------------------------------------------------------- |
| 📱 **Mobile App**  | `Flutter`, `FlutterMapX`           | Chụp ảnh, điều hướng bản đồ OSM, TTS + rung, ML Kit offline, giao tiếp server. |
| 🔀 **Gateway/API** | `NestJS`, `PostgreSQL`, `RabbitMQ` | Xác thực JWT, WS nhận frame, đẩy queue, lưu log, quản lý user/feedback/SOS. |
| 🧠 **AI Worker**   | `Python`, `FastAPI`, `YOLO`, `OCR` | Inference YOLO (với dataset v2 đa nhãn), mô tả cảnh, TTS cache, Visual Q&A. |
| 📊 **Dashboard**   | `React`, `Vite`, `Tailwind`        | Thống kê sự cố, heatmap nguy hiểm, SOS, feedback review, quản trị user.      |

---

## 🔁 Luồng xử lý hiện hành (Frame-by-frame)

1. **Mobile** đăng nhập và mở kết nối WebSocket tới `backend-gateway`.
2. Theo yêu cầu người dùng (VD: double-tap, hỏi đáp), app gửi hình capture `frame_stream` với định vị `task_type`.
3. **Gateway** đẩy task vào hàng đợi RabbitMQ (`ai_tasks_queue`).
4. **AI Worker** kéo hình xử lý (YOLO/Gemini/OCR) và đẩy lại kết quả vào (`ai_results_queue`).
5. **Gateway** lưu database và gởi trả qua WebSocket (kèm alert báo động nếu có chướng ngại vật).
6. **Mobile** phản hồi ngay qua Voice phát âm (TTS) và motor rung điện thoại.

Ghi chú: Rate limit hiện tại đạt khoảng 2 FPS. Luồng chạy 3-5 FPS (Video stream) đang được lên kế hoạch và cải tạo cơ sở hạ tầng.

---

## 🧭 Các chế độ trên Mobile

- **Mode 0 – Tổng hợp/Nhận diện Môi trường:** `YOLO` online nhận diện đủ thứ (xe cộ, hố ga, tiền...). Offline fallback bằng TFLite nếu có tải trước file model.
- **Mode 1 – Đọc văn bản online:** `TEXT_OCR` dùng Tesseract trên server.
- **Mode 2 – Đọc nhanh offline:** ML Kit Text + Barcode, tra cứu OpenFoodFacts.
- **Mode 3 – Mô tả cảnh:** `CAPTION` báo cáo tổng thể + định hướng đi (trái/phải).
- **Mode 4 – Điều hướng bản đồ:** GPS + la bàn, dẫn đường lộ trình bằng OSM (OpenStreetMap API) trên nền tảng bản đồ FlutterMapX mới nhất.
- **Chế độ Riêng - Visual Q&A:** Ấn định nút đặc biệt để tương tác hỏi đáp tự do với AI Gemini. 

---

## 📌 Những phần chưa có / đang lên kế hoạch

- Stream camera 3-5 FPS cho chế độ đi bộ + TTL drop frame trong RabbitMQ.
- Âm thanh không gian (Spatial audio) phát âm thanh trái/phải tùy vị trí vật cản.
- Monocular depth estimation (chính xác hơn ước tính bounding box hiện có).
- Smart layout analysis để đọc sách/menu hiệu quả.
- Nhận diện khuôn mặt người quen (Face recognition).
- Mở rộng Cooking assistant (nhận điện thiết bị nhà bếp).

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

### 2️⃣ Backend Gateway (NestJS)

```bash
cd backend-gateway
npm install
npm run start:dev
```

### 3️⃣ AI Worker (Python)

```bash
cd ai-worker
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt

# Chỉ chạy consumer
python rabbitmq_consumer.py

# Hoặc FastAPI + consumer (hỗ trợ TTS audio_url)
python main.py
```

### 4️⃣ Admin Dashboard (React)

```bash
cd admin-dashboard
npm install
npm run dev
```

### 5️⃣ Mobile App (Flutter)

```bash
cd mobile_app
flutter pub get

# Chạy Simulator/Emulator
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000

# Chạy thiết bị vật lý (sửa IP LAN thật của máy chủ)
flutter run --dart-define=BACKEND_URL=http://192.168.1.X:3000
```

---

## 🔑 Biến môi trường (.env)

_Tham khảo mẫu `.env` ở mỗi thư mục. Gateway cần cấu hình Database/RabbitMQ, AI Worker yêu cầu đường dẫn lệnh Tesseract OCR và API Keys (như Gemini)._

---

## 🔬 Training YOLO Model Mới (Dataset 12 class)

Phiên bản mới nhất của project đã sẵn sàng kịch bản build dataset từ ảnh gốc cho tới Google Colab:

1. Chuẩn bị ảnh phân theo thư mục class tại `ai-worker/image_<class>` (hoặc folder xen kẽ như `image_car_truck`).
2. Gen dataset format chuẩn YOLO:
   ```bash
   cd ai-worker
   python prepare_dataset_from_images.py --source-root image --dataset-root dataset --clean
   ```
3. Xem hướng dẫn chi tiết file `COLAB_TRAINING.md` để huấn luyện trên Google Colab với `yolo11n.pt`.
4. Sau khi train, đặt tệp `best.pt` mới tải về vào thư mục `ai-worker/runs/detect/vision_assistant_model_v2/weights/best.pt`.
5. Hệ thống Manager sẽ tự nhận để cung cấp Inference cải tiến!

---

## 👨‍💻 Tác giả & Liên hệ

- **Nguyễn Trung Tiến**
- **Email:** 2251120447@ut.edu.vn / trungtiennguyen910@gmail.com
- **GitHub:** [@Nguyen-Trung-Tien](https://github.com/Nguyen-Trung-Tien)

---
Dự án được phát triển dưới dạng mã nguồn mở hướng cộng đồng.

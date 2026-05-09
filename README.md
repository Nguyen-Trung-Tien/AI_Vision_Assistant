<div align="center">

# 👁️ AI Vision Assistant

### Hệ thống trợ lý thị giác thời gian thực cho người khiếm thị và người bị suy giảm thị lực

_Sử dụng AI để nhận diện vật thể, tiền Việt Nam, cảnh báo nguy hiểm, điều hướng GPS và phản hồi bằng giọng nói tiếng Việt_

<br/>

![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter&logoColor=white&style=for-the-badge)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white&style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-005571?logo=fastapi&style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white&style=for-the-badge)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)

![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.x-FF6600?logo=rabbitmq&logoColor=white&style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)
![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis&logoColor=white&style=for-the-badge)
![YOLO](https://img.shields.io/badge/YOLOv11-Ultralytics-00FFFF?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Google_Gemini-Vision_AI-4285F4?logo=google&logoColor=white&style=for-the-badge)

<br/>

![Version](https://img.shields.io/badge/Version-1.8.0-blue?style=flat-square)
![License](https://img.shields.io/badge/License-UNLICENSED-gray?style=flat-square)
![Status](https://img.shields.io/badge/Status-In_Development-orange?style=flat-square)
[![CI/CD](https://github.com/Nguyen-Trung-Tien/AI_Vision_Assistant/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Nguyen-Trung-Tien/AI_Vision_Assistant/actions/workflows/ci-cd.yml)

</div>

---

---

> [!WARNING]
> **⚠️ TRẠNG THÁI DỰ ÁN — Local Development (Đồ án tốt nghiệp)**
>
> Dự án đang trong giai đoạn **phát triển và nghiên cứu**, chưa sẵn sàng cho production.

> [!CAUTION]
> **🔒 Bảo mật**
>
> - File `.env` chứa API keys & mật khẩu — **KHÔNG commit lên public repo**. Luôn sử dụng `.env.example`.
> - `ADMIN_DEFAULT_PASSWORD` và `JWT_SECRET` mặc định chỉ dùng cho dev — **bắt buộc đổi** trước khi deploy.
> - `GEMINI_API_KEY` là secret — không hardcode vào source code.
> - WebSocket hiện chấp nhận `origin: '*'` — cần restrict trong production.

> [!WARNING]
> **🎯 Độ chính xác AI**
>
> - YOLO model (`yolo11n`) là phiên bản **nano** — ưu tiên tốc độ hơn độ chính xác.
> - Nhận diện tiền VN phụ thuộc điều kiện ánh sáng, góc chụp, độ mới của tờ tiền.
> - Ước lượng khoảng cách dựa trên **MiDaS Small (Depth Estimation)** và công thức hình học — sai số ±20%.
> - Hallucination Guard cảnh báo khi confidence < 85%, nhưng **không đảm bảo 100% chính xác**.
> - Visual Q&A (Gemini) phụ thuộc API bên ngoài — có thể thay đổi/ngừng hoạt động.

> [!IMPORTANT]
> **⚡ Hiệu suất & Hạn chế**
>
> - AI Worker hỗ trợ **continuous stream cho walking mode** (latest-only queue + smart throttle).
> - Continuous stream được tối ưu ở mức **1-5 FPS** tùy chuyển động và pin.
> - Một số tính năng **bắt buộc Internet**: điều hướng GPS (OSRM), Visual Q&A (Gemini), Smart OCR.
> - Face Recognition sử dụng InsightFace (Buffalo_L) — cần GPU để đạt performance tốt nhất.
> - TFLite offline fallback cần model `.tflite` riêng — chưa tự động convert từ YOLO.

> [!NOTE]
> **📋 Lưu ý sử dụng**
>
> - Dự án mang tính **nghiên cứu/học thuật** — **KHÔNG** thay thế hệ thống an toàn chuyên dụng cho người khiếm thị.
> - Cần test kỹ trên thiết bị thật (không chỉ emulator) để đánh giá trải nghiệm thực tế.
> - Dữ liệu GPS/vị trí người dùng được gửi qua WebSocket — cân nhắc privacy khi deploy.

---

## 📰 Cập nhật mới nhất

### 🗓️ Tháng 5/2026 — v1.8.0 (Current)

| Ngày      | Cập nhật                        | Mô tả                                                                                                                                  |
| --------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **10/05** | 🎨 Mode Animations              | Animation riêng cho 7 chế độ AI (Money/Caption/Face/OCR/File/Layout) với CustomPaint và màu sắc khác biệt                              |
| **10/05** | 🔊 Speaking Overlay              | Hiệu ứng sóng âm waveform khi TTS đang đọc kết quả, overlay giữ nguyên cho đến khi đọc xong                                           |
| **10/05** | 🎯 Mode Color System             | Hệ thống màu riêng cho mỗi chế độ (Gold/Blue/Teal/Cyan/Orange/Green/Pink) trên carousel, icon và indicator dots                        |
| **07/05** | 🚨 SOS Success UI               | Cập nhật giao diện thông báo trạng thái "Đã gửi cảnh báo SOS" kèm tính năng đếm ngược 10 giây Hủy báo động giả trực quan trên Mobile |
| **01/05** | 📖 Layout Analysis              | Tích hợp Gemini 1.5 Flash cho phân tích bố cục menu, sách và tài liệu phức tạp, trả về cấu trúc chi tiết và đọc qua TTS                |
| **01/05** | 🚀 CI/CD Automation             | Thiết lập GitHub Actions tự động hóa quy trình Lint, Test và Build cho toàn bộ thành phần (Backend, AI, Admin, Mobile)                 |
| **01/05** | 📱 Admin Dashboard PWA          | Chuyển đổi Admin Dashboard sang Progressive Web App (PWA), cho phép cài đặt và hoạt động ổn định trên nhiều thiết bị                   |
| **01/05** | 🛡️ Stability & Type Safety      | Hoàn thiện dọn dẹp linting (flake8, ESLint) và thắt chặt kiểu dữ liệu (Strict Typing) cho toàn bộ hệ thống                             |

### 🗓️ Tháng 4/2026 — v1.6.0

### 🗓️ Tháng 4/2026 — v1.5.0

| Ngày      | Cập nhật                        | Mô tả                                                                                                                                  |
| --------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **17/04** | 🧠 Face Registration (Alpha)    | Nhận diện người quen sử dụng InsightFace: phát hiện tên người đứng trước camera; thêm phản hồi giọng nói & rung khi đăng ký thành công |
| **17/04** | 📏 MiDaS Depth Estimation       | Tích hợp mô hình MiDaS Small cho ước lượng chiều sâu đơn mục, tăng độ chính xác khoảng cách                                            |
| **17/04** | 📄 Smart OCR (Gemini Vision)    | Chế độ đọc thông minh: phân tích biển báo, thực đơn (menu), hóa đơn bằng Gemini AI                                                     |
| **17/04** | 🔧 Fix OCR & File Reader        | Sửa lỗi OCR Offline (ML Kit), đồng bộ giọng nói chuyển mode, hỗ trợ đọc tệp .txt và tối ưu hóa trích xuất PDF                          |
| **15/04** | 📺 Visual Feedback              | Hiển thị Bounding Boxes + Object Chips trên mobile, tăng độ nhạy AI (480x480)                                                          |
| **15/04** | 🔊 Spatial Audio 3D             | Tích hợp âm thanh 3D: xác định hướng vật cản qua tai nghe stereo                                                                       |
| **08/04** | 🔧 Fix offline model            | Sửa lỗi mobile không nhận model TFLite offline đã có sẵn trên máy                                                                      |
| **04/04** | 🚨 Emergency Contact Network    | Tích hợp mạng lưới liên hệ khẩn cấp: tự động SMS + cuộc gọi khi SOS                                                                    |
| **04/04** | 🚶 Continuous Stream hoàn thiện | Walking Mode 3–5 FPS: adaptive FPS, latest-only queue, smart throttle, battery saving                                                  |

### 🗓️ Tháng 4/2026 — v1.4.0

| Ngày      | Cập nhật                        | Mô tả                                                                                 |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| **15/04** | 📺 Visual Feedback              | Hiển thị Bounding Boxes + Object Chips trên mobile, tăng độ nhạy AI (480x480)         |
| **15/04** | 🔊 Spatial Audio 3D             | Tích hợp âm thanh 3D: xác định hướng vật cản qua tai nghe stereo                      |
| **08/04** | 🔧 Fix offline model            | Sửa lỗi mobile không nhận model TFLite offline đã có sẵn trên máy                     |
| **06/04** | 📦 Kaggle dataset               | Chuẩn bị và upload dataset lên Kaggle cho training model                              |
| **05/04** | 🚶 Continuous Stream fix        | Sửa lỗi UI đồng bộ ModeCarousel khi chuyển Walking Mode                               |
| **04/04** | 🚨 Emergency Contact Network    | Tích hợp mạng lưới liên hệ khẩn cấp: tự động SMS + cuộc gọi khi SOS                   |
| **04/04** | 🚶 Continuous Stream hoàn thiện | Walking Mode 3–5 FPS: adaptive FPS, latest-only queue, smart throttle, battery saving |
| **01/04** | 🛡️ System Integrity Audit       | Kiểm tra sức khỏe toàn bộ hệ thống, dọn dẹp code thừa                                 |

### 🗓️ Tháng 3/2026 — v1.2.0

| Ngày      | Cập nhật                  | Mô tả                                                                                   |
| --------- | ------------------------- | --------------------------------------------------------------------------------------- |
| **30/03** | 📝 README toàn diện       | Viết lại hoàn toàn README với kiến trúc, API docs, hướng dẫn chi tiết                   |
| **29/03** | 🚫 Loại bỏ mệnh giá nhỏ   | Xóa 200đ và 500đ khỏi dataset & constants (không còn lưu hành)                          |
| **28/03** | 🚦 Đèn giao thông         | Thêm 3 class: `traffic_light_red`, `traffic_light_yellow`, `traffic_light_green`        |
| **28/03** | 📊 Mở rộng 29 classes     | Thêm: motorbike, bus, plastic_bottle, glass_bottle, pothole, open_manhole, male, female |
| **28/03** | 📖 Đọc tài liệu PDF       | Thêm `document_reader_service.dart` hỗ trợ đọc file PDF bằng TTS                        |
| **28/03** | 🐛 Fix pika dependency    | Sửa lỗi `ModuleNotFoundError: No module named 'pika'`                                   |
| **27/03** | 🔤 Fix UTF-8 encoding     | Sửa lỗi hiển thị ký tự tiếng Việt bị lỗi trong `constants.py`                           |
| **27/03** | 🎓 YOLO Training pipeline | Hoàn thiện pipeline training: Roboflow → merge → Colab → deploy                         |

### 🗓️ Tháng 2/2026 — v1.0.0 → v1.1.0

| Ngày      | Cập nhật                   | Mô tả                                                                       |
| --------- | -------------------------- | --------------------------------------------------------------------------- |
| **27/02** | 🧹 Security hardening      | Loại bỏ hardcoded secrets, thêm sanitize TTS, cải thiện bảo mật             |
| **27/02** | 🗺️ OpenStreetMap migration | Chuyển navigation sang OSM API + FlutterMap (thay thế Google Maps)          |
| **26/02** | 🤖 Visual Q&A launch       | Tích hợp Gemini Vision API cho hỏi đáp bằng giọng nói qua ảnh               |
| **26/02** | 📊 Admin Dashboard v2      | Dashboard mới: SOS real-time, Heatmap, Feedback, Broadcast, User management |
| **25/02** | 👥 User management         | Thêm quản lý người dùng, sessions, broadcast TTS                            |
| **25/02** | 🔐 JWT + Cookie auth       | Hệ thống xác thực hoàn chỉnh: JWT token + cookie + WS guard                 |
| **25/02** | 🚨 SOS & Danger alerts     | Hệ thống SOS khẩn cấp + cảnh báo nguy hiểm real-time                        |
| **25/02** | 🗣️ TTS Cache (Redis)       | Cache audio TTS qua Redis, giảm latency phát giọng nói                      |
| **25/02** | 🎤 Voice commands          | Điều khiển app bằng giọng nói (Speech-to-Text)                              |

### 🗓️ v0.x — Foundation

- ✅ Khởi tạo cấu trúc monorepo: mobile_app + backend-gateway + ai-worker
- ✅ YOLO detection pipeline + RabbitMQ message queue
- ✅ OCR (Tesseract) + ML Kit (offline) barcode/text
- ✅ Scene captioning với spatial awareness (trái/giữa/phải)
- ✅ Nhận diện tiền Việt Nam (color validation + landmark features)
- ✅ TFLite on-device inference fallback
- ✅ Camera integration + accessibility (TTS + haptic)

---

## 🚀 Các tính năng nổi bật vừa cập nhật (v1.8.0)

Phiên bản v1.8.0 nâng cấp trải nghiệm người dùng với **hệ thống phản hồi thị giác chuyên biệt** cho từng chế độ AI:

1.  **🎨 Mode-Specific Animations (Mới)**:
    - Mỗi chế độ AI có animation `CustomPaint` riêng biệt với màu sắc và hiệu ứng đặc trưng.
    - 7 animation: Golden Ripples (Tiền) • Scan Wave (Caption) • Face Outline (Khuôn mặt) • Laser OCR (Online) • Grid Matrix (Offline) • Page Flip (File) • Layout Reveal (Bố cục).

2.  **🔊 Speaking Overlay (Mới)**:
    - Hiệu ứng sóng âm waveform hiển thị khi TTS đang đọc kết quả.
    - Overlay giữ nguyên suốt quá trình xử lý AI → đọc kết quả → tự đóng khi hoàn tất.

3.  **🎯 Mode Color System (Mới)**:
    - Hệ thống 7 màu riêng: 🟡 Gold (Tiền) • 🔵 Blue (Caption) • 🩵 Teal (Face) • 🔹 Cyan (OCR Online) • 🟠 Orange (File) • 🟢 Green (OCR Offline) • 🩷 Pink (Layout).
    - Áp dụng đồng nhất trên carousel, icon, indicator dots, và processing overlay.

4.  **🚨 Nâng cấp Trải nghiệm SOS**:
    - Giao diện thông báo SOS trực quan kèm đếm ngược 10 giây "Hủy báo động giả".

5.  **📖 Layout Analysis**:
    - Phân tích bố cục menu, sách, tài liệu phức tạp bằng Gemini 1.5 Flash.

6.  **🧠 Nhận diện khuôn mặt (InsightFace)**:
    - Nhận diện người quen qua model `Buffalo_L`, phản hồi rung và giọng nói.

7.  **🚶 Walking Mode + Spatial Audio 3D**:
    - Stream 3–5 FPS liên tục, cảnh báo vật cản theo hướng trái/phải qua tai nghe stereo.

---

## 📖 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Các tính năng vừa cập nhật](#-các-tính-năng-nổi-bật-vừa-cập-nhật-v170)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Luồng xử lý chính](#-luồng-xử-lý-chính)
- [Các chế độ trên Mobile App](#-các-chế-độ-trên-mobile-app)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu môi trường](#-yêu-cầu-môi-trường)
- [Hướng dẫn cài đặt & chạy](#-hướng-dẫn-cài-đặt--chạy)
- [Biến môi trường](#-biến-môi-trường)
- [API Endpoints & WebSocket Events](#-api-endpoints--websocket-events)
- [Dataset & Training YOLO](#-dataset--training-yolo)
- [Admin Dashboard](#-admin-dashboard)
- [Cập nhật mới nhất](#-cập-nhật-mới-nhất)
- [Roadmap](#-roadmap)
- [Tác giả & Liên hệ](#-tác-giả--liên-hệ)

---

## 🌟 Giới thiệu

**AI Vision Assistant** là hệ thống trợ lý thị giác thời gian thực, được thiết kế để hỗ trợ **người khiếm thị và người bị suy giảm thị lực** sử dụng camera điện thoại để "nhìn" thế giới xung quanh. Hệ thống bao gồm 4 thành phần chính:

| #   | Thành phần             | Công nghệ                          | Mô tả                                                                               |
| --- | ---------------------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | **📱 Mobile App**      | Flutter, Camera, TTS, GPS          | Ứng dụng cho người dùng cuối — chụp ảnh, nhận kết quả AI, phát giọng nói tiếng Việt |
| 2   | **🔗 Backend Gateway** | NestJS, PostgreSQL, RabbitMQ       | API server trung tâm — xác thực JWT, tiếp nhận WebSocket, quản lý message queue     |
| 3   | **🧠 AI Worker**       | Python, FastAPI, YOLO, OCR, Gemini | Xử lý AI — nhận diện vật thể, tiền, mô tả cảnh, hỏi đáp Visual Q&A                  |
| 4   | **📊 Admin Dashboard** | React 19, Vite, Tailwind CSS v4    | Bảng quản trị — thống kê, SOS, heatmap nguy hiểm, feedback AI, broadcast TTS        |

---

## ✅ Tính năng chính

### 🔍 Nhận diện AI

| Tính năng               | Mô tả                                                                        | Xử lý                                         |
| ----------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| **Nhận diện vật thể**   | 20 lớp đối tượng: xe cộ, người, cầu thang, ổ gà, nắp cống, vạch qua đường... | YOLO v11 (online) + TFLite (offline fallback) |
| **Nhận diện tiền VN**   | 9 mệnh giá: 1K → 500K VNĐ, kèm xác minh màu sắc HSV & đặc trưng landmark     | YOLO + color validation + OCR                 |
| **Đọc văn bản (OCR)**   | Đọc nhãn mác, biển báo, tài liệu (General/Smart Mode)                        | Tesseract + Gemini Vision (Smart OCR)         |
| **Mô tả cảnh**          | Mô tả không gian: vị trí trái/giữa/phải, ước lượng khoảng cách, gợi ý lối đi | YOLO + spatial analysis + MiDaS Depth         |
| **Visual Q&A**          | Hỏi đáp bằng giọng nói về ảnh camera                                         | Google Gemini Vision API                      |
| **Nhận diện khuôn mặt** | Nhận diện người quen, bạn bè đã đăng ký                                      | InsightFace (Buffalo_L)                       |

### 🛡️ An toàn & Hỗ trợ

| Tính năng              | Mô tả                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **Cảnh báo nguy hiểm** | Phát hiện vật cản gần (xe, ổ gà, nắp cống, cầu thang) + cảnh báo khoảng cách, vị trí  |
| **SOS khẩn cấp**       | Giữ màn hình/phím cứng → gửi SOS kèm GPS + ảnh đến admin dashboard                    |
| **Điều hướng GPS**     | GPS + la bàn + bản đồ OSM/OSRM → hướng dẫn đi bộ bằng giọng nói tiếng Việt            |
| **Flash tự động**      | Cảm biến ánh sáng tự bật/tắt đèn flash camera                                         |
| **Rung phản hồi**      | Haptic feedback theo loại sự kiện (nguy hiểm, xác nhận tiền, SOS)                     |
| **Continuous Stream**  | Chế độ đi bộ 3–5 FPS: phân tích liên tục, adaptive FPS, tiết kiệm pin                 |
| **Liên hệ khẩn cấp**   | SMS + cuộc gọi tự động đến người thân khi SOS, CRUD danh bạ khẩn cấp                  |
| **Visual Feedback**    | Hiển thị khung bao (Bounding Boxes) + nhãn vật thể thời gian thực trên camera preview |
| **Spatial Audio 3D**   | Cảnh báo vật cản theo hướng (Trái/Phải/Giữa) qua tai nghe stereo theo thời gian thực  |

### 🗣️ Text-to-Speech

| Tính năng               | Mô tả                                                         |
| ----------------------- | ------------------------------------------------------------- |
| **TTS đa ngữ**          | Hỗ trợ tiếng Việt (`vi`) và tiếng Anh (`en`)                  |
| **Hallucination Guard** | Thêm cảnh báo "có thể là" / "hình ảnh mờ" khi confidence thấp |
| **TTS Cache**           | Redis cache audio → giảm latency cho các phát ngôn lặp lại    |
| **Sanitize markdown**   | Loại bỏ ký tự markdown trước khi phát qua TTS                 |

---

## 🧭 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MOBILE APP (Flutter)                         │
│  Camera → Frame capture → WebSocket → TTS / Vibration / GPS/Map     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ WebSocket (Socket.IO)
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     BACKEND GATEWAY (NestJS)                         │
│                                                                      │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐   │
│  │   Auth   │ │   Vision   │ │   SOS    │ │ Feedback │ │Broadcast│   │
│  │ (JWT+WS) │ │ (WS+Queue) │ │ (Alerts) │ │ (Review) │ │  (TTS)  │   │
│  └──────────┘ └─────┬──────┘ └──────────┘ └──────────┘ └─────────┘   │
│                     │                                                │
│              ┌──────┴──────┐         ┌───────────────┐               │
│              │  RabbitMQ   │         │  PostgreSQL   │               │
│              │ (Task Queue)│         │  (Data Store) │               │
│              └──────┬──────┘         └───────────────┘               │
└─────────────────────┼────────────────────────────────────────────────┘
                      │ AMQP (ai_tasks_queue ↔ ai_results_queue)
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      AI WORKER (Python/FastAPI)                      │
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ YOLO v11     │ │ Money        │ │ Scene       │ │ Gemini      │   │
│  │ (Detection)  │ │ Detector     │ │ Captioner   │ │ Vision Q&A  │   │
│  └──────────────┘ └──────────────┘ └─────────────┘ └─────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Smart OCR    │ │ Face         │ │ Depth       │ │ Stabilizer  │   │
│  │ (Gemini)     │ │ Recognition  │ │ Estimator   │ │ (Temporal)  │   │
│  └──────────────┘ └──────────────┘ └─────────────┘ └─────────────┘   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD (React + Vite)                     │
│                                                                      │
│   Dashboard │ SOS Alerts │ Heatmap │ Feedback │ Broadcast │ Users    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔁 Luồng xử lý chính

```mermaid
sequenceDiagram
    participant M as 📱 Mobile App
    participant G as 🔗 Gateway (NestJS)
    participant Q as 📨 RabbitMQ
    participant W as 🧠 AI Worker
    participant D as 🗄️ PostgreSQL

    M->>G: 1. Đăng nhập (JWT)
    G-->>M: Token xác thực
    M->>G: 2. Kết nối WebSocket
    M->>G: 3. Gửi frame + task_type (double-tap / Q&A)
    G->>Q: 4. Đẩy task vào ai_tasks_queue
    Q->>W: 5. Consumer nhận task
    W->>W: 6. Xử lý AI (YOLO/OCR/Gemini)
    W->>Q: 7. Đẩy kết quả vào ai_results_queue
    Q->>G: 8. Gateway nhận kết quả
    G->>D: 9. Lưu detection log
    G-->>M: 10. Trả kết quả qua WebSocket
    M->>M: 11. Phát TTS + rung phản hồi
```

### Chi tiết xử lý theo `task_type`

| Task Type   | Trigger           | AI Service                               | Kết quả                                            | TTS          |
| ----------- | ----------------- | ---------------------------------------- | -------------------------------------------------- | ------------ |
| `OCR`       | Double-tap mode 0 | YOLO → Money Detector                    | Nhận diện tiền/vật thể + confidence + denomination | ✅ Server    |
| `TEXT_OCR`  | Mode 1            | Tesseract OCR                            | Văn bản trích xuất                                 | ✅ Server    |
| `CAPTION`   | Mode 3            | YOLO → Scene Captioner + Danger Detector | Mô tả cảnh + cảnh báo nguy hiểm                    | ✅ Server    |
| `visual_qa` | Nút Q&A           | Gemini Vision API                        | Câu trả lời tự nhiên                               | ✅ On-device |

---

## 📱 Các chế độ trên Mobile App

| Chế độ         | Tên               | Màu           | Mô tả                                                    | Online/Offline |
| -------------- | ----------------- | ------------- | -------------------------------------------------------- | -------------- |
| **Mode 0**     | Nhận diện tiền    | 🟡 Gold       | Nhận diện tiền VNĐ và vật thể (YOLO/TFLite)              | Both           |
| **Mode 1**     | Mô tả cảnh        | 🔵 Blue       | Mô tả không gian + MiDaS Depth + cảnh báo nguy hiểm      | Online         |
| **Mode 2**     | Nhận diện mặt     | 🩵 Teal       | Nhận diện người quen đã đăng ký (InsightFace)             | Online         |
| **Mode 3**     | Điều hướng GPS    | 💜 Purple     | GPS + la bàn + chỉ đường OSRM/OSM                        | Online         |
| **Mode 4**     | OCR Online        | 🔹 Cyan       | Đọc văn bản qua Tesseract / Gemini (Smart OCR)           | Online         |
| **Mode 5**     | Đọc tệp           | 🟠 Orange     | Đọc file PDF, TXT, DOCX bằng TTS                         | Offline        |
| **Mode 6**     | OCR Offline       | 🟢 Green      | ML Kit Text Recognition + Barcode Scanner                | Offline        |
| **Mode 7**     | Phân tích bố cục  | 🩷 Pink       | Phân tích layout trang/tài liệu (Gemini)                 | Online         |
| **Visual Q&A** | Hỏi đáp           | —             | Hỏi đáp trực quan bằng giọng nói (Gemini AI)             | Online         |

### Các thành phần Mobile App

```
mobile_app/lib/
├── main.dart                          # Entry point
├── screens/
│   ├── splash_screen.dart             # Màn hình khởi động (animation logo)
│   ├── onboarding_screen.dart         # Hướng dẫn sử dụng lần đầu
│   ├── login_screen.dart              # Đăng nhập JWT
│   ├── main_screen.dart               # Màn hình chính (camera + AI)
│   ├── navigation_screen.dart         # Điều hướng bản đồ
│   ├── settings_screen.dart           # Cài đặt (ngôn ngữ, khoảng cách, liên hệ SOS)
│   ├── emergency_contacts_screen.dart # Quản lý danh bạ khẩn cấp
│   └── history_screen.dart            # Lịch sử nhận diện
├── services/
│   ├── websocket_service.dart         # Socket.IO client
│   ├── auth_service.dart              # Xác thực JWT
│   ├── edge_ai_service.dart           # TFLite inference offline
│   ├── tflite_service.dart            # TFLite model loading
│   ├── ml_kit_service.dart            # ML Kit OCR + Barcode
│   ├── navigation_service.dart        # GPS + OSRM routing
│   ├── sos_service.dart               # SOS khẩn cấp
│   ├── voice_command_service.dart     # Giọng nói điều khiển
│   ├── feedback_service.dart          # Gửi phản hồi AI
│   ├── light_sensor_service.dart      # Flash tự động
│   ├── accessibility_manager.dart     # TTS + Vibration manager
│   ├── document_reader_service.dart   # Đọc tài liệu PDF
│   ├── settings_service.dart          # Lưu cài đặt local
│   ├── history_service.dart           # Lưu lịch sử detection
│   ├── continuous_stream_service.dart # Stream liên tục 3–5 FPS (Walking Mode)
│   ├── emergency_contact_service.dart # CRUD liên hệ khẩn cấp
│   ├── power_button_service.dart      # Nút nguồn (SOS)
│   └── volume_button_service.dart     # Nút âm lượng (chuyển mode)
├── widgets/
│   ├── mode_carousel.dart             # Carousel chuyển chế độ
│   ├── status_overlay.dart            # Overlay trạng thái AI
│   └── visual_qa_button.dart          # Nút Visual Q&A
├── theme/                             # Dark theme config
├── utils/                             # Tiện ích chung
└── l10n/                              # Localization (vi/en)
```

---

## 📁 Cấu trúc thư mục

```
Vision Assistant/
├── 📱 mobile_app/                    # Flutter mobile application | [README.md](mobile_app/README.md)
│   ├── lib/                          # Source code Dart
│   ├── android/                      # Android native config
│   ├── ios/                          # iOS native config
│   ├── assets/models/                # TFLite models (offline)
│   └── pubspec.yaml                  # Flutter dependencies
│
├── 🔗 backend-gateway/              # NestJS API Gateway | [README.md](backend-gateway/README.md)
│   ├── src/
│   │   ├── auth/                     # JWT authentication + WS guard
│   │   ├── vision/                   # WebSocket gateway + RabbitMQ queue
│   │   ├── sos/                      # SOS alert management
│   │   ├── feedback/                 # AI feedback collection
│   │   ├── broadcast/                # TTS broadcast to users
│   │   ├── stats/                    # Statistics & analytics
│   │   ├── users/                    # User management (admin/user roles)
│   │   ├── emergency-contact/        # CRUD liên hệ khẩn cấp
│   │   └── sms/                      # SMS service (gửi SMS khi SOS)
│   ├── docker-compose.yml            # RabbitMQ container
│   └── package.json                  # Node.js dependencies
│
├── 🧠 ai-worker/                    # Python AI Processing Engine | [README.md](ai-worker/README.md)
│   ├── services/
│   │   ├── ai_service.py             # Façade module (backward compat API)
│   │   ├── model_manager.py          # YOLO model loading & detection
│   │   ├── money_detector.py         # VN currency recognition
│   │   ├── scene_captioner.py        # Spatial scene description
│   │   ├── danger_detector.py        # Danger alert system
│   │   ├── text_ocr.py               # Tesseract OCR processing
│   │   ├── gemini_service.py         # Google Gemini Vision Q&A
│   │   ├── tts_cache.py              # Redis-based TTS cache
│   │   ├── stabilizer.py             # Temporal result stabilization
│   │   ├── image_utils.py            # Image decode, blur, color analysis
│   │   ├── constants.py              # Labels, translations, color ranges
│   │   └── translations.py           # Multi-language string templates
│   ├── rabbitmq_consumer.py          # RabbitMQ consumer (main worker loop)
│   ├── main.py                       # FastAPI server + consumer launcher
│   ├── train_yolo.py                 # YOLO training script
│   ├── merge_vnd_dataset.py          # Dataset merger (VN money + objects)
│   ├── prepare_dataset_from_roboflow.py  # Roboflow dataset standardizer
│   ├── package_for_colab.py          # Colab bundle packager
│   ├── COLAB_TRAINING.md             # Training guide
│   └── requirements.txt             # Python dependencies
│
├── 📊 admin-dashboard/              # React Admin Panel | [README.md](admin-dashboard/README.md)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardV2.jsx       # Tổng quan thống kê
│   │   │   ├── SosPage.jsx           # Quản lý SOS alerts
│   │   │   ├── HeatmapPage.jsx       # Heatmap vùng nguy hiểm
│   │   │   ├── FeedbackPage.jsx      # Review feedback AI
│   │   │   ├── BroadcastPage.jsx     # Broadcast TTS đến users
│   │   │   ├── UsersPage.jsx         # Quản lý người dùng
│   │   │   └── LoginV2.jsx           # Đăng nhập admin
│   │   ├── components/               # Reusable UI components
│   │   ├── services/                 # API service layer
│   │   └── App.jsx                   # App shell + sidebar navigation
│   └── package.json                  # Node.js dependencies
│
├── .gitignore                        # Git ignore rules
└── README.md                         # ← You are here
```

---

## 💻 Yêu cầu môi trường

### Phần mềm bắt buộc

| Phần mềm           | Phiên bản      | Ghi chú                           |
| ------------------ | -------------- | --------------------------------- |
| **Node.js**        | 22+ (npm 10+)  | Backend Gateway + Admin Dashboard |
| **Python**         | 3.10 – 3.12    | AI Worker                         |
| **Flutter SDK**    | 3.x (mới nhất) | Mobile App                        |
| **Docker Desktop** | Latest         | Chạy RabbitMQ container           |
| **PostgreSQL**     | 14+            | Database (cổng `5433`)            |
| **Redis**          | 7+             | TTS cache (cổng `6379`)           |

### Phần mềm tùy chọn

| Phần mềm           | Mục đích                        |
| ------------------ | ------------------------------- |
| **Tesseract OCR**  | OCR engine cho AI Worker        |
| **Android Studio** | Chạy Android emulator           |
| **Xcode**          | Chạy iOS simulator (macOS only) |
| **GPU (NVIDIA)**   | Tăng tốc YOLO inference         |

---

## 🚀 Hướng dẫn cài đặt & chạy

### 1️⃣ RabbitMQ (Docker)

```bash
cd backend-gateway
docker compose up -d
```

> **Kiểm tra:** Truy cập http://localhost:15672 (guest/guest) để xem RabbitMQ Management UI.

### 2️⃣ PostgreSQL

Đảm bảo PostgreSQL đang chạy trên cổng `5433` với database `AI_Vision_Assistant`:

```sql
CREATE DATABASE "AI_Vision_Assistant";
```

> [!TIP]
> `DB_SYNC=true` trong `.env` sẽ tự động tạo tables khi khởi động NestJS (chỉ dùng cho development).

### 3️⃣ Redis

Đảm bảo Redis chạy trên cổng `6379` (default config).

### 4️⃣ Backend Gateway

```bash
cd backend-gateway
npm install
npm run start:dev
```

> **Server chạy tại:** http://localhost:3000
> **WebSocket:** ws://localhost:3000

### 5️⃣ AI Worker

```bash
cd ai-worker

# Tạo virtual environment
python -m venv .venv

# Kích hoạt venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Option A: Chỉ chạy RabbitMQ consumer (đủ cho inference)
python rabbitmq_consumer.py

# Option B: Chạy FastAPI + consumer (thêm health check + static audio)
python main.py
```

> **FastAPI server (nếu dùng Option B):** http://localhost:8000
> **Health check:** GET http://localhost:8000/health

### 6️⃣ Admin Dashboard

```bash
cd admin-dashboard
npm install
npm run dev
```

> **Dashboard chạy tại:** http://localhost:4200

### 7️⃣ Mobile App

```bash
cd mobile_app
flutter pub get

# Android Emulator (localhost maps to 10.0.2.2)
flutter run --dart-define=BACKEND_URL=http://10.0.2.2:3000

# Thiết bị Android thật (thay IP LAN)
flutter run --dart-define=BACKEND_URL=http://192.168.1.X:3000

# iOS Simulator
flutter run --dart-define=BACKEND_URL=http://localhost:3000
```

> [!IMPORTANT]
> Khi chạy trên thiết bị thật, hãy thay `192.168.1.X` bằng IP LAN thực của máy dev.
> Đảm bảo thiết bị và máy dev cùng mạng WiFi.

---

## 🔑 Biến môi trường

### `backend-gateway/.env`

```env
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASS=your_db_password
DB_NAME=AI_Vision_Assistant
DB_SYNC=true                    # Auto-sync schema (dev only!)

# Authentication
JWT_SECRET=your-strong-jwt-secret-key

# Message Queue
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672

# Admin
ADMIN_DEFAULT_PASSWORD=changeme  # ⚠️ Đổi trước khi deploy!
```

### `ai-worker/.env`

```env
# Message Queue
RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672/

# Cache
REDIS_URL=redis://127.0.0.1:6379

# AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3-flash-preview     # Optional: override model
GEMINI_MAX_OUTPUT_TOKENS=256             # Optional: limit response length
```

> [!CAUTION]
> **KHÔNG commit API keys & passwords** vào repository.
> Sử dụng file `.env.example` làm template và thêm `.env` vào `.gitignore`.

---

## 🌐 API Endpoints & WebSocket Events

### REST API (`backend-gateway` — prefix: `/api`)

| Method  | Endpoint                | Mô tả                   | Auth     |
| ------- | ----------------------- | ----------------------- | -------- |
| `POST`  | `/api/auth/register`    | Đăng ký tài khoản       | ❌       |
| `POST`  | `/api/auth/login`       | Đăng nhập (nhận JWT)    | ❌       |
| `POST`  | `/api/auth/admin/login` | Đăng nhập admin         | 🔒 Admin |
| `GET`   | `/api/stats/dashboard`  | Thống kê dashboard      | 🔒 Admin |
| `GET`   | `/api/sos`              | Danh sách SOS alerts    | 🔒 Admin |
| `PATCH` | `/api/sos/:id/resolve`  | Đánh dấu SOS đã xử lý   | 🔒 Admin |
| `GET`   | `/api/feedback`         | Danh sách feedback      | 🔒 Admin |
| `POST`  | `/api/feedback`         | Gửi feedback            | 🔒 User  |
| `POST`  | `/api/broadcast`        | Broadcast TTS đến users | 🔒 Admin |
| `GET`   | `/api/broadcast`        | Lịch sử broadcast       | 🔒 Admin |

### WebSocket Events (Socket.IO)

| Event           | Direction       | Payload                                                                                          | Mô tả                                |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `frame_stream`  | Client → Server | `{ frame, task_type, lang, warning_distance_m, latitude, longitude, mode, priority, frame_seq }` | Gửi frame để AI xử lý                |
| `stream_ack`    | Server → Client | `{ status, timestamp }`                                                                          | Xác nhận nhận frame                  |
| `ai_result`     | Server → Client | `{ text, confidence_score, audio_url, stable, danger_alerts }`                                   | Kết quả AI                           |
| `visual_qa`     | Client → Server | `{ frame, question, lang }`                                                                      | Gửi câu hỏi Visual Q&A               |
| `visual_qa_ack` | Server → Client | `{ status, timestamp }`                                                                          | Xác nhận nhận Q&A                    |
| `sos_alert`     | Client → Server | `{ latitude, longitude, imageBase64? }`                                                          | Gửi SOS khẩn cấp                     |
| `sos_ack`       | Server → Client | `{ status, timestamp }`                                                                          | Xác nhận SOS                         |
| `sos_incoming`  | Server → Admin  | `{ sosId, userId, latitude, longitude, ... }`                                                    | Thông báo SOS đến admin              |
| `join_admin`    | Client → Server | —                                                                                                | Admin join admin room                |
| `join_user`     | Client → Server | —                                                                                                | User join user room (nhận broadcast) |
| `broadcast_tts` | Server → Users  | `{ message, audioUrl }`                                                                          | Admin broadcast TTS                  |

---

## 🤖 Dataset & Training YOLO

### Danh sách 20 lớp đối tượng (canonical classes)

```
 Tiền VN (9):                Vật thể & giao thông (11):
  0: tien_1k                  9: xe_may (motorbike)
  1: tien_2k                 10: cau_thang (stairs)
  2: tien_5k                 11: o_ga (pothole)
  3: tien_10k                12: ong_cong (manhole)
  4: tien_20k                13: xe_lon (car/truck/bus)
  5: tien_50k                14: nguoi (person/male/female)
  6: tien_100k               15: den_do (traffic_light_red)
  7: tien_200k               16: den_vang (traffic_light_yellow)
  8: tien_500k               17: den_xanh (traffic_light_green)
                             18: den_giao_thong (traffic_light)
                             19: vach_qua_duong (crosswalk)
```

> [!NOTE]
> Xem hướng dẫn chi tiết tại [`ai-worker/COLAB_TRAINING.md`](ai-worker/COLAB_TRAINING.md).

---

## 📊 Admin Dashboard

Dashboard quản trị cung cấp các trang:

| Trang            | Chức năng                                                    |
| ---------------- | ------------------------------------------------------------ |
| **Dashboard**    | Tổng quan: số detection, SOS, users online, biểu đồ thống kê |
| **SOS Khẩn Cấp** | Danh sách cảnh báo SOS real-time, GPS, ảnh đính kèm, resolve |
| **Heatmap**      | Bản đồ nhiệt vùng nguy hiểm (Leaflet + heatmap layer)        |
| **Feedback AI**  | Review phản hồi người dùng về kết quả AI (đúng/sai)          |
| **Broadcast**    | Gửi thông báo TTS đến tất cả users đang online               |
| **Người dùng**   | Quản lý tài khoản, phân quyền RBAC (Admin/User), thống kê    |
| **Analytics**    | Phân tích độ chính xác AI, xu hướng và giờ cao điểm          |
| **Hệ thống**     | Giám sát tài nguyên (CPU, RAM, DB), Audit Logs (Nhật ký)     |
| **AI Models**    | Quản lý và chuyển đổi các mô hình AI (Model Manager)         |

### Tính năng nổi bật

- **Real-time updates** qua Socket.IO
- **Responsive design** — hoạt động trên mobile và desktop
- **Dark theme** mặc định
- **Charts** sử dụng Recharts (Line, Pie)
- **Map** sử dụng React-Leaflet + leaflet.heat

---

## 📌 Roadmap

### Đã hoàn thành (v1.8.0)

- [x] **Mode-Specific Animations** — 7 animation CustomPaint riêng cho mỗi chế độ AI
- [x] **Speaking Overlay** — Waveform khi TTS đọc kết quả, overlay giữ đến khi hoàn tất
- [x] **Mode Color System** — Hệ thống 7 màu riêng trên carousel, icon, dots
- [x] Smart OCR nâng cao (dịch thuật trực tiếp nội dung biển báo)
- [x] Offline-First Mode hoàn chỉnh (auto-switch online/offline)
- [x] Cloud deployment (Docker Compose full stack)
- [x] Offline model auto-update (OTA)
- [x] Nhận diện khuôn mặt người quen (Face Recognition với InsightFace)
- [x] Ước lượng chiều sâu đơn mục (Monocular Depth Estimation với MiDaS)
- [x] Chế độ OCR thông minh (Smart OCR: biển báo, menu, hóa đơn qua Gemini)
- [x] Stream liên tục 3–5 FPS cho chế độ đi bộ (walking mode + adaptive FPS)
- [x] Mạng lưới liên hệ khẩn cấp (SMS + cuộc gọi tự động khi SOS)
- [x] Âm thanh không gian 3D (trái/phải) theo vị trí vật cản
- [x] Visual Feedback (Bounding Boxes + Object Labels) trên preview
- [x] Admin Dashboard mở rộng (System Monitor, Analytics, RBAC, Activity Log)
- [x] Layout analysis (đọc menu/sách) bằng Gemini 1.5 Flash
- [x] CI/CD pipeline tự động hóa (GitHub Actions)
- [x] Progressive Web App cho Admin Dashboard

### Đang phát triển

- [ ] Tối ưu hóa depth estimation cho các loại địa hình phức tạp
- [ ] Nhận diện hành vi nguy hiểm (xe phóng nhanh, vật rơi)

### Kế hoạch tương lai

- [ ] Tối ưu hóa depth estimation cho các loại địa hình phức tạp
- [ ] Nhận diện hành vi nguy hiểm (xe phóng nhanh, vật rơi)
- [ ] Tích hợp mô hình ngôn ngữ lớn (LLM) cho hội thoại tư vấn offline

---

## 🛠️ Tech Stack chi tiết

<details>
<summary><b>📱 Mobile App</b></summary>

| Package                         | Phiên bản | Mục đích                    |
| ------------------------------- | --------- | --------------------------- |
| `flutter`                       | SDK ^3.10 | Framework chính             |
| `camera`                        | ^0.11.4   | Camera capture              |
| `flutter_tts`                   | ^4.2.5    | Text-to-Speech              |
| `socket_io_client`              | ^3.1.4    | WebSocket real-time         |
| `geolocator`                    | ^14.0.2   | GPS location                |
| `flutter_compass`               | ^0.8.1    | La bàn điều hướng           |
| `flutter_map`                   | ^7.0.2    | Bản đồ OpenStreetMap        |
| `google_mlkit_text_recognition` | ^0.15.1   | OCR offline                 |
| `google_mlkit_barcode_scanning` | ^0.14.2   | Barcode/QR offline          |
| `speech_to_text`                | ^7.3.0    | Voice commands              |
| `tflite_flutter`                | ^0.11.0   | On-device AI inference      |
| `vibration`                     | ^3.1.7    | Haptic feedback             |
| `permission_handler`            | ^12.0.1   | Quản lý permissions         |
| `shared_preferences`            | ^2.3.3    | Local storage               |
| `syncfusion_flutter_pdf`        | ^33.1.45  | Đọc tài liệu PDF            |
| `flutter_contacts`              | ^1.1.9    | Liên hệ SOS                 |
| `battery_plus`                  | ^7.0.0    | Theo dõi pin (adaptive FPS) |

</details>

<details>
<summary><b>🔗 Backend Gateway</b></summary>

| Package                      | Phiên bản | Mục đích                |
| ---------------------------- | --------- | ----------------------- |
| `@nestjs/core`               | ^11.0.1   | Framework chính         |
| `@nestjs/websockets`         | ^11.1.14  | WebSocket server        |
| `@nestjs/platform-socket.io` | ^11.1.14  | Socket.IO adapter       |
| `@nestjs/typeorm`            | ^11.0.0   | ORM (PostgreSQL)        |
| `@nestjs/jwt`                | ^11.0.2   | JWT authentication      |
| `@nestjs/passport`           | ^11.0.5   | Passport.js integration |
| `@nestjs/microservices`      | ^11.1.14  | RabbitMQ integration    |
| `amqp-connection-manager`    | ^5.0.0    | AMQP connection pool    |
| `bcrypt`                     | ^6.0.0    | Password hashing        |
| `class-validator`            | ^0.14.3   | DTO validation          |
| `pg`                         | ^8.18.0   | PostgreSQL driver       |

</details>

<details>
<summary><b>🧠 AI Worker</b></summary>

| Package         | Phiên bản | Mục đích                            |
| --------------- | --------- | ----------------------------------- |
| `fastapi`       | ≥0.104.1  | HTTP server (health + static files) |
| `uvicorn`       | ≥0.24.0   | ASGI server                         |
| `pika`          | ≥1.3.2    | RabbitMQ client                     |
| `redis`         | ≥5.0.1    | TTS cache                           |
| `ultralytics`   | ≥8.0.0    | YOLO v11 inference                  |
| `opencv-python` | ≥4.8.0    | Image processing                    |
| `numpy`         | ≥1.24.0   | Numerical operations                |
| `pytesseract`   | ≥0.3.10   | OCR engine                          |
| `google-genai`  | ≥1.0.0    | Google Gemini Vision API            |
| `python-dotenv` | ≥1.0.0    | Environment variables               |

</details>

<details>
<summary><b>📊 Admin Dashboard</b></summary>

| Package            | Phiên bản | Mục đích                |
| ------------------ | --------- | ----------------------- |
| `react`            | ^19.0.0   | UI framework            |
| `react-dom`        | ^19.0.0   | React DOM renderer      |
| `vite`             | ^6.0.0    | Build tool + dev server |
| `tailwindcss`      | ^4.0.0    | CSS framework           |
| `recharts`         | ^2.15.0   | Charts (Line, Pie)      |
| `react-leaflet`    | ^5.0.0    | Map component           |
| `leaflet`          | ^1.9.4    | Map engine              |
| `leaflet.heat`     | ^0.2.0    | Heatmap layer           |
| `socket.io-client` | ^4.8.3    | Real-time WebSocket     |

</details>

---

## 👨‍💻 Tác giả & Liên hệ

<div align="center">

### **Nguyễn Trung Tiến**

[![Email](https://img.shields.io/badge/Email-2251120447%40ut.edu.vn-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:2251120447@ut.edu.vn) [![Email](https://img.shields.io/badge/Email-trungtiennguyen910%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:trungtiennguyen910@gmail.com) [![GitHub](https://img.shields.io/badge/GitHub-Nguyen--Trung--Tien-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Nguyen-Trung-Tien)

_Đồ án tốt nghiệp — Đại học Giao thông Vận tải TP. Hồ Chí Minh (UTH)_

---

**⭐ Nếu dự án hữu ích, hãy cho một star trên GitHub! ⭐**

</div>
```

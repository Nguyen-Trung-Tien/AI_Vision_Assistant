---
description: Thêm các tính năng admin dashboard hỗ trợ quản lý người khiếm thị - SOS, heatmap nguy hiểm, feedback AI, broadcast TTS
---

## Mục tiêu

Nâng cấp Admin Dashboard với 4 tính năng chính:

1. **Heatmap khu vực nguy hiểm** — Bản đồ điểm nóng tổng hợp từ GPS cảnh báo
2. **Hệ thống SOS & cảnh báo khẩn cấp** — Nhận alert SOS từ user và hiển thị vị trí
3. **Feedback Loop AI** — Admin/user đánh dấu kết quả AI sai → tái sử dụng làm dataset
4. **Broadcast TTS** — Gửi thông báo văn bản → app tự đọc cho người dùng

---

## ═══ PHẦN 1: HEATMAP KHU VỰC NGUY HIỂM ═══

### Bước 1.1: Thêm cột tọa độ GPS vào bảng detection

1. Mở `backend-gateway/src/` và tìm entity lưu lịch sử nhận diện
2. Thêm field `latitude` và `longitude` (float, nullable) vào entity
3. Cập nhật DTO để nhận tọa độ từ Mobile App
4. Di chuyển DB (nếu dùng TypeORM với `DB_SYNC=true` thì tự động)

### Bước 1.2: Mobile gửi kèm tọa độ GPS

1. Mở file xử lý stream frame trong `mobile_app/lib/`
2. Dùng `Geolocator` để lấy vị trí hiện tại
3. Đính kèm `{ latitude, longitude }` vào mỗi frame gửi lên server

### Bước 1.3: Thêm trang Heatmap vào Dashboard

1. Mở `admin-dashboard/src/`
2. Cài thêm thư viện bản đồ:
   ```bash
   cd admin-dashboard
   npm install leaflet react-leaflet leaflet.heat
   ```
3. Tạo component `HeatmapPage.tsx`:
   - Fetch API `GET /detections/heatmap?type=danger` → trả về list `{lat, lng, weight}`
   - Render bản đồ Leaflet với layer `HeatmapLayer`
   - Thêm filter theo: loại nguy hiểm, khoảng thời gian, khu vực

### Bước 1.4: Tạo endpoint heatmap trong Backend

1. Tạo `GET /detections/heatmap` trong controller
2. Query DB lấy tọa độ các detection có type là `danger`
3. Group by khu vực (tùy chọn) và trả về JSON `[{lat, lng, intensity}]`

---

## ═══ PHẦN 2: HỆ THỐNG SOS KHẨN CẤP ═══

### Bước 2.1: Thêm nút SOS vào Mobile App

1. Thêm nút SOS nổi bật (màu đỏ, to, ở góc màn hình) vào `mobile_app/lib/`
2. Giữ nút 3 giây để kích hoạt (tránh bấm nhầm)
3. Khi kích hoạt:
   - Chụp ảnh hiện tại
   - Lấy GPS hiện tại
   - Gửi event `sos_alert` qua WebSocket với `{ image, latitude, longitude, timestamp }`

### Bước 2.2: Xử lý SOS trong Backend

1. Thêm handler event `sos_alert` trong `vision.gateway.ts`
2. Lưu sự kiện SOS vào bảng riêng với trạng thái `pending`
3. Emit real-time đến tất cả admin đang online qua WebSocket room `admin`

### Bước 2.3: Hiển thị SOS trong Dashboard

1. Tạo component `SOSAlert` trong `admin-dashboard/src/`
2. Khi nhận event SOS:
   - Popup thông báo khẩn cấp chiếm toàn màn hình (màu đỏ)
   - Phát âm thanh còi alert
   - Hiển thị: ảnh chụp lúc SOS, vị trí trên bản đồ, thời gian
   - Nút "Đã xử lý" để đánh dấu hoàn thành

---

## ═══ PHẦN 3: FEEDBACK LOOP AI ═══

### Bước 3.1: Thêm nút phản hồi vào Mobile App

1. Sau mỗi kết quả AI (nhận diện/mô tả), hiển thị 2 nút nhỏ:
   - 👍 **Đúng** (bấm hoặc nói "Đúng")
   - 👎 **Sai** (bấm hoặc nói "Sai")
2. Timeout 5 giây rồi tự ẩn để không làm phiền user
3. Gửi feedback `POST /feedback { detectionId, isCorrect, userId }`

### Bước 3.2: Backend lưu và xử lý feedback

1. Tạo entity `Feedback` trong Backend:
   - `detectionId`, `isCorrect`, `createdAt`
2. Khi `isCorrect = false`: lưu kèm ảnh gốc vào thư mục `ai-worker/dataset/feedback/`

### Bước 3.3: Dashboard hiển thị kết quả feedback

1. Tạo trang `FeedbackPage.tsx` trong Dashboard:
   - Bảng danh sách các lần AI sai
   - Admin review từng ảnh và gán nhãn đúng
   - Nút "Export dataset" để xuất ra file zip theo định dạng YOLO

---

## ═══ PHẦN 4: BROADCAST THÔNG BÁO TTS ═══

### Bước 4.1: Tạo giao diện Broadcast trong Dashboard

1. Tạo trang/section `BroadcastPage.tsx` trong `admin-dashboard/src/`
2. UI gồm:
   - Textarea nhập nội dung thông báo
   - Selector đối tượng: Tất cả user / Theo nhóm / User cụ thể
   - Nút "Gửi thông báo" + preview nội dung
3. Gọi `POST /broadcast { message, targetUsers, priority }`

### Bước 4.2: Backend xử lý broadcast

1. Tạo `POST /broadcast` endpoint trong Backend
2. Lấy danh sách socket ID của user được chỉ định
3. Emit event `tts_broadcast { message, priority }` đến từng socket

### Bước 4.3: Mobile App nhận và đọc thông báo

1. Lắng nghe event `tts_broadcast` trong WebSocket handler
2. Thêm message vào hàng đợi TTS với độ ưu tiên cao
3. Prefix thông báo: _"Thông báo hệ thống: [nội dung]"_

---

## Kiểm thử tổng thể

- [ ] Heatmap hiển thị đúng vị trí nguy hiểm đã phát hiện
- [ ] SOS gửi từ mobile → Admin nhận trong < 1 giây
- [ ] Feedback sai → ảnh lưu đúng vào thư mục dataset
- [ ] Broadcast admin → mobile TTS đọc trong < 2 giây
- [ ] Dashboard load nhanh dù có nhiều điểm heatmap (> 1000 điểm)

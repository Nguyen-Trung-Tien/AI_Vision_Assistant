# Admin Dashboard (React 19)

Bảng điều khiển quản trị tập trung cho hệ thống AI Vision Assistant. Cho phép giám sát SOS real-time, phân tích vùng nguy hiểm, quản lý phản hồi người dùng và điều khiển hệ thống từ xa.

---

## 🗓️ Lịch sử cập nhật (Dashboard)

| Ngày | Cập nhật | Chi tiết |
| --- | --- | --- |
| **19/04** | 📊 RBAC UI | Cập nhật giao diện phân quyền cho Admin và Super Admin. |
| **18/04** | 🔧 UI Density Fix | Tối ưu hóa mật độ hiển thị, giúp dashboard gọn gàng và chuyên nghiệp hơn. |
| **15/04** | 🛡️ SOS Real-time | Nâng cấp hệ thống cảnh báo SOS kèm popup và thông báo âm thanh. |
| **26/02** | 📈 Heatmap v2 | Tích hợp bản đồ nhiệt vùng nguy hiểm sử dụng Leaflet.heat. |
| **25/02** | 🗣️ Broadcast TTS | Chức năng gửi thông báo giọng nói tức thời đến toàn bộ Mobile App. |
| **24/02** | 📺 UI Modernization | Chuyển sang React 19 + Tailwind v4 + Dark Mode mặc định. |

---

## 🚀 Công nghệ sử dụng

- **React 19**: Framework frontend hiện đại nhất.
- **Vite 6**: Công cụ build siêu nhanh.
- **Tailwind CSS v4**: Styling engine thế hệ mới, tối ưu hiệu suất.
- **Socket.IO Client**: Kết nối real-time với Gateway.
- **React-Leaflet**: Hiển thị bản đồ và Heatmap.
- **Recharts**: Biểu đồ thống kê trực quan.

---

## ✅ Chức năng chính

| Trang | Chức năng |
| --- | --- |
| **Dashboard** | Tổng quan thống kê (Detections, SOS, Online Users). |
| **SOS Alerts** | Theo dõi các cảnh báo khẩn cấp real-time kèm vị trí và hình ảnh. |
| **Heatmap** | Bản đồ nhiệt hiển thị các vùng thường xuyên có vật cản nguy hiểm. |
| **Feedback Management** | Đánh giá độ chính xác của AI từ phản hồi người dùng. |
| **AI Model Management** | (Beta) Quản lý trạng thái và triển khai các mô hình AI. |
| **Broadcast TTS** | Gửi thông báo bằng giọng nói đến toàn bộ người dùng đang online. |
| **User Management** | Quản lý tài khoản, vai trò (Super Admin/Admin) và phiên đăng nhập. |

---

## ⚙️ Cài đặt & chạy

### 1. Cấu hình Biến môi trường

Tạo file `.env` tại thư mục `admin-dashboard/`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 2. Khởi chạy

```bash
cd admin-dashboard
npm install
npm run dev
```

Dashboard sẽ chạy tại địa chỉ: `http://localhost:4200`

---

## 🔐 Phân quyền (RBAC)

Hệ thống hỗ trợ 2 vai trò quản trị:
- **SUPER_ADMIN**: Toàn quyền hệ thống, quản lý admin khác.
- **ADMIN**: Xem báo cáo, xử lý SOS, quản lý feedback và broadcast.

---

## 🛠 Xử lý sự cố

- **Không thấy dữ liệu real-time**: Kiểm tra trạng thái Backend Gateway và kết nối WebSocket.
- **Lỗi Login**: Kiểm tra URL API trong `.env` và đảm bảo tài khoản có role `ADMIN` hoặc `SUPER_ADMIN`.
- **Bản đồ không hiển thị**: Đảm bảo máy tính có kết nối Internet để tải tiles từ OpenStreetMap.

---

## 📸 Giao diện

Dashboard được thiết kế với **Dark Mode** mặc định, tối ưu cho việc giám sát trong thời gian dài mà không gây mỏi mắt.

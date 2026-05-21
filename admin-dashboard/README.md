<div align="center">

# 📊 Admin Dashboard

### Bảng điều khiển quản trị tập trung cho hệ thống AI Vision Assistant

_Giám sát hệ thống, theo dõi SOS khẩn cấp, phân tích bản đồ nhiệt (Heatmap) và quản lý người dùng theo thời gian thực._

<br/>

![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white&style=for-the-badge)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real_Time-010101?logo=socket.io&logoColor=white&style=for-the-badge)

</div>

---

## 🚀 Công nghệ sử dụng

- **React 19**: Framework frontend hiện đại và tối ưu nhất.
- **Vite 6**: Công cụ build siêu tốc thế hệ mới.
- **Tailwind CSS v4**: Styling engine mạnh mẽ, tối ưu hiệu suất, tích hợp sẵn dark mode.
- **Socket.IO Client**: Kết nối real-time mượt mà với Gateway.
- **React-Leaflet**: Nền tảng bản đồ tích hợp lớp Heatmap cho các vùng nguy hiểm.
- **Recharts**: Trực quan hóa dữ liệu bằng các biểu đồ thống kê chuyên nghiệp.

---

## ✅ Chức năng chính

| 🗂️ Trang | 🎯 Chức năng |
| :--- | :--- |
| **Dashboard** | Bảng tổng quan thống kê (Lượt nhận diện, SOS Alert, Users online). |
| **SOS Alerts** | Theo dõi trực tiếp các cảnh báo khẩn cấp real-time kèm tọa độ GPS và hình ảnh. |
| **Heatmap** | Bản đồ nhiệt tự động vẽ vùng thường xuyên có vật cản nguy hiểm. |
| **Feedback Management**| Review và đánh giá độ chính xác AI từ phản hồi của người dùng cuối. |
| **AI Model Management**| *(Beta)* Quản lý trạng thái AI Worker và triển khai các mô hình. |
| **Broadcast TTS** | Tính năng gửi thông báo khẩn cấp bằng giọng nói đến toàn bộ Mobile App. |
| **User Management** | Quản lý tài khoản, phân quyền hệ thống (RBAC) và theo dõi phiên đăng nhập. |

---

## 🔐 Hệ thống Phân quyền (RBAC)

Bảng điều khiển được bảo vệ bởi hệ thống phân quyền đa cấp, đảm bảo tính bảo mật và vận hành:

- 👑 **SUPER_ADMIN**: Toàn quyền hệ thống, quản lý cài đặt nâng cao và mô hình AI.
- 🛡️ **ADMIN**: Theo dõi vận hành, xử lý SOS, tiếp nhận feedback, quản lý broadcast và báo cáo.
- 👁️ **MODERATOR**: Quyền hạn giới hạn (chỉ đọc) cho các màn hình giám sát như Dashboard, SOS, Heatmap, Feedback.

---

## ⚙️ Hướng dẫn cài đặt & chạy

### 1️⃣ Cấu hình Biến môi trường

Tạo file `.env` tại thư mục gốc của `admin-dashboard/` theo mẫu sau:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 2️⃣ Khởi chạy dự án

```bash
cd admin-dashboard
npm install
npm run dev
```
> 🌐 Dashboard sẽ chạy tại địa chỉ: **`http://localhost:4200`**

---

## 🛠 Xử lý sự cố (Troubleshooting)

- 🔴 **Không thấy dữ liệu real-time**: Kiểm tra trạng thái hoạt động của Backend Gateway và kết nối WebSocket (F12 > Network).
- 🔴 **Lỗi Login**: Đảm bảo URL API trong `.env` chính xác và tài khoản có role `ADMIN` hoặc `SUPER_ADMIN`.
- 🔴 **Bản đồ Heatmap không hiển thị**: Cần có kết nối Internet để tải các lớp bản đồ (tiles) từ OpenStreetMap.

---

<div align="center">
<i>Dashboard được thiết kế với <b>Dark Mode</b> mặc định, tối ưu hóa cho việc giám sát liên tục mà không gây mỏi mắt.</i>
</div>

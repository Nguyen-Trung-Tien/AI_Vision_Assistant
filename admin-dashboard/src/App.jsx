import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Activity,
  Settings,
  ShieldAlert,
  MessageSquare,
  Radio,
  Map,
  Users,
  Database,
  LineChart,
} from "lucide-react";

import LoginV2 from "./pages/LoginV2";
import DashboardV2 from "./pages/DashboardV2";
import SosPage from "./pages/SosPage";
import FeedbackPage from "./pages/FeedbackPage";
import BroadcastPage from "./pages/BroadcastPage";
import HeatmapPage from "./pages/HeatmapPage";
import UsersPage from "./pages/UsersPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import SystemPage from "./pages/SystemPage";
import SettingsPage from "./pages/SettingsPage";
import ModelManagerPage from "./pages/ModelManagerPage";
import AnalyticsPage from "./pages/AnalyticsPage";

import {
  clearSession,
  getStoredEmail,
  getStoredRole,
  fetchNotifications as fetchNotificationsApi,
  markNotificationsReadAll,
  isAuthenticated,
} from "./services/api";
import { connectSocket, socket } from "./services/socket";
import { ToastProvider } from "./components/Toast";
import AdminShell from "./components/layout/AdminShell";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const menuItems = [
    {
      id: "dashboard",
      label: "Bảng Điều Khiển",
      icon: LayoutDashboard,
      group: "Tổng quan",
      roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
    },
    {
      id: "analytics",
      label: "Phân Tích Nâng Cao",
      icon: LineChart,
      group: "Tổng quan",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      id: "sos",
      label: "SOS Khẩn Cấp",
      icon: ShieldAlert,
      group: "An toàn",
      badge: notifications.filter((n) => n.type === "SOS" && !n.isRead).length,
      roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
    },
    { id: "heatmap", label: "Khu Vực Nguy Hiểm", icon: Map, group: "An toàn", roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
    { id: "broadcast", label: "Broadcast TTS", icon: Radio, group: "An toàn", roles: ["SUPER_ADMIN", "ADMIN"] },
    {
      id: "feedback",
      label: "Phản Hồi Người Dùng",
      icon: MessageSquare,
      group: "Giao tiếp",
      roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"],
    },
    { id: "users", label: "Quản Lý Tài Khoản", icon: Users, group: "Quản trị", roles: ["SUPER_ADMIN", "ADMIN"] },
    {
      id: "model-manager",
      label: "Quản Lý Mô Hình AI",
      icon: Database,
      group: "Hệ thống",
      roles: ["SUPER_ADMIN"],
    },
    {
      id: "activity",
      label: "Nhật Ký Hoạt Động",
      icon: Activity,
      group: "Hệ thống",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      id: "system",
      label: "Trạng Thái Hệ Thống",
      icon: Activity,
      group: "Hệ thống",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      id: "settings",
      label: "Cài Đặt Hệ Thống",
      icon: Settings,
      group: "Hệ thống",
      roles: ["SUPER_ADMIN"],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(role));

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const checkAuth = () => {
    if (isAuthenticated()) {
      setIsLoggedIn(true);
      setEmail(getStoredEmail());
      setRole(getStoredRole());
      connectSocket();
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await fetchNotificationsApi();
      if (Array.isArray(data)) setNotifications(data);
    } catch (err) {
      console.error("Fetch notif error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    await markNotificationsReadAll();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    clearSession();
    window.location.reload();
  };

  useEffect(() => {
    checkAuth();
    if (isLoggedIn) {
      fetchNotifications();

      socket.on("new_notification", (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
        try {
          new Audio("/notification-sound.mp3").play();
        } catch (e) {}
      });

      socket.on("sos_incoming", (sosData) => {
        const notif = {
          id: Date.now(),
          type: "SOS",
          title: "CẢNH BÁO SOS!",
          message: `Người dùng ${sosData.userId} vừa yêu cầu cứu hộ tại tọa độ ${sosData.latitude}, ${sosData.longitude}`,
          created_at: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((prev) => [notif, ...prev]);
      });

      return () => {
        socket.off("new_notification");
        socket.off("sos_incoming");
      };
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <ToastProvider>
        <LoginV2 onLoginSuccess={checkAuth} />
      </ToastProvider>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardV2 />;
      case "analytics": return <AnalyticsPage />;
      case "sos": return <SosPage />;
      case "heatmap": return <HeatmapPage />;
      case "broadcast": return <BroadcastPage />;
      case "feedback": return <FeedbackPage />;
      case "users": return <UsersPage />;
      case "model-manager": return <ModelManagerPage />;
      case "activity": return <ActivityLogPage />;
      case "system": return <SystemPage />;
      case "settings": return <SettingsPage />;
      default: return <DashboardV2 />;
    }
  };

  return (
    <ToastProvider>
      <AdminShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        email={email}
        notifications={notifications}
        handleMarkAllRead={handleMarkAllRead}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        menuItems={filteredMenuItems}
        handleLogout={handleLogout}
      >
        {renderContent()}
      </AdminShell>
    </ToastProvider>
  );
}

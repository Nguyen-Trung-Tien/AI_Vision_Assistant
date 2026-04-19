import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Bell,
  Activity,
  Settings,
  ShieldAlert,
  MessageSquare,
  Radio,
  Map,
  Users,
  Database,
  LineChart,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Search,
  Check,
  Clock,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  fetchNotifications as fetchNotificationsApi,
  markNotificationsReadAll,
  getStoredToken,
  isAuthenticated,
} from "./services/api";
import { connectSocket, socket, disconnectSocket } from "./services/socket";
import { ToastProvider, useToast } from "./components/Toast";
import { cn } from "@/lib/utils";

// --- Components ---

function AdminShell({
  children,
  activeTab,
  setActiveTab,
  email,
  notifications,
  setNotifications,
  isDarkMode,
  setIsDarkMode,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const toast = useToast();

  const menuItems = [
    {
      id: "dashboard",
      label: "Bảng Điều Khiển",
      icon: LayoutDashboard,
      group: "Tổng quan",
    },
    {
      id: "analytics",
      label: "Phân Tích Nâng Cao",
      icon: LineChart,
      group: "Tổng quan",
    },
    {
      id: "sos",
      label: "SOS Khẩn Cấp",
      icon: ShieldAlert,
      group: "An toàn",
      badge: notifications.filter((n) => n.type === "SOS" && !n.isRead).length,
    },
    { id: "heatmap", label: "Khu Vực Nguy Hiểm", icon: Map, group: "An toàn" },
    { id: "broadcast", label: "Broadcast TTS", icon: Radio, group: "An toàn" },
    {
      id: "feedback",
      label: "Phản Hồi Người Dùng",
      icon: MessageSquare,
      group: "Giao tiếp",
    },
    { id: "users", label: "Quản Lý Tài Khoản", icon: Users, group: "Quản trị" },
    {
      id: "model-manager",
      label: "Quản Lý Mô Hình AI",
      icon: Database,
      group: "Hệ thống",
    },
    {
      id: "activity",
      label: "Nhật Ký Hoạt Động",
      icon: Activity,
      group: "Hệ thống",
    },
    {
      id: "system",
      label: "Trạng Thái Hệ Thống",
      icon: Activity,
      group: "Hệ thống",
    },
    {
      id: "settings",
      label: "Cài Đặt Hệ Thống",
      icon: Settings,
      group: "Hệ thống",
    },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    clearSession();
    window.location.reload();
  };

  const handleMarkAllRead = async () => {
    await markNotificationsReadAll();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setNotifOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? "280px" : "80px",
          x: 0,
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-bg-card border-r border-border-primary flex flex-col transition-all duration-300 lg:static",
          !sidebarOpen && "lg:w-20",
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-border-primary overflow-hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col -space-y-1"
              >
                <span className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] uppercase">
                  AI VISION
                </span>
                <span className="text-base font-bold tracking-tighter">
                  ASSISTANT
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-none">
          {["Tổng quan", "An toàn", "Giao tiếp", "Quản trị", "Hệ thống"].map(
            (group) => {
              const items = menuItems.filter((i) => i.group === group);
              if (items.length === 0) return null;

              return (
                <div key={group} className="space-y-2">
                  {sidebarOpen && (
                    <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-50 mb-2">
                      {group}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "w-full flex items-center transition-all duration-200 group relative",
                          sidebarOpen
                            ? "gap-3 px-4 py-3 rounded-xl"
                            : "justify-center py-3.5 rounded-xl",
                          activeTab === item.id
                            ? "bg-indigo-500/10 text-indigo-500 font-bold shadow-sm border border-indigo-500/20"
                            : "text-text-secondary hover:bg-text-primary/5 hover:text-text-primary",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "transition-transform group-hover:scale-110",
                            sidebarOpen ? "w-5 h-5" : "w-6 h-6",
                            activeTab === item.id
                              ? "text-indigo-500"
                              : "text-text-secondary",
                          )}
                          strokeWidth={
                            activeTab === item.id ? 2.5 : sidebarOpen ? 2 : 2.2
                          }
                        />
                        {sidebarOpen && (
                          <span
                            className={cn(
                              "text-sm font-semibold tracking-tight truncate",
                              item.id === "sos" && item.badge > 0
                                ? "text-red-500 animate-pulse font-black"
                                : "text-text-primary/80",
                            )}
                          >
                            {item.label}
                          </span>
                        )}
                        {activeTab === item.id && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                          />
                        )}
                        {item.badge > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-border-primary">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold",
              !sidebarOpen && "justify-center",
            )}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Đăng xuất</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-bg-card/50 backdrop-blur-xl border-b border-border-primary px-8 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-text-primary/5 rounded-lg text-text-secondary transition-colors"
            >
              {sidebarOpen ? (
                <Menu className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            <h2 className="text-lg font-bold tracking-tight uppercase">
              {activeTab === "sos" ? (
                <>
                  <span className="text-text-primary">SOS</span>{" "}
                  <span className="text-red-600 animate-pulse">KHẨN CẤP</span>
                </>
              ) : (
                <span className="text-text-primary">
                  {menuItems.find((m) => m.id === activeTab)?.label}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 hover:bg-text-primary/5 rounded-xl text-text-secondary transition-all group"
              title={
                isDarkMode
                  ? "Chuyển sang Chế độ sáng"
                  : "Chuyển sang Chế độ tối"
              }
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2.5 hover:bg-text-primary/5 rounded-xl text-text-secondary transition-all group"
              >
                <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-card animate-bounce" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-96 bg-bg-card border border-border-primary rounded-3xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-6 border-b border-border-primary flex items-center justify-between">
                      <h3 className="font-black text-sm uppercase tracking-widest">
                        Thông báo
                      </h3>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter"
                      >
                        Đánh dấu đã đọc
                      </button>
                    </div>
                    <div className="max-h-[450px] overflow-y-auto py-2 scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center space-y-3">
                          <Bell className="w-8 h-8 text-text-secondary opacity-20 mx-auto" />
                          <p className="text-sm text-text-secondary font-medium">
                            Không có thông báo mới
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "px-6 py-4 flex gap-4 hover:bg-text-primary/5 transition-colors group cursor-pointer border-b border-border-primary last:border-0",
                              !n.isRead && "bg-indigo-500/5",
                            )}
                          >
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                n.type === "SOS"
                                  ? "bg-red-500/20 text-red-500"
                                  : "bg-indigo-500/20 text-indigo-500",
                              )}
                            >
                              {n.type === "SOS" ? (
                                <ShieldAlert className="w-5 h-5" />
                              ) : (
                                <Bell className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={cn(
                                    "text-sm truncate",
                                    !n.isRead
                                      ? "font-black"
                                      : "font-medium text-text-secondary",
                                  )}
                                >
                                  {n.title}
                                </p>
                                <span className="text-[10px] text-text-secondary font-medium shrink-0 italic opacity-50">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {new Date(n.created_at).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed opacity-70">
                                {n.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-4 bg-white/2 border-t border-border-primary text-center">
                      <button className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
                        Xem tất cả <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-border-primary">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black truncate max-w-[150px] uppercase tracking-tighter">
                  {email?.split("@")[0]}
                </p>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                  Administrator
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-border-primary flex items-center justify-center shadow-inner group cursor-pointer hover:border-indigo-500 transition-all">
                <User className="w-5 h-5 text-text-secondary group-hover:text-indigo-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(10px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [email, setEmail] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

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

  useEffect(() => {
    checkAuth();
    if (isLoggedIn) {
      fetchNotifications();

      // Listen for real-time notifications
      socket.on("new_notification", (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);

        // Play sound
        try {
          const audio = new Audio("/notification-sound.mp3");
          audio.play();
        } catch (e) {}
      });

      socket.on("sos_incoming", (sosData) => {
        // Handle special SOS notifications
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
      case "dashboard":
        return <DashboardV2 />;
      case "analytics":
        return <AnalyticsPage />;
      case "sos":
        return <SosPage />;
      case "heatmap":
        return <HeatmapPage />;
      case "broadcast":
        return <BroadcastPage />;
      case "feedback":
        return <FeedbackPage />;
      case "users":
        return <UsersPage />;
      case "model-manager":
        return <ModelManagerPage />;
      case "activity":
        return <ActivityLogPage />;
      case "system":
        return <SystemPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardV2 />;
    }
  };

  return (
    <ToastProvider>
      <AdminShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        email={email}
        notifications={notifications}
        setNotifications={setNotifications}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      >
        {renderContent()}
      </AdminShell>
    </ToastProvider>
  );
}

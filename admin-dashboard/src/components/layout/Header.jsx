import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Menu,
  Sun,
  Moon,
  Clock,
  ExternalLink,
  User,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "../../providers/AuthProvider";
import { useNotificationContext } from "../../providers/NotificationProvider";
import { useTheme } from "../../providers/ThemeProvider";

const PAGE_TITLES = {
  dashboard: "Bảng Điều Khiển",
  analytics: "Phân Tích Nâng Cao",
  sos: null, // Custom rendering
  heatmap: "Khu Vực Nguy Hiểm",
  broadcast: "Broadcast TTS",
  feedback: "Phản Hồi Người Dùng",
  users: "Quản Lý Tài Khoản",
  "model-manager": "Quản Lý Mô Hình AI",
  activity: "Nhật Ký Hoạt Động",
  notifications: "Thông Báo Hệ Thống",
  system: "Trạng Thái Hệ Thống",
  settings: "Cài Đặt Hệ Thống",
};

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { email } = useAuth();
  const { notifications, unreadCount, handleMarkAllRead } = useNotificationContext();
  const { isDarkMode, setIsDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const activeTab = location.pathname.replace("/", "") || "dashboard";

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
    <header className="h-16 bg-bg-card/50 backdrop-blur-xl border-b border-border-primary px-10 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 hover:bg-text-primary/5 rounded-lg text-text-secondary transition-colors"
        >
          {sidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <h2 className="text-lg font-bold tracking-tight uppercase">
          {activeTab === "sos" ? (
            <>
              <span className="text-text-primary">SOS</span>{" "}
              <span className="text-red-600 animate-pulse">KHẨN CẤP</span>
            </>
          ) : (
            <span className="text-text-primary">
              {PAGE_TITLES[activeTab] || "Dashboard"}
            </span>
          )}
        </h2>
      </div>

      <div className="flex items-center gap-5">
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 hover:bg-text-primary/5 rounded-xl text-text-secondary transition-all group"
          title={isDarkMode ? "Chuyển sang Chế độ sáng" : "Chuyển sang Chế độ tối"}
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
                    onClick={() => {
                      handleMarkAllRead();
                      setNotifOpen(false);
                    }}
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
                          !n.isRead && "bg-indigo-500/5"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            n.type === "SOS"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-indigo-500/20 text-indigo-500"
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
                                !n.isRead ? "font-black" : "font-medium text-text-secondary"
                              )}
                            >
                              {n.title}
                            </p>
                            <span className="text-[10px] text-text-secondary font-medium shrink-0 italic opacity-50">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
                  <button
                    onClick={() => {
                      navigate("/notifications");
                      setNotifOpen(false);
                    }}
                    className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    Xem tất cả <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-5 border-l border-border-primary">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black truncate max-w-[150px] uppercase tracking-tighter">
              {email?.split("@")[0]}
            </p>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
              Administrator
            </p>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-text-primary/5 border border-border-primary flex items-center justify-center shadow-inner group cursor-pointer hover:border-indigo-500 transition-all">
            <User className="w-4 h-4 text-text-secondary group-hover:text-indigo-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

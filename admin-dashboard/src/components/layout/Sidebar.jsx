import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
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
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../providers/AuthProvider";
import { useNotificationContext } from "../../providers/NotificationProvider";

const menuItems = [
  { id: "dashboard", label: "Bảng Điều Khiển", icon: LayoutDashboard, group: "Tổng quan", roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
  { id: "analytics", label: "Phân Tích Nâng Cao", icon: LineChart, group: "Tổng quan", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "sos", label: "SOS Khẩn Cấp", icon: ShieldAlert, group: "An toàn", roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"], badgeType: "SOS" },
  { id: "heatmap", label: "Khu Vực Nguy Hiểm", icon: Map, group: "An toàn", roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
  { id: "broadcast", label: "Broadcast TTS", icon: Radio, group: "An toàn", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "feedback", label: "Phản Hồi Người Dùng", icon: MessageSquare, group: "Giao tiếp", roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
  { id: "users", label: "Quản Lý Tài Khoản", icon: Users, group: "Quản trị", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "model-manager", label: "Quản Lý Mô Hình AI", icon: Database, group: "Hệ thống", roles: ["SUPER_ADMIN"] },
  { id: "activity", label: "Nhật Ký Hoạt Động", icon: Activity, group: "Hệ thống", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "notifications", label: "Thông Báo Hệ Thống", icon: Bell, group: "Hệ thống", badgeType: "unread", roles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
  { id: "system", label: "Trạng Thái Hệ Thống", icon: Activity, group: "Hệ thống", roles: ["SUPER_ADMIN", "ADMIN"] },
  { id: "settings", label: "Cài Đặt Hệ Thống", icon: Settings, group: "Hệ thống", roles: ["SUPER_ADMIN"] },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { role, logout } = useAuth();
  const { notifications, unreadCount } = useNotificationContext();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.replace("/", "") || "dashboard";

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(role));

  const getBadge = (item) => {
    if (item.badgeType === "SOS") return notifications.filter((n) => n.type === "SOS" && !n.isRead).length;
    if (item.badgeType === "unread") return unreadCount;
    return 0;
  };

  return (
    <>
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

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? "260px" : "80px" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-bg-card border-r border-border-primary flex flex-col lg:static"
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-border-primary overflow-hidden shrink-0">
          <div className={cn("flex items-center gap-3 w-full", !sidebarOpen && "justify-center px-0")}>
            <div className="w-10 h-10 rounded-xl bg-bg-primary border border-border-primary flex items-center justify-center shadow-lg overflow-hidden shrink-0 group">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain group-hover:scale-110 transition-transform duration-500" />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col -space-y-1 min-w-0"
              >
                <span className="text-[10px] font-black text-indigo-500 tracking-[0.2em] uppercase truncate">VISION</span>
                <span className="text-sm font-black tracking-tighter truncate">ASSISTANT</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
          {["Tổng quan", "An toàn", "Giao tiếp", "Quản trị", "Hệ thống"].map((group) => {
            const items = filteredMenuItems.filter((i) => i.group === group);
            if (items.length === 0) return null;

            return (
              <div key={group} className="space-y-0.5">
                {sidebarOpen ? (
                  <h3 className="px-3 text-[11px] font-black uppercase tracking-[0.25em] text-text-secondary opacity-60 mb-2 mt-4 first:mt-0">
                    {group}
                  </h3>
                ) : (
                  <div className="mx-2 border-t border-border-primary/10 my-2 first:hidden" />
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const badge = getBadge(item);
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/${item.id}`)}
                        title={!sidebarOpen ? item.label : ""}
                        className={cn(
                          "w-full flex items-center transition-all duration-200 group relative",
                          sidebarOpen ? "gap-2.5 px-3 py-1.5 rounded-xl" : "justify-center py-2 rounded-xl",
                          isActive
                            ? "bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20"
                            : "text-text-secondary hover:bg-text-primary/5 hover:text-text-primary"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "transition-all duration-300",
                            sidebarOpen ? "w-5 h-5" : "w-6 h-6",
                            isActive
                              ? "text-indigo-500 scale-110"
                              : "text-text-secondary opacity-70 group-hover:opacity-100 group-hover:scale-110"
                          )}
                          strokeWidth={isActive ? 2.5 : sidebarOpen ? 2 : 2.2}
                        />
                        {sidebarOpen && (
                          <span
                            className={cn(
                              "text-[14px] font-bold tracking-tight truncate",
                              item.id === "sos" && badge > 0
                                ? "text-red-500 animate-pulse font-black"
                                : "text-text-primary/90"
                            )}
                          >
                            {item.label}
                          </span>
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                          />
                        )}
                        {badge > 0 && (
                          <span
                            className={cn(
                              "absolute rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40",
                              sidebarOpen ? "right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5" : "right-1 top-1 w-4 h-4"
                            )}
                          >
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-border-primary">
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-bold",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Đăng xuất</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

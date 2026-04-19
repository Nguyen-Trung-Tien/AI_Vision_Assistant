import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, LogOut, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  menuItems,
  handleLogout,
}) {
  return (
    <>
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

      {/* Sidebar Content */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? "260px" : "72px",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-bg-card border-r border-border-primary flex flex-col lg:static"
        )}
      >
        {/* Logo Section */}
        <div className="h-14 flex items-center px-4 border-b border-border-primary overflow-hidden shrink-0">
          <div className={cn(
            "flex items-center gap-3 w-full",
            !sidebarOpen && "justify-center px-0"
          )}>
            <div className="w-9 h-9 rounded-lg bg-bg-primary border border-border-primary flex items-center justify-center shadow-lg overflow-hidden shrink-0 group">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-6.5 h-6.5 object-contain group-hover:scale-110 transition-transform duration-500" 
              />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col -space-y-1 min-w-0"
              >
                <span className="text-[9px] font-black text-indigo-500 tracking-[0.2em] uppercase truncate">
                  VISION
                </span>
                <span className="text-xs font-black tracking-tighter truncate">
                  ASSISTANT
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
          {["Tổng quan", "An toàn", "Giao tiếp", "Quản trị", "Hệ thống"].map(
            (group) => {
              const items = menuItems.filter((i) => i.group === group);
              if (items.length === 0) return null;

              return (
                <div key={group} className="space-y-0.5">
                  {sidebarOpen ? (
                    <h3 className="px-3 text-[9px] font-black uppercase tracking-[0.25em] text-text-secondary opacity-60 mb-1">
                      {group}
                    </h3>
                  ) : (
                    <div className="mx-2 border-t border-border-primary/10 my-2 first:hidden" />
                  )}
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={!sidebarOpen ? item.label : ""}
                        className={cn(
                          "w-full flex items-center transition-all duration-200 group relative",
                          sidebarOpen
                            ? "gap-3 px-3 py-2 rounded-xl"
                            : "justify-center py-2.5 rounded-xl",
                          activeTab === item.id
                            ? "bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20"
                            : "text-text-secondary hover:bg-text-primary/5 hover:text-text-primary"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "transition-all duration-300",
                            sidebarOpen ? "w-5 h-5" : "w-6 h-6",
                            activeTab === item.id
                              ? "text-indigo-500 scale-110"
                              : "text-text-secondary opacity-70 group-hover:opacity-100 group-hover:scale-110"
                          )}
                          strokeWidth={
                            activeTab === item.id ? 2.5 : sidebarOpen ? 2 : 2.2
                          }
                        />
                        {sidebarOpen && (
                          <span
                            className={cn(
                              "text-[13px] font-bold tracking-tight truncate",
                              item.id === "sos" && item.badge > 0
                                ? "text-red-500 animate-pulse font-black"
                                : "text-text-primary/80"
                            )}
                          >
                            {item.label}
                          </span>
                        )}
                        {activeTab === item.id && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                          />
                        )}
                        {item.badge > 0 && (
                          <span className={cn(
                            "absolute rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center animate-pulse shadow-lg shadow-red-500/40",
                            sidebarOpen ? "right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5" : "right-1 top-1 w-4 h-4"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-border-primary">
          <button
            onClick={handleLogout}
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

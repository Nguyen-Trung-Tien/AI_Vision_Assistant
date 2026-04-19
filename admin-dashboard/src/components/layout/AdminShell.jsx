import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminShell({
  children,
  activeTab,
  setActiveTab,
  email,
  notifications,
  handleMarkAllRead,
  isDarkMode,
  setIsDarkMode,
  menuItems,
  handleLogout,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
        handleLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          menuItems={menuItems}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          notifications={notifications}
          unreadCount={unreadCount}
          handleMarkAllRead={handleMarkAllRead}
          email={email}
        />

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

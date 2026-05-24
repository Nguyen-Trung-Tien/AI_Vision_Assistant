import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import LoginV2 from "../../pages/LoginV2";
import { useAuth } from "../../providers/AuthProvider";
import { useToast } from "../Toast";
import SessionExpiredModal from "./SessionExpiredModal";

function AuthenticatedContent() {
  const { isLoggedIn, login, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    if (!isLoggedIn) return;

    const handleSessionExpired = () => {
      setSessionExpired(true);
      if (toast?.error) {
        toast.error("Phiên đăng nhập đã hết hạn!");
      }
    };

    const handleTokenRefreshed = () => {
      if (toast?.success) {
        toast.success("Tự động làm mới phiên đăng nhập thành công!");
      }
    };

    window.addEventListener("session_expired", handleSessionExpired);
    window.addEventListener("token_refreshed", handleTokenRefreshed);

    return () => {
      window.removeEventListener("session_expired", handleSessionExpired);
      window.removeEventListener("token_refreshed", handleTokenRefreshed);
    };
  }, [isLoggedIn, toast]);

  if (!isLoggedIn) {
    return <LoginV2 onLoginSuccess={login} />;
  }

  const handleConfirmExpired = () => {
    setSessionExpired(false);
    logout();
  };

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(10px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <SessionExpiredModal isOpen={sessionExpired} onConfirm={handleConfirmExpired} />
    </div>
  );
}

export default function AuthenticatedLayout() {
  return <AuthenticatedContent />;
}

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import LoginV2 from "../../pages/LoginV2";
import { useAuth } from "../../providers/AuthProvider";
import { ToastProvider } from "../Toast";

export default function AuthenticatedLayout() {
  const { isLoggedIn, login } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <ToastProvider>
        <LoginV2 onLoginSuccess={login} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
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
      </div>
    </ToastProvider>
  );
}

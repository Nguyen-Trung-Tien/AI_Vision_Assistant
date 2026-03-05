import { useState } from "react";
import LoginV2 from "./pages/LoginV2";
import DashboardV2 from "./pages/DashboardV2";
import SosPage from "./pages/SosPage";
import FeedbackPage from "./pages/FeedbackPage";
import BroadcastPage from "./pages/BroadcastPage";
import HeatmapPage from "./pages/HeatmapPage";
import UsersPage from "./pages/UsersPage";
import { clearSession, getStoredToken, getStoredEmail } from "./services/api";
import { ToastProvider } from "./components/Toast";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  dashboard: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  sos: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  heatmap: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    </svg>
  ),
  feedback: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  broadcast: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
      />
    </svg>
  ),
  users: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  logout: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
  menu: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { id: "sos", label: "SOS Khẩn Cấp", icon: Icons.sos },
  { id: "heatmap", label: "Heatmap", icon: Icons.heatmap },
  { id: "feedback", label: "Feedback AI", icon: Icons.feedback },
  { id: "broadcast", label: "Broadcast", icon: Icons.broadcast },
  { id: "users", label: "Người dùng", icon: Icons.users },
];

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden ${
        active
          ? "text-white"
          : "text-white/45 hover:text-white/80 hover:bg-white/5"
      }`}
    >
      {/* Active glow background */}
      {active && (
        <span className="absolute inset-0 bg-linear-to-r from-purple-600/25 to-indigo-600/15 border border-purple-500/25 rounded-xl" />
      )}
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-linear-to-b from-purple-400 to-indigo-400 rounded-full" />
      )}
      <span
        className={`relative z-10 shrink-0 transition-colors duration-200 ${active ? "text-purple-300" : "group-hover:text-white/60"}`}
      >
        {item.icon}
      </span>
      <span className="relative z-10">{item.label}</span>
    </button>
  );
}

// ── AdminShell ────────────────────────────────────────────────────────────────
function AdminShell({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const email = getStoredEmail();

  const renderPage = () => {
    switch (page) {
      case "sos":
        return <SosPage />;
      case "heatmap":
        return <HeatmapPage />;
      case "feedback":
        return <FeedbackPage />;
      case "broadcast":
        return <BroadcastPage />;
      case "users":
        return <UsersPage />;
      default:
        return <DashboardV2 onLogout={onLogout} />;
    }
  };

  const currentLabel =
    NAV_ITEMS.find((n) => n.id === page)?.label ?? "Dashboard";

  return (
    <div className="h-screen flex overflow-hidden bg-bg-primary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-screen z-40 w-64 flex flex-col transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, #111128 0%, #0e0e24 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/6">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              Vision Admin
            </p>
            <p className="text-white/30 text-xs">Hệ thống quản lý</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-white/20 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            Điều hướng
          </p>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={page === item.id}
              onClick={() => {
                setPage(item.id);
                setSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        {/* User / logout section */}
        <div className="px-3 py-4 border-t border-white/6 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(email?.[0] ?? "A").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">
                {email || "Admin"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                <span className="text-white/30 text-[10px]">Online</span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/8 text-sm font-medium transition-all duration-200"
          >
            {Icons.logout}
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header
          className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-white/6"
          style={{ background: "#111128" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            {Icons.menu}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">
              {currentLabel}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(() => getStoredToken());

  if (!token) {
    return (
      <ToastProvider>
        <LoginV2 onLoginSuccess={() => setToken(getStoredToken())} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AdminShell
        onLogout={() => {
          clearSession();
          setToken("");
        }}
      />
    </ToastProvider>
  );
}

import { useState } from "react";
import DashboardV2 from "./pages/DashboardV2";
import LoginV2 from "./pages/LoginV2";
import { clearSession, getStoredToken } from "./services/api";

export default function App() {
  const [token, setToken] = useState(() => getStoredToken());

  if (!token) {
    return <LoginV2 onLoginSuccess={() => setToken(getStoredToken())} />;
  }

  return <DashboardV2 onLogout={() => {
    clearSession();
    setToken("");
  }} />;
}

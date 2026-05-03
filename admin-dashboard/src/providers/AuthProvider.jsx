import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  clearSession,
  getStoredEmail,
  getStoredRole,
  isAuthenticated as checkAuth,
} from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => checkAuth());
  const [email, setEmail] = useState(() => getStoredEmail());
  const [role, setRole] = useState(() => getStoredRole());

  const login = useCallback(() => {
    setIsLoggedIn(true);
    setEmail(getStoredEmail());
    setRole(getStoredRole());
    connectSocket();
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    clearSession();
    setIsLoggedIn(false);
    setEmail("");
    setRole("USER");
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      connectSocket();
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, email, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

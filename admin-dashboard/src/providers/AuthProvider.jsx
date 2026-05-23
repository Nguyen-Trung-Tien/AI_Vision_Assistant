import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  clearSession,
  getStoredEmail,
  getStoredRole,
  isAuthenticated as checkAuth,
  getStoredName,
  getStoredPhone,
  setSession
} from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => checkAuth());
  const [email, setEmail] = useState(() => getStoredEmail());
  const [role, setRole] = useState(() => getStoredRole());
  const [name, setName] = useState(() => getStoredName());
  const [phone, setPhone] = useState(() => getStoredPhone());

  const login = useCallback(() => {
    setIsLoggedIn(true);
    setEmail(getStoredEmail());
    setRole(getStoredRole());
    setName(getStoredName());
    setPhone(getStoredPhone());
    connectSocket();
  }, []);

  const logout = useCallback(() => {
    disconnectSocket();
    clearSession();
    setIsLoggedIn(false);
    setEmail("");
    setRole("USER");
    setName("");
    setPhone("");
  }, []);

  const updateProfileContext = useCallback((newName, newPhone) => {
    setName(newName);
    setPhone(newPhone);
    setSession(email, role, newName, newPhone);
  }, [email, role]);

  useEffect(() => {
    if (isLoggedIn) {
      connectSocket();
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, email, role, name, phone, login, logout, updateProfileContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

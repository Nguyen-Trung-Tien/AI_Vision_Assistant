import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { socket } from "../services/socket";
import {
  fetchNotifications as fetchNotificationsApi,
  markNotificationsReadAll,
} from "../services/api";
import { useAuth } from "./AuthProvider";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await fetchNotificationsApi();
      if (Array.isArray(data)) setNotifications(data);
    } catch {
      // Silent fail — notifications are non-critical
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await markNotificationsReadAll();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!isLoggedIn) return;

    fetchNotifications();

    const onNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      try {
        new Audio("/notification-sound.mp3").play();
      } catch {
        // Sound playback is best-effort
      }
    };

    const onSosIncoming = (sosData) => {
      const notif = {
        id: Date.now(),
        type: "SOS",
        title: "CẢNH BÁO SOS!",
        message: `Người dùng ${sosData.userId} vừa yêu cầu cứu hộ tại tọa độ ${sosData.latitude}, ${sosData.longitude}`,
        created_at: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on("new_notification", onNewNotification);
    socket.on("sos_incoming", onSosIncoming);

    return () => {
      socket.off("new_notification", onNewNotification);
      socket.off("sos_incoming", onSosIncoming);
    };
  }, [isLoggedIn, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        handleMarkAllRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotificationContext must be used within NotificationProvider",
    );
  return ctx;
}

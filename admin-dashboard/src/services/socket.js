import { io } from "socket.io-client";
import { getApiUrl, getStoredToken } from "./api";

const SOCKET_URL = getApiUrl().replace("/api", "");

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

socket.on("connect", () => {
  socket.emit("join_admin");
});



socket.on("connect_error", (err) => {
  if (err.message?.includes("jwt expired") || err.message?.includes("401")) {
    socket.disconnect();
  }
});

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

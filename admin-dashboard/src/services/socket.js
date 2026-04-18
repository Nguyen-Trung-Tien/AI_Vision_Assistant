import { io } from "socket.io-client";
import { getApiUrl, getStoredToken } from "./api";

const SOCKET_URL = getApiUrl().replace("/api", "");

export const socket = io(SOCKET_URL, {
  auth: {
    token: getStoredToken(),
  },
  autoConnect: false,
  withCredentials: true,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.auth.token = getStoredToken();
    socket.connect();
  }
};

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
  socket.emit("join_admin");
});

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};


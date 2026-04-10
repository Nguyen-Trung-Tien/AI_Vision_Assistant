import { io } from "socket.io-client";
import { env } from "@/lib/env";

/**
 * Global Socket instance for real-time updates
 */
export const socket = io(env.wsUrl, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

/**
 * Helper to connect socket with basic event logging
 */
export const connectSocket = () => {
  if (socket.connected) return;

  socket.connect();

  socket.on("connect", () => {
    console.log(`[Socket] Connected to ${env.wsUrl} (ID: ${socket.id})`);
  });

  socket.on("disconnect", (reason) => {
    console.warn(`[Socket] Disconnected: ${reason}`);
  });

  socket.on("connect_error", (error) => {
    console.error(`[Socket] Connection error: ${error.message}`);
  });
};

/**
 * Helper to disconnect socket
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("[Socket] Manually disconnected");
  }
};

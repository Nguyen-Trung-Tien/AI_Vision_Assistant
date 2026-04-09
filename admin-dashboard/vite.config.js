import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  const port = parseInt(env.VITE_PORT || "4200", 10);
  const backendUrl = env.VITE_BACKEND_URL || "http://127.0.0.1:3000";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-recharts": ["recharts"],
          },
        },
      },
    },
    server: {
      host: "127.0.0.1",
      port,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
        "/socket.io": {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});

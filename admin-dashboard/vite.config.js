import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  const port = parseInt(env.VITE_PORT || "4200", 10);
  const backendUrl = env.VITE_BACKEND_URL || "http://127.0.0.1:3000";

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: "Vision Assistant Admin",
          short_name: "Vision Admin",
          description: "Quản trị hệ thống hỗ trợ thị giác AI",
          theme_color: "#0ea5e9",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
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

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Tăng giới hạn chunk size warning (recharts khá lớn)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách vendor libs ra bundle riêng để giảm chunk size
          "vendor-react": ["react", "react-dom"],
          "vendor-recharts": ["recharts"],
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 4200,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});

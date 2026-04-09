import React from "react";
import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { env } from "@/lib/env";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data cũ sau khoảng thời gian này → refetch khi focus lại
      staleTime: env.queryStaleTime,
      // Giữ cache trong memory bao lâu sau khi unmount
      gcTime: env.queryCacheTime,
      // Retry 2 lần khi fetch fail, delay tăng dần
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      // Refetch khi user quay lại tab
      refetchOnWindowFocus: true,
      // Không refetch khi reconnect (tránh spam)
      refetchOnReconnect: "always",
    },
    mutations: {
      // Mutation không retry mặc định (tránh duplicate actions)
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {env.enableDevtools && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  </React.StrictMode>,
);

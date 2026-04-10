import axios from "axios";
import { env } from "@/lib/env";
import { clearSession } from "@/services/api";

/**
 * Global Axios Instance
 * Configured with baseURL from environment
 */
const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  withCredentials: true, // Crucial for httpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor: Centralized Error Handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || "Something went wrong";
    const status = error.response?.status;

    // Handle 401 Unauthorized - clear session and potentially redirect
    if (status === 401) {
      console.warn("Unauthorized - Clearing session...");
      clearSession();
      // Optional: window.location.href = "/login";
    }

    const apiError = new Error(message);
    apiError.status = status;
    apiError.data = error.response?.data;

    console.error(`[API Error] ${status || "Network"}: ${message}`);
    return Promise.reject(apiError);
  }
);

export default apiClient;

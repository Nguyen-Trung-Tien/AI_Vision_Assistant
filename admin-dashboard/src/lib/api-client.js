import axios from "axios";
import { env } from "@/lib/env";
import { clearSessionLocal } from "@/lib/auth-storage";

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

// Request Interceptor (Kept empty or removed, but we can just return config)
apiClient.interceptors.request.use((config) => {
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Centralized Error Handling
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Ignore refresh endpoint itself to prevent loops
    if (originalRequest.url === "/auth/refresh") {
      return Promise.reject(error);
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    const status = error.response?.status;

    // Handle 401 Unauthorized - Try to refresh token
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using the existing httpOnly cookie
        await axios.post(
          `${env.apiBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        processQueue(null);
        
        // Notify UI that token was successfully refreshed
        window.dispatchEvent(new CustomEvent("token_refreshed"));

        return apiClient(originalRequest);
      } catch (_error) {
        processQueue(_error, null);
        console.warn("Unauthorized - Clearing session...");
        clearSessionLocal();
        // Notify UI to show the session expired modal
        window.dispatchEvent(new CustomEvent("session_expired"));
        return Promise.reject(_error);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError = new Error(message);
    apiError.status = status;
    apiError.data = error.response?.data;

    console.error(`[API Error] ${status || "Network"}: ${message}`);
    return Promise.reject(apiError);
  },
);

export default apiClient;

import axios from "axios";
import { env } from "@/lib/env";

/**
 * Global Axios Instance
 * Configured with baseURL from environment
 */
const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Add Auth Token if needed
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Something went wrong";
    
    // Example: Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error("Unauthorized - Redirecting to login...");
      // window.location.href = '/login';
    }

    console.error(`[API Error]: ${message}`);
    return Promise.reject(error);
  }
);

export default apiClient;

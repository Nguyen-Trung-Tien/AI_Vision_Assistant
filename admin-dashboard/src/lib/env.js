/**
 * Centralized environment configuration
 * All env vars accessed through this module for type-safety and defaults.
 */

export const env = {
  // API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  backendUrl: import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3000",
  wsUrl: import.meta.env.VITE_WS_URL || "http://127.0.0.1:3000",

  // App
  appTitle:
    import.meta.env.VITE_APP_TITLE || "AI Vision Assistant — Admin Dashboard",
  appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
  port: Number(import.meta.env.VITE_PORT) || 4200,

  // React Query
  queryStaleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME) || 30_000,
  queryCacheTime: Number(import.meta.env.VITE_QUERY_CACHE_TIME) || 300_000,

  // Feature flags
  enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === "true",
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === "true",

  // Derived
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

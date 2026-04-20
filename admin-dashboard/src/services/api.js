import apiClient from "@/lib/api-client";
import { 
  setSession as setSessionLocal, 
  clearSessionLocal, 
  getStoredEmail as getStoredEmailLocal,
  getStoredRole as getStoredRoleLocal,
  getStoredToken as getStoredTokenLocal,
  isAuthenticated as isAuthenticatedLocal
} from "@/lib/auth-storage";

export function getApiUrl() {
  return import.meta.env.VITE_API_URL || "http://localhost:3000/api";
}

export function getFileUrl(path) {
  if (!path) return null;
  const baseUrl = getApiUrl().replace("/api", "");
  return `${baseUrl}${path}`;
}

export function isAuthenticated() {
  return isAuthenticatedLocal();
}

export function getStoredToken() {
  return getStoredTokenLocal();
}

/**
 * Auth operations
 */
export function clearSession() {
  clearSessionLocal();
  localStorage.removeItem("is_authenticated");
  localStorage.removeItem("access_token");
  // Post logout to clear httpOnly cookies on the backend
  return apiClient.post("/auth/logout").catch(() => {});
}

export function getStoredEmail() {
  return getStoredEmailLocal();
}

export function getStoredRole() {
  return getStoredRoleLocal();
}

export function setSession(email, token, role) {
  setSessionLocal(email, token, role);
}

export async function loginAdmin(email, password) {
  const payload = await apiClient.post("/auth/admin/login", {
    email,
    password,
  });

  setSession(payload?.user?.email || email, payload.access_token, payload?.user?.role);
  return payload;
}

export async function registerAdmin(email, password) {
  const payload = await apiClient.post("/auth/register", { email, password });
  setSession(payload?.user?.email || email, payload.access_token, payload?.user?.role);
  return payload;
}

/**
 * Statistics & Overview
 */
export async function fetchOverview() {
  return apiClient.get("/stats/overview").catch(() => ({
    totalUsers: 0,
    totalDetections: 0,
    avgConfidence: 0,
  }));
}

export async function fetchByType() {
  return apiClient.get("/stats/by-type").catch(() => []);
}

export async function fetchByDay(days = 30) {
  return apiClient.get(`/stats/by-day?days=${days}`).catch(() => []);
}

export async function fetchLogs(page = 1, limit = 20) {
  return apiClient.get(`/stats/logs?page=${page}&limit=${limit}`).catch(() => ({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
  }));
}

/**
 * SOS Alerts
 */
export async function fetchSosAlerts(page = 1, limit = 20) {
  return apiClient.get(`/sos?page=${page}&limit=${limit}`).catch(() => ({
    data: [],
    total: 0,
  }));
}

export async function resolveSos(id, note = "") {
  return apiClient.patch(`/sos/${id}/resolve`, { note });
}

export async function acknowledgeSos(id) {
  return apiClient.patch(`/sos/${id}/acknowledge`);
}

/**
 * Feedback Management
 */
export async function fetchFeedback(page = 1, limit = 20, onlyWrong = false) {
  return apiClient
    .get(`/feedback?page=${page}&limit=${limit}&onlyWrong=${onlyWrong}`)
    .catch(() => ({ data: [], total: 0 }));
}

export async function fetchFeedbackStats() {
  return apiClient.get("/feedback/stats").catch(() => ({
    total: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
  }));
}

export async function reviewFeedback(id, correctLabel) {
  return apiClient.patch(`/feedback/${id}/review`, { correctLabel });
}

export async function suggestFeedbackLabel(id) {
  return apiClient.get(`/feedback/${id}/suggest`);
}

export async function deleteFeedback(id) {
  return apiClient.post(`/feedback/${id}/delete`);
}

export async function deleteFeedbackBulk(ids) {
  return apiClient.post("/feedback/bulk-delete", { ids });
}

export async function deleteAllFeedback(onlyWrong = false) {
  return apiClient.post(`/feedback/clear-all?onlyWrong=${onlyWrong}`);
}

export async function exportFeedbackDataset() {
  // Use axios for blob handling
  return apiClient.get("/feedback/export", { responseType: "blob" });
}

/**
 * Broadcast & Notifications
 */
export async function fetchBroadcasts(page = 1, limit = 20) {
  return apiClient
    .get(`/broadcast?page=${page}&limit=${limit}`)
    .catch(() => ({ data: [], total: 0 }));
}

export async function sendBroadcast(
  message,
  targetType = "all",
  targetIds = [],
  priority = "normal",
) {
  return apiClient.post("/broadcast", {
    message,
    targetType,
    targetIds,
    priority,
  });
}

export async function deleteBroadcast(id) {
  return apiClient.delete(`/broadcast/${id}`);
}

export async function bulkDeleteBroadcasts(ids) {
  return apiClient.post("/broadcast/bulk-delete", { ids });
}

/**
 * Heatmap Data
 */
export async function fetchHeatmap(type = "danger", days = 30) {
  return apiClient
    .get(`/detections/heatmap?type=${type}&days=${days}`)
    .catch(() => []);
}

/**
 * User Management
 */
export async function fetchUsers(page = 1, limit = 20, search = "") {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search) query.append("search", search);

  return apiClient.get(`/users?${query.toString()}`).catch(() => ({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
  }));
}

export async function toggleUserRole(id) {
  return apiClient.patch(`/users/${id}/toggle-role`);
}

export async function createUser(email, password, role = "USER") {
  return apiClient.post("/users", { email, password, role });
}

export async function updateUser(id, data) {
  return apiClient.patch(`/users/${id}`, data);
}

export async function deleteUser(id) {
  return apiClient.delete(`/users/${id}`);
}

export async function lockUser(id) {
  return apiClient.patch(`/users/${id}/lock`);
}

export async function unlockUser(id) {
  return apiClient.patch(`/users/${id}/unlock`);
}

export async function fetchUserEmergencyContacts(userId) {
  return apiClient
    .get(`/emergency-contacts/admin/user/${userId}`)
    .catch(() => []);
}

/**
 * AI & Analytics
 */
export async function fetchAiModels() {
  return apiClient.get("/ai/models").catch(() => []);
}

export async function switchAiModel(modelId) {
  return apiClient.patch("/ai/switch", { modelId });
}

export async function fetchAccuracyTrend(days = 7) {
  return apiClient.get(`/ai/analytics/accuracy?days=${days}`).catch(() => []);
}

export async function fetchPeakHours() {
  return apiClient.get("/ai/analytics/peak-hours").catch(() => []);
}

export async function fetchAiLogs(page = 1, limit = 10, filters = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.actionType) query.append("actionType", filters.actionType);
  if (filters.modelVersion) query.append("modelVersion", filters.modelVersion);
  
  return apiClient.get(`/ai/logs?${query.toString()}`).catch(() => ({
    items: [],
    total: 0,
  }));
}

/**
 * Notifications
 */
export async function fetchNotifications() {
  return apiClient.get("/notification").catch(() => []);
}

export async function markNotificationsReadAll() {
  return apiClient.patch("/notification/read-all").catch(() => ({ success: false }));
}

/**
 * Audit Logs
 */
export async function fetchAuditLogs(page = 1, limit = 20, filters = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters.action) query.append("action", filters.action);
  if (filters.targetType) query.append("targetType", filters.targetType);

  return apiClient.get(`/audit?${query.toString()}`).catch(() => ({
    items: [],
    total: 0,
    totalPages: 0,
  }));
}

/**
 * System Monitoring
 */
export async function fetchSystemHealth() {
  return apiClient.get("/system/health").catch(() => null);
}

export async function fetchSystemMetrics() {
  return apiClient.get("/system/metrics").catch(() => null);
}

export async function fetchSystemSettings() {
  return apiClient.get("/system/settings").catch(() => []);
}

export async function updateSystemSetting(key, value) {
  return apiClient.patch(`/system/settings/${key}`, { value });
}

/**
 * Report Export
 */
export async function exportUsersReport() {
  return apiClient.get("/report/users", { responseType: "blob" });
}

export async function exportSosReport() {
  return apiClient.get("/report/sos", { responseType: "blob" });
}

export async function exportActivityReport() {
  return apiClient.get("/report/activity", { responseType: "blob" });
}

import apiClient from "@/lib/api-client";

const EMAIL_KEY = "admin_email";
const AUTH_KEY = "admin_authenticated";

/**
 * Auth operations
 */
export function clearSession() {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(AUTH_KEY);
  // Post logout to clear httpOnly cookies on the backend
  return apiClient.post("/auth/logout").catch(() => {});
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function setSession(email) {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(EMAIL_KEY, email);
}

export async function loginAdmin(email, password) {
  const payload = await apiClient.post("/auth/admin/login", {
    email,
    password,
  });

  const role = payload?.user?.role || "";
  if (role !== "ADMIN") {
    clearSession();
    throw new Error("Chỉ admin mới được đăng nhập dashboard");
  }

  setSession(payload?.user?.email || email);
  return payload;
}

export async function registerAdmin(email, password) {
  return apiClient.post("/auth/register", { email, password });
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

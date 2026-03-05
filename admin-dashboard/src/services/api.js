const STATS_API_BASE = "/api/stats";
const AUTH_API_BASE = "/api/auth";
const TOKEN_KEY = "admin_access_token";
const EMAIL_KEY = "admin_email";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

async function requestJson(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    clearSession();
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

export async function loginAdmin(email, password) {
  const payload = await requestJson(`${AUTH_API_BASE}/admin/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const token = payload?.access_token || "";
  const role = payload?.user?.role || "";
  if (!token) {
    throw new Error("Login response missing token");
  }
  if (role !== "ADMIN") {
    clearSession();
    throw new Error("Chỉ admin mới được đăng nhập dashboard");
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, payload?.user?.email || email);
  return payload;
}

export async function registerAdmin(email, password) {
  const payload = await requestJson(`${AUTH_API_BASE}/register`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const token = payload?.access_token || "";
  const role = payload?.user?.role || "";
  if (!token) {
    throw new Error("Register response missing token");
  }
  if (role !== "ADMIN") {
    clearSession();
    throw new Error("Chỉ tài khoản admin mới dùng được dashboard");
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, payload?.user?.email || email);
  return payload;
}

export async function fetchOverview() {
  try {
    return (
      (await requestJson(`${STATS_API_BASE}/overview`)) ?? {
        totalUsers: 0,
        totalDetections: 0,
        avgConfidence: 0,
      }
    );
  } catch {
    return { totalUsers: 0, totalDetections: 0, avgConfidence: 0 };
  }
}

export async function fetchByType() {
  try {
    return (await requestJson(`${STATS_API_BASE}/by-type`)) ?? [];
  } catch {
    return [];
  }
}

export async function fetchByDay(days = 30) {
  try {
    return (await requestJson(`${STATS_API_BASE}/by-day?days=${days}`)) ?? [];
  } catch {
    return [];
  }
}

export async function fetchLogs(page = 1, limit = 20) {
  try {
    return (
      (await requestJson(
        `${STATS_API_BASE}/logs?page=${page}&limit=${limit}`,
      )) ?? {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
      }
    );
  } catch {
    return { data: [], total: 0, page: 1, totalPages: 1 };
  }
}

// ── SOS ───────────────────────────────────────────
export async function fetchSosAlerts(page = 1, limit = 20) {
  try {
    return (
      (await requestJson(`/api/sos?page=${page}&limit=${limit}`)) ?? {
        data: [],
        total: 0,
      }
    );
  } catch {
    return { data: [], total: 0 };
  }
}
export async function resolveSos(id, note = "") {
  return requestJson(`/api/sos/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}
export async function acknowledgeSos(id) {
  return requestJson(`/api/sos/${id}/acknowledge`, { method: "PATCH" });
}

// ── FEEDBACK ──────────────────────────────────────
export async function fetchFeedback(page = 1, limit = 20, onlyWrong = false) {
  try {
    return (
      (await requestJson(
        `/api/feedback?page=${page}&limit=${limit}&onlyWrong=${onlyWrong}`,
      )) ?? { data: [], total: 0 }
    );
  } catch {
    return { data: [], total: 0 };
  }
}
export async function fetchFeedbackStats() {
  try {
    return (
      (await requestJson("/api/feedback/stats")) ?? {
        total: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
      }
    );
  } catch {
    return { total: 0, correct: 0, wrong: 0, accuracy: 0 };
  }
}
export async function reviewFeedback(id, correctLabel) {
  return requestJson(`/api/feedback/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify({ correctLabel }),
  });
}

// ── BROADCAST ─────────────────────────────────────
export async function fetchBroadcasts(page = 1, limit = 20) {
  try {
    return (
      (await requestJson(`/api/broadcast?page=${page}&limit=${limit}`)) ?? {
        data: [],
        total: 0,
      }
    );
  } catch {
    return { data: [], total: 0 };
  }
}
export async function sendBroadcast(
  message,
  targetType = "all",
  targetIds = [],
  priority = "normal",
) {
  return requestJson("/api/broadcast", {
    method: "POST",
    body: JSON.stringify({ message, targetType, targetIds, priority }),
  });
}

// ── HEATMAP ───────────────────────────────────────
export async function fetchHeatmap(type = "danger", days = 30) {
  try {
    return (
      (await requestJson(
        `/api/detections/heatmap?type=${type}&days=${days}`,
      )) ?? []
    );
  } catch {
    return [];
  }
}

// ── USERS ─────────────────────────────────────────
export async function fetchUsers(page = 1, limit = 20, search = "") {
  try {
    return (
      (await requestJson(
        `/api/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      )) ?? { data: [], total: 0, page: 1, totalPages: 1 }
    );
  } catch {
    return { data: [], total: 0, page: 1, totalPages: 1 };
  }
}

export async function toggleUserRole(id) {
  return requestJson(`/api/users/${id}/toggle-role`, { method: "PATCH" });
}

export async function createUser(email, password, role = "USER") {
  return requestJson("/api/users", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export async function updateUser(id, data) {
  return requestJson(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id) {
  return requestJson(`/api/users/${id}`, { method: "DELETE" });
}

export async function lockUser(id) {
  return requestJson(`/api/users/${id}/lock`, { method: "PATCH" });
}

export async function unlockUser(id) {
  return requestJson(`/api/users/${id}/unlock`, { method: "PATCH" });
}

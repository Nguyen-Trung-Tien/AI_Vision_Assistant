const STATS_API_BASE = "/api/stats";
const AUTH_API_BASE = "/auth";
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
  const payload = await requestJson(`${AUTH_API_BASE}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const token = payload?.access_token || "";
  if (!token) {
    throw new Error("Login response missing token");
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
  if (!token) {
    throw new Error("Register response missing token");
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
      (await requestJson(`${STATS_API_BASE}/logs?page=${page}&limit=${limit}`)) ?? {
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

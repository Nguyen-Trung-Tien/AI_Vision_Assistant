const EMAIL_KEY = "admin_email";
const AUTH_KEY = "admin_authenticated";
const TOKEN_KEY = "admin_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function setSession(email, token) {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(EMAIL_KEY, email);
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true" && !!localStorage.getItem(TOKEN_KEY);
}

export function clearSessionLocal() {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  // Also clear old keys just in case
  localStorage.removeItem("is_authenticated");
  localStorage.removeItem("access_token");
}

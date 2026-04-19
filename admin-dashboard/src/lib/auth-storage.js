const EMAIL_KEY = "admin_email";
const AUTH_KEY = "admin_authenticated";
const TOKEN_KEY = "admin_token";
const ROLE_KEY = "admin_role";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY) ?? "USER";
}

export function setSession(email, token, role) {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(EMAIL_KEY, email);
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true" && !!localStorage.getItem(TOKEN_KEY);
}

export function clearSessionLocal() {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  // Also clear old keys just in case
  localStorage.removeItem("is_authenticated");
  localStorage.removeItem("access_token");
}

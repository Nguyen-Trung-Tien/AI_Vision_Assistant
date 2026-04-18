const EMAIL_KEY = "admin_email";
const AUTH_KEY = "admin_authenticated";

export function getStoredToken() {
  return localStorage.getItem(AUTH_KEY);
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function setSession(email) {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearSessionLocal() {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(AUTH_KEY);
}

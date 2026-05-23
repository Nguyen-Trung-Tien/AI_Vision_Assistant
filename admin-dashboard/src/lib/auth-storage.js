const EMAIL_KEY = "admin_email";
const AUTH_KEY = "admin_authenticated";
const ROLE_KEY = "admin_role";
const NAME_KEY = "admin_name";
const PHONE_KEY = "admin_phone";

export function getStoredToken() {
  return ""; // Deprecated: token is now strictly handled via HttpOnly cookies
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? "";
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY) ?? "USER";
}

export function getStoredName() {
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function getStoredPhone() {
  return localStorage.getItem(PHONE_KEY) ?? "";
}

export function setSession(email, role, full_name = "", phone = "") {
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(EMAIL_KEY, email);
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
  localStorage.setItem(NAME_KEY, full_name);
  localStorage.setItem(PHONE_KEY, phone);
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function clearSessionLocal() {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(PHONE_KEY);
  // Also clear old keys just in case
  localStorage.removeItem("is_authenticated");
  localStorage.removeItem("admin_token");
  localStorage.removeItem("access_token");
}

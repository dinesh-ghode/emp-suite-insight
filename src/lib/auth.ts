// Simple fixed-credential admin auth (client-side session).
// Replace with real auth (Lovable Cloud) when needed.

const SESSION_KEY = "ems.admin.session";

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin@123",
};

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "1";
}

export function login(username: string, password: string): boolean {
  if (
    username.trim() === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    localStorage.setItem(SESSION_KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

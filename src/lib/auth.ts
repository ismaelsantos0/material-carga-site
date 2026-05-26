export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function getUsername(): string {
  return localStorage.getItem("username") || "";
}

export function setUsername(username: string) {
  localStorage.setItem("username", username);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

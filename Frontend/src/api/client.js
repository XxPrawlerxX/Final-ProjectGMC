// Thin wrapper around fetch for talking to the Marketfind backend.
// Every other file in src/api/ goes through this — it's the ONLY place
// that knows the base URL, attaches the auth token, and turns a
// non-2xx response into a thrown error with the backend's own message.

const BASE_URL = import.meta.env.VITE_API_URL;

const TOKEN_KEY = "marketfind_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// A small typed error so callers (forms, pages) can show the backend's
// actual validation/authorization message instead of a generic one.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // The backend always responds with JSON, even on errors.
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || "Something went wrong. Please try again.", response.status);
  }

  return data;
}

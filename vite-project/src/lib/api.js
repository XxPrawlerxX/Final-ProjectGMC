// Small fetch wrapper for the Marketfind API.
// In development Vite proxies /api to the server (see vite.config.js); in
// production set VITE_API_URL if the API lives on another domain.
const API_BASE = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(message, status, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include", // send the session cookie
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || "Something went wrong.", response.status, data.field);
  return data;
}

// Same as request() but sends a FormData body (used for picture uploads).
// The browser sets the multipart Content-Type itself, so we must not.
async function requestForm(method, path, formData) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { method, credentials: "include", body: formData });
  } catch {
    throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || "Something went wrong.", response.status, data.field);
  return data;
}

export const api = {
  postForm: (path, formData) => requestForm("POST", path, formData),
  patchForm: (path, formData) => requestForm("PATCH", path, formData),
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body ?? {}),
  put: (path, body) => request("PUT", path, body ?? {}),
  patch: (path, body) => request("PATCH", path, body ?? {}),
  delete: (path) => request("DELETE", path),
};

// Build "/api/products?category=x&page=2", skipping empty values
export function withQuery(path, params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `${path}?${text}` : path;
}

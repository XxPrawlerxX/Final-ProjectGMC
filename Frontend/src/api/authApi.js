import { apiRequest } from "./client";

// POST /api/auth/register — creates a customer account only. The backend
// ignores/rejects any "role" field, so there's no point sending one.
export function registerCustomer({ name, email, password }) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: { name, email, password },
    auth: false,
  });
}

// POST /api/auth/register/vendor — creates the account AND a pending
// vendor application in one call. The account stays role "customer"
// until an admin approves the application.
export function registerVendor(payload) {
  return apiRequest("/auth/register/vendor", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

// POST /api/auth/login
export function login({ email, password }) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

// GET /api/auth/me — used to restore the session after a page refresh.
export function getCurrentUser() {
  return apiRequest("/auth/me");
}

// POST /api/auth/forgot-password — always resolves with a generic
// message regardless of whether the email is registered (the backend
// never reveals that). In development, the response also includes
// devResetToken as a stand-in for real email delivery, which isn't
// wired up in this project yet.
export function forgotPassword(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

// POST /api/auth/reset-password
export function resetPassword(token, password) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, password },
    auth: false,
  });
}

// PUT /api/auth/profile — updates the logged-in user's own name/email.
export function updateProfile({ name, email }) {
  return apiRequest("/auth/profile", {
    method: "PUT",
    body: { name, email },
  });
}

// PUT /api/auth/change-password — requires the current password.
export function changePassword({ currentPassword, newPassword }) {
  return apiRequest("/auth/change-password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
}

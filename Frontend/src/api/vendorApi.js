import { apiRequest } from "./client";

// GET /api/vendors/me — the logged-in user's own vendor application/profile.
export function getMyVendorProfile() {
  return apiRequest("/vendors/me");
}

// PUT /api/vendors/me — update the logged-in vendor's own store profile.
export function updateMyVendorProfile(payload) {
  return apiRequest("/vendors/me", { method: "PUT", body: payload });
}

// GET /api/vendors/applications — admin-only, every vendor application.
export function getVendorApplications() {
  return apiRequest("/vendors/applications");
}

// PUT /api/vendors/:id/approve — admin-only.
export function approveVendor(id) {
  return apiRequest(`/vendors/${id}/approve`, { method: "PUT" });
}

// PUT /api/vendors/:id/reject — admin-only.
export function rejectVendor(id, rejectionReason) {
  return apiRequest(`/vendors/${id}/reject`, {
    method: "PUT",
    body: { rejectionReason },
  });
}

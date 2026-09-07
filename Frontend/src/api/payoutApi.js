import { apiRequest } from "./client";

// GET /api/payouts/vendor/me — the logged-in vendor's own earnings.
export function getMyEarnings() {
  return apiRequest("/payouts/vendor/me");
}

// GET /api/payouts/admin/summary — admin-only, every vendor's totals.
export function getAdminPayoutSummary() {
  return apiRequest("/payouts/admin/summary");
}

// POST /api/payouts/admin/:vendorId/pay — admin-only. Records that the
// vendor's currently pending earnings have been paid out. This does
// NOT move real money — the admin sends it manually outside the app
// first, then records it here.
export function payoutVendor(vendorId) {
  return apiRequest(`/payouts/admin/${vendorId}/pay`, { method: "POST" });
}

// GET /api/payouts/admin/history — admin-only, full audit trail.
export function getAllPayoutHistory() {
  return apiRequest("/payouts/admin/history");
}

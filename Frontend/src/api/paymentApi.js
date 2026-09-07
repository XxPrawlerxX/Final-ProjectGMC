import { apiRequest } from "./client";

// POST /api/payments/initialize/:orderId — the backend calculates the
// amount from the order itself; nothing here can influence what gets
// charged. Returns { authorization_url, access_code, reference }.
export function initializePayment(orderId) {
  return apiRequest(`/payments/initialize/${orderId}`, { method: "POST" });
}

// GET /api/payments/verify/:reference — the ONLY source of truth for
// whether a payment actually succeeded. Landing on the callback page is
// never treated as proof of payment by itself.
export function verifyPayment(reference) {
  return apiRequest(`/payments/verify/${reference}`);
}

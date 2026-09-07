import { apiRequest } from "./client";

// POST /api/orders — creates an order from the customer's CURRENT
// backend cart. Only shippingAddress is ever sent; the backend computes
// price/subtotal/total itself from the real cart and product data.
export function createOrder(shippingAddress) {
  return apiRequest("/orders", {
    method: "POST",
    body: { shippingAddress },
  });
}

export function getMyOrders() {
  return apiRequest("/orders");
}

export function getOrderById(id) {
  return apiRequest(`/orders/${id}`);
}

// PUT /api/orders/:id/cancel — customer cancelling their OWN order.
// Only works while the order is still unpaid — the backend rejects a
// paid order with a clear message, since undoing a real payment needs
// a refund flow this app doesn't have yet.
export function cancelMyOrder(id) {
  return apiRequest(`/orders/${id}/cancel`, { method: "PUT" });
}

// GET /api/orders/vendor — vendor-only. Returns only the vendor's own
// items within each qualifying order (never another vendor's items or
// the marketplace-wide order total) — enforced server-side.
export function getVendorOrders() {
  return apiRequest("/orders/vendor");
}

// PUT /api/orders/:id/items/:itemId/status — vendor (own item) or admin.
export function updateOrderItemStatus(orderId, itemId, itemStatus) {
  return apiRequest(`/orders/${orderId}/items/${itemId}/status`, {
    method: "PUT",
    body: { itemStatus },
  });
}

// GET /api/orders/admin/all — admin-only, every order in the marketplace.
export function getAllOrdersAdmin() {
  return apiRequest("/orders/admin/all");
}

// PUT /api/orders/:id/status — admin-only. Only supports cancelling an
// entire order (the backend rejects any other value) — see backend
// comments for why forward progress must go through per-item updates.
export function cancelOrderAdmin(orderId) {
  return apiRequest(`/orders/${orderId}/status`, {
    method: "PUT",
    body: { orderStatus: "cancelled" },
  });
}

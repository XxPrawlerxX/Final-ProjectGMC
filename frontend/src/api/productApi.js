import { apiRequest } from "./client";

// GET /api/products — public. Accepts the backend's real filter params:
// search, category, vendor, minPrice, maxPrice, sort, page, limit.
export function getProducts(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  ).toString();

  return apiRequest(`/products${query ? `?${query}` : ""}`, { auth: false });
}

// GET /api/products/:id — public product detail.
export function getProductById(id) {
  return apiRequest(`/products/${id}`, { auth: false });
}

// GET /api/products/mine — the logged-in vendor's own products.
export function getMyProducts() {
  return apiRequest("/products/mine");
}

// POST /api/products — vendor-only. The backend determines the vendor
// from the authenticated user; nothing here can claim a different one.
export function createProduct(payload) {
  return apiRequest("/products", { method: "POST", body: payload });
}

// PUT /api/products/:id — vendor (own product) or admin.
export function updateProduct(id, payload) {
  return apiRequest(`/products/${id}`, { method: "PUT", body: payload });
}

// DELETE /api/products/:id — vendor (own product) or admin.
export function deleteProduct(id) {
  return apiRequest(`/products/${id}`, { method: "DELETE" });
}

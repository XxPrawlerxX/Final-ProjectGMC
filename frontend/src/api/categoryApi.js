import { apiRequest } from "./client";

// GET /api/categories — public.
export function getCategories() {
  return apiRequest("/categories", { auth: false });
}

// POST /api/categories — admin-only (see backend note in
// routes/categoryRoutes.js about why this now requires auth).
export function createCategory(payload) {
  return apiRequest("/categories", { method: "POST", body: payload });
}

// PUT /api/categories/:id — admin-only.
export function updateCategory(id, payload) {
  return apiRequest(`/categories/${id}`, { method: "PUT", body: payload });
}

// DELETE /api/categories/:id — admin-only.
export function deleteCategory(id) {
  return apiRequest(`/categories/${id}`, { method: "DELETE" });
}

import { apiRequest } from "./client";

// All cart endpoints require a logged-in customer. The backend is the
// single source of truth for cart contents — there is no local/offline
// cart state anywhere in this app.

export function getCart() {
  return apiRequest("/cart");
}

// Adds a product, or increases its quantity if already in the cart.
export function addToCart(productId, quantity = 1) {
  return apiRequest("/cart", {
    method: "POST",
    body: { productId, quantity },
  });
}

// Sets a product's quantity to an exact value.
export function updateCartItem(productId, quantity) {
  return apiRequest(`/cart/${productId}`, {
    method: "PUT",
    body: { quantity },
  });
}

export function removeFromCart(productId) {
  return apiRequest(`/cart/${productId}`, { method: "DELETE" });
}

export function clearCart() {
  return apiRequest("/cart", { method: "DELETE" });
}

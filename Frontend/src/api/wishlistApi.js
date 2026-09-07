import { apiRequest } from "./client";

// All wishlist endpoints require a logged-in customer, same as cart.

export function getWishlist() {
  return apiRequest("/wishlist");
}

export function addToWishlist(productId) {
  return apiRequest("/wishlist", {
    method: "POST",
    body: { productId },
  });
}

export function removeFromWishlist(productId) {
  return apiRequest(`/wishlist/${productId}`, { method: "DELETE" });
}

export function clearWishlist() {
  return apiRequest("/wishlist", { method: "DELETE" });
}

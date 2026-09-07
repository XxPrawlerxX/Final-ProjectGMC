import { apiRequest } from "./client";

// GET /api/reviews/product/:productId — public.
export function getProductReviews(productId) {
  return apiRequest(`/reviews/product/${productId}`, { auth: false });
}

// POST /api/reviews — customer-only. The backend verifies the purchase
// itself; nothing here can fake a "verified" review.
export function createReview({ productId, rating, comment }) {
  return apiRequest("/reviews", {
    method: "POST",
    body: { productId, rating, comment },
  });
}

export function updateReview(id, { rating, comment }) {
  return apiRequest(`/reviews/${id}`, {
    method: "PUT",
    body: { rating, comment },
  });
}

export function deleteReview(id) {
  return apiRequest(`/reviews/${id}`, { method: "DELETE" });
}

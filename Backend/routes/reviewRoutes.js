import express from "express";

import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

import { protect, customerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — anyone can read a product's reviews.
router.get("/product/:productId", getProductReviews);

// Everything below requires a logged-in customer. deleteReview also
// allows an admin, checked inside the controller itself since that
// needs role-aware logic, not a blanket role gate.
router.post("/", protect, customerOnly, createReview);
router.put("/:id", protect, customerOnly, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;

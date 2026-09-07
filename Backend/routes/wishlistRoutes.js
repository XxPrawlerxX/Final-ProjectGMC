import express from "express";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} from "../controllers/wishlistController.js";

import { protect, customerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Same as cart — every wishlist route requires a logged-in customer.
router.use(protect, customerOnly);

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.delete("/", clearWishlist);

export default router;

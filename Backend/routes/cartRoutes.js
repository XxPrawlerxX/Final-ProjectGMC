import express from "express";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

import { protect, customerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Every cart route requires a logged-in CUSTOMER. Vendors and admins
// are blocked before they ever reach a controller.
router.use(protect, customerOnly);

// GET the authenticated customer's cart
router.get("/", getCart);

// ADD a product to the cart (or increase quantity if already present)
router.post("/", addToCart);

// SET a product's quantity in the cart
router.put("/:productId", updateCartItem);

// REMOVE one product from the cart
router.delete("/:productId", removeFromCart);

// CLEAR the entire cart
router.delete("/", clearCart);

export default router;

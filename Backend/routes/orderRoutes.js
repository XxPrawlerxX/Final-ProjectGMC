import express from "express";

import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getVendorOrders,
  updateOrderItemStatus,
  updateOrderStatusAdmin,
} from "../controllers/orderController.js";

import {
  protect,
  customerOnly,
  adminOnly,
  vendorOnly,
  vendorOrAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Every order route requires SOME logged-in user; the specific role
// guard on each route below narrows it further.
router.use(protect);

// ADMIN — view every order in the marketplace.
// Declared before "/:id" so Express doesn't treat "admin" as an order id.
router.get("/admin/all", adminOnly, getAllOrders);

// VENDOR — view only the parts of orders containing their own products.
// Also declared before "/:id" for the same reason.
router.get("/vendor", vendorOnly, getVendorOrders);

// CUSTOMER — create an order from their own cart.
router.post("/", customerOnly, createOrder);

// CUSTOMER — view their own order history.
router.get("/", customerOnly, getMyOrders);

// CUSTOMER — view one of their own orders.
router.get("/:id", customerOnly, getMyOrderById);

// VENDOR (own items only) or ADMIN (any item) — update ONE item's
// fulfillment status. The order's overall orderStatus is recalculated
// automatically from all of its items after this.
router.put("/:id/items/:itemId/status", vendorOrAdmin, updateOrderItemStatus);

// ADMIN — cancel an entire order. This is the only whole-order status
// change this endpoint supports; see updateOrderStatusAdmin for why.
router.put("/:id/status", adminOnly, updateOrderStatusAdmin);

export default router;

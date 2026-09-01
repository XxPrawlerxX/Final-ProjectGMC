import express from "express";

import {
  initializePayment,
  verifyPayment,
  handlePaystackWebhook,
} from "../controllers/paymentController.js";

import { protect, customerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Paystack calls this endpoint directly from their own servers — there
// is no user JWT on this request, so it must NOT go through protect().
// Its own HMAC signature check (inside handlePaystackWebhook) is what
// proves the request genuinely came from Paystack.
router.post("/webhook", handlePaystackWebhook);

// Everything below this line requires a logged-in CUSTOMER.
router.use(protect, customerOnly);

// Start a Paystack transaction for one of the customer's own orders.
router.post("/initialize/:orderId", initializePayment);

// Check (and settle) the real status of a payment attempt.
router.get("/verify/:reference", verifyPayment);

export default router;

import express from "express";

import {
  getMyEarnings,
  getAdminPayoutSummary,
  payoutVendor,
  getAllPayoutHistory,
} from "../controllers/payoutController.js";

import { protect, vendorOnly, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// VENDOR — their own earnings and payout history.
router.get("/vendor/me", vendorOnly, getMyEarnings);

// ADMIN — every vendor's pending/paid totals.
router.get("/admin/summary", adminOnly, getAdminPayoutSummary);

// ADMIN — record a payout batch for one vendor.
router.post("/admin/:vendorId/pay", adminOnly, payoutVendor);

// ADMIN — full payout history across all vendors.
router.get("/admin/history", adminOnly, getAllPayoutHistory);

export default router;

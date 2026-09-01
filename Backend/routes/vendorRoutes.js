import express from "express";

import {
  getMyVendorProfile,
  getVendorApplications,
  approveVendor,
  rejectVendor,
} from "../controllers/vendorController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// NOTE: POST /apply was removed. Vendors now register through
// POST /api/auth/register/vendor instead (see authRoutes.js).

// VENDOR → GET OWN PROFILE (or application status)
router.get("/me", protect, getMyVendorProfile);

// ADMIN → GET ALL APPLICATIONS
router.get("/applications", protect, adminOnly, getVendorApplications);

// ADMIN → APPROVE APPLICATION
router.put("/:id/approve", protect, adminOnly, approveVendor);

// ADMIN → REJECT APPLICATION
router.put("/:id/reject", protect, adminOnly, rejectVendor);

export default router;

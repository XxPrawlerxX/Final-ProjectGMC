import express from "express";

import {
  register,
  registerVendor,
  login,
  getMe,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Register a normal customer account
router.post("/register", register);

// Register a vendor: creates the User account AND a pending
// Vendor application in one request. Role stays "customer"
// until an admin approves the application.
router.post("/register/vendor", registerVendor);

// Login
router.post("/login", login);

// Get currently logged-in user
router.get("/me", protect, getMe);

export default router;

import express from "express";

import {
  register,
  registerVendor,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
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

// Request a password reset (already covered by authLimiter in
// server.js, since this whole router is mounted behind it).
router.post("/forgot-password", forgotPassword);

// Complete a password reset using the token from forgotPassword.
router.post("/reset-password", resetPassword);

// Update the logged-in user's own name/email.
router.put("/profile", protect, updateProfile);

// Change the logged-in user's own password (requires the current one).
router.put("/change-password", protect, changePassword);

export default router;

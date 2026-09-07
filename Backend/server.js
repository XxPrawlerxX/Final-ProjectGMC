import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import payoutRoutes from "./routes/payoutRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import { expirePendingOrders } from "./services/orderExpiryService.js";

const port = 5002;

dotenv.config();

const app = express();

// Standard security headers (hides X-Powered-By, sets sensible
// defaults for HSTS/frame-options/etc.). Safe to enable unconditionally
// — it doesn't change any application behavior, only response headers.
app.use(helmet());

// General API-wide limiter: a generous ceiling meant to blunt basic
// abuse/DoS attempts without affecting normal usage.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Auth endpoints are brute-force targets (login/register), so they get
// a much stricter limit than the rest of the API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

// The frontend's dev origin(s). Configurable via .env (comma-separated)
// so this works whether the frontend runs on Vite's default port, a
// different one, or is also being reached over the LAN (e.g. from a
// phone on the same WiFi) — all without ever needing a wildcard "*"
// (which the browser also refuses to combine with credentialed requests).
// Falls back to Vite's default dev port.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5180")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Middleware
// The `verify` hook below saves the exact raw request bytes onto
// req.rawBody, in addition to the normal parsed req.body. This does NOT
// change behavior for any existing route — it's purely additive. It
// exists because the Paystack webhook must verify its signature against
// the EXACT bytes Paystack sent, not a re-serialized copy of req.body
// (which could differ in key order/whitespace and make a genuine
// request look tampered with).
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Marketfind API is running",
  });
});

// API routes
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/reviews", reviewRoutes);

// How often to sweep for orders whose payment reservation window has
// expired. Kept short relative to the reservation itself (see
// PAYMENT_RESERVATION_MINUTES in orderController.js) so stock doesn't
// sit locked for much longer than the reservation actually promised.
const ORDER_EXPIRY_SWEEP_INTERVAL_MS = 5 * 60 * 1000;

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Release stock from any orders that expired while the server was
    // down, then keep sweeping on an interval. See
    // services/orderExpiryService.js for what this does and its
    // single-instance-deployment caveat.
    expirePendingOrders().catch((error) => {
      console.error("Initial order expiry sweep failed:", error);
    });

    setInterval(() => {
      expirePendingOrders().catch((error) => {
        console.error("Order expiry sweep failed:", error);
      });
    }, ORDER_EXPIRY_SWEEP_INTERVAL_MS);
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

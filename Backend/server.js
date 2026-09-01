import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const port = 5002;

dotenv.config();

const app = express();

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
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Marketfind API is running",
  });
});

// API routes
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();

import express from "express";

import {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import { protect, vendorOnly, vendorOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all products (public — anyone can browse)
router.get("/", getProducts);

// GET the logged-in vendor's own products.
// NOTE: this must be declared BEFORE "/:id" below, otherwise Express
// would try to treat "mine" as a product id.
router.get("/mine", protect, vendorOnly, getMyProducts);

// CREATE a product (only approved vendors)
router.post("/", protect, vendorOnly, createProduct);

// GET one product (public)
router.get("/:id", getProductById);

// UPDATE a product (vendor who owns it, or admin)
router.put("/:id", protect, vendorOrAdmin, updateProduct);

// DELETE a product (vendor who owns it, or admin)
router.delete("/:id", protect, vendorOrAdmin, deleteProduct);

export default router;

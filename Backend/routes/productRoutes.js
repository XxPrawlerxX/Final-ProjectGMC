import express from "express";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// GET all products
router.get("/", getProducts);

// CREATE a product
router.post("/", createProduct);

// GET one product
router.get("/:id", getProductById);

// UPDATE a product
router.put("/:id", updateProduct);

// DELETE a product
router.delete("/:id", deleteProduct);

export default router;

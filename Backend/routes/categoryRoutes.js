import express from "express";

import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Browsing categories is public — anyone can see what's on the site.
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Creating/editing/deleting the marketplace's category list is an
// admin action. These were previously wide open with no auth at all
// (a pre-existing gap from before the role system existed) — fixed
// here now that the frontend admin dashboard actually calls them.
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;

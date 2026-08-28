import express from "express";

import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);

router.post("/", createCategory);

router.get("/:id", getCategoryById);

router.put("/:id", updateCategory);

router.delete("/:id", deleteCategory);

export default router;

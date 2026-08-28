import Category from "../models/Category.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, slug, image } = req.body;

    const category = await Category.create({
      name,
      slug,
      image,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create category",
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    res.json(category);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch category",
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update category",
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    res.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete category",
    });
  }
};
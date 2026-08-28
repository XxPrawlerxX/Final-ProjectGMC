import Product from "../models/Product.js";

// GET all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate(
      "category",
      "name slug image",
    );

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

// GET one product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug image",
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

// CREATE a product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      oldPrice,
      image,
      category,
      stock,
      tag,
      shipping,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      oldPrice,
      image,
      category,
      stock,
      tag,
      shipping,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create product",
    });
  }
};

// UPDATE a product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug image");

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update product",
    });
  }
};

// DELETE a product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete product",
    });
  }
};

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    oldPrice: {
      type: Number,
      min: 0,
    },

    image: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Every product belongs to exactly one vendor. This is ALWAYS set by
    // the backend from the logged-in user's Vendor profile — never from
    // a value sent by the frontend. See createProduct in
    // controllers/productController.js.
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    tag: {
      type: String,
      trim: true,
    },

    shipping: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  headline: { type: String, default: "" },
  description: { type: String, default: "" },
  heroImage: { type: String, default: "" },
  image: { type: String, default: "" }, // tile image on the home page
  featured: { type: Boolean, default: false }, // shown as a tile on the home page
  order: { type: Number, default: 0 },
});

export const Category = mongoose.model("Category", categorySchema);

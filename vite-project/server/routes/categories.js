import { Router } from "express";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { HttpError, wrap } from "../lib/errors.js";
import { str } from "../lib/validate.js";

const router = Router();

const toDto = (c) => ({
  slug: c.slug,
  name: c.name,
  headline: c.headline,
  description: c.description,
  heroImage: c.heroImage,
  image: c.image || c.heroImage,
  featured: c.featured,
});

router.get(
  "/",
  wrap(async (req, res) => {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ items: categories.map(toDto) });
  }),
);

router.get(
  "/:slug",
  wrap(async (req, res) => {
    const slug = str(req.params.slug, "slug", { max: 80 });
    const category = await Category.findOne({ slug });
    if (!category) throw new HttpError(404, "Category not found.");
    const productCount = await Product.countDocuments({ categorySlug: slug, active: true });
    res.json({ category: toDto(category), productCount });
  }),
);

export default router;

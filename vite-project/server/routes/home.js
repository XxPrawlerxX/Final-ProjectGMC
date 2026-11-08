import { Router } from "express";
import { Category } from "../models/Category.js";
import { Collection } from "../models/Collection.js";
import { Product, toProductDto } from "../models/Product.js";
import { audienceFilter } from "../lib/access.js";
import { recommendFor } from "../lib/recommendations.js";
import { wrap } from "../lib/errors.js";

const router = Router();

// Everything the home page needs in one request
router.get(
  "/",
  wrap(async (req, res) => {
    const visible = { active: true, ...audienceFilter(req.user) };
    const [hero, collections, tiles, latest, personal] = await Promise.all([
      Product.find({ collections: "hero", ...visible }).limit(5),
      Collection.find({ showOnHome: true }).sort({ order: 1 }).limit(6),
      Category.find({ featured: true }).sort({ order: 1 }).limit(12),
      // newest products uploaded by sellers
      Product.find({ seller: { $ne: null }, ...visible }).sort({ createdAt: -1 }).limit(8),
      req.user ? recommendFor(req.user, { limit: 8 }) : null, // signed-in shoppers get picks for their mode
    ]);

    const rows = await Promise.all(
      collections.map(async (c) => {
        const products = await Product.find({ collections: c.slug, ...visible }).limit(8);
        return {
          slug: c.slug,
          title: c.title,
          subtitle: c.subtitle,
          category: c.category,
          products: products.map(toProductDto),
        };
      }),
    );

    res.json({
      hero: hero.map(toProductDto),
      latest: latest.map(toProductDto),
      recommended: personal?.sections[0] ?? null,
      collections: rows.filter((row) => row.products.length > 0),
      tiles: tiles.map((c) => ({ slug: c.slug, name: c.name, image: c.image || c.heroImage })),
    });
  }),
);

export default router;

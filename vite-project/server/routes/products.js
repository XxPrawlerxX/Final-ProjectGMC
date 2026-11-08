import { Router } from "express";
import { Product, toProductDto } from "../models/Product.js";
import { HttpError, wrap } from "../lib/errors.js";
import { escapeRegex, int, oneOf, optionalInt, str } from "../lib/validate.js";
import { audienceFilter } from "../lib/access.js";
import reviewsRouter from "./reviews.js";

const router = Router();

const SORTS = {
  featured: { _id: 1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: 1 },
  rating: { ratingAvg: -1, ratingCount: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
};

// GET /api/products?category=&q=&min=&max=&inStock=1&sort=&page=&limit=&ids=a,b
router.get(
  "/",
  wrap(async (req, res) => {
    const query = req.query;
    const filter = { active: true, ...audienceFilter(req.user) }; // business-only items stay hidden from others

    if (query.category !== undefined) filter.categorySlug = str(query.category, "category", { max: 80 });

    if (query.listing !== undefined) {
      const listing = oneOf(query.listing, "listing", ["retail", "bulk", "secondhand"], undefined);
      if (listing) filter.listingType = listing; // (undefined would be saved as null and match nothing)
    }
    if (query.seller !== undefined) filter.sellerSlug = str(query.seller, "seller", { max: 80 });

    const q = str(query.q, "q", { optional: true, max: 100 });
    const terms = q.split(/\s+/).filter(Boolean).slice(0, 5);
    if (terms.length) {
      filter.$and = terms.map((term) => {
        const re = new RegExp(escapeRegex(term.slice(0, 40)), "i");
        return { $or: [{ name: re }, { category: re }] };
      });
    }

    const min = optionalInt(query.min, "min");
    const max = optionalInt(query.max, "max");
    if (min !== undefined || max !== undefined) {
      filter.price = {};
      if (min !== undefined) filter.price.$gte = min;
      if (max !== undefined) filter.price.$lte = max;
    }
    if (query.inStock === "1") filter.stock = { $gt: 0 };

    if (query.ids !== undefined) {
      const ids = str(query.ids, "ids", { max: 2000 }).split(",").slice(0, 50);
      filter.slug = { $in: ids.map((id) => str(id, "ids", { max: 200 })) };
    }

    const sortKey = oneOf(query.sort, "sort", Object.keys(SORTS), "featured");
    const limit = int(query.limit ?? 12, "limit", { min: 1, max: 48 });
    const page = int(query.page ?? 1, "page", { min: 1, max: 1000 });

    const pipeline = [{ $match: filter }, { $sort: SORTS[sortKey] }];
    if (terms.length) {
      // The same product name can exist in several categories; show it once in search
      pipeline.push(
        { $group: { _id: "$name", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: SORTS[sortKey] },
      );
    }
    pipeline.push({
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: "n" }],
      },
    });

    const [result] = await Product.aggregate(pipeline);
    const total = result.total[0]?.n ?? 0;
    res.json({
      items: result.items.map(toProductDto),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  }),
);

router.get(
  "/:slug",
  wrap(async (req, res) => {
    const product = await Product.findOne({ slug: str(req.params.slug, "slug", { max: 200 }), active: true });
    if (!product) throw new HttpError(404, "Product not found.");
    const related = await Product.find({
      categorySlug: product.categorySlug,
      slug: { $ne: product.slug },
      active: true,
      ...audienceFilter(req.user),
    }).limit(4);
    res.json({ product: toProductDto(product), related: related.map(toProductDto) });
  }),
);

router.use("/:slug/reviews", reviewsRouter);

export default router;

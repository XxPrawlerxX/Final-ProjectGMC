import { Router } from "express";
import { Review, refreshProductRating, toReviewDto } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { HttpError, wrap } from "../lib/errors.js";
import { int, isPlainObject, str } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/security.js";

const router = Router({ mergeParams: true });
const slugOf = (req) => str(req.params.slug, "slug", { max: 200 });

router.get(
  "/",
  wrap(async (req, res) => {
    const slug = slugOf(req);
    const reviews = await Review.find({ product: slug }).sort({ createdAt: -1 }).limit(50);
    const mine = req.user ? reviews.find((r) => String(r.user) === String(req.user._id)) : null;
    res.json({ items: reviews.map(toReviewDto), mine: mine ? toReviewDto(mine) : null });
  }),
);

router.post(
  "/",
  writeLimiter,
  requireAuth,
  wrap(async (req, res) => {
    const slug = slugOf(req);
    const body = isPlainObject(req.body) ? req.body : {};
    const rating = int(body.rating, "rating", { min: 1, max: 5 });
    const title = str(body.title, "title", { optional: true, max: 100 });
    const text = str(body.body, "body", { optional: true, max: 2000 });

    if (!(await Product.exists({ slug, active: true }))) throw new HttpError(404, "Product not found.");

    const review = await Review.findOneAndUpdate(
      { product: slug, user: req.user._id },
      { rating, title, body: text, userName: req.user.name },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await refreshProductRating(slug);
    res.status(201).json({ review: toReviewDto(review) });
  }),
);

router.delete(
  "/mine",
  writeLimiter,
  requireAuth,
  wrap(async (req, res) => {
    const slug = slugOf(req);
    await Review.deleteOne({ product: slug, user: req.user._id });
    await refreshProductRating(slug);
    res.json({ ok: true });
  }),
);

export default router;

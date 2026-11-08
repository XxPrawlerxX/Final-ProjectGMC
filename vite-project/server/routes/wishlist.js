import { Router } from "express";
import { Product, toProductDto } from "../models/Product.js";
import { User } from "../models/User.js";
import { HttpError, wrap } from "../lib/errors.js";
import { str } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/security.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  wrap(async (req, res) => {
    const ids = req.user.wishlist;
    const products = await Product.find({ slug: { $in: ids }, active: true });
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    const items = ids.map((id) => bySlug.get(id)).filter(Boolean).map(toProductDto);
    res.json({ ids, items });
  }),
);

router.put(
  "/:slug",
  writeLimiter,
  wrap(async (req, res) => {
    const slug = str(req.params.slug, "slug", { max: 200 });
    if (!(await Product.exists({ slug, active: true }))) throw new HttpError(404, "Product not found.");
    const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: slug } }, { new: true });
    res.json({ ids: user.wishlist });
  }),
);

router.delete(
  "/:slug",
  writeLimiter,
  wrap(async (req, res) => {
    const slug = str(req.params.slug, "slug", { max: 200 });
    const user = await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: slug } }, { new: true });
    res.json({ ids: user.wishlist });
  }),
);

export default router;

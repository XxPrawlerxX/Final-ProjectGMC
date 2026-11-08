import { Router } from "express";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { Category } from "../models/Category.js";
import { Order, toOrderDto } from "../models/Order.js";
import { Product, toProductDto } from "../models/Product.js";
import { User } from "../models/User.js";
import { HttpError, wrap } from "../lib/errors.js";
import { ValidationError, int, isPlainObject, oneOf, str } from "../lib/validate.js";
import { requireAdmin } from "../middleware/auth.js";
import { slugify } from "../lib/slug.js";

const router = Router();
router.use(requireAdmin);

function parseProduct(body, { partial }) {
  if (!isPlainObject(body)) throw new ValidationError("Invalid product.");
  const out = {};
  const has = (key) => body[key] !== undefined;
  if (!partial || has("name")) out.name = str(body.name, "name", { max: 200 });
  if (!partial || has("price")) out.price = int(body.price, "price", { min: 1 });
  if (has("oldPrice")) out.oldPrice = int(body.oldPrice, "oldPrice", { min: 0 });
  if (!partial || has("image")) {
    out.image = str(body.image, "image", { max: 500 });
    if (!/^https?:\/\//.test(out.image)) throw new ValidationError("Use a full image URL.", "image");
  }
  if (has("stock")) out.stock = int(body.stock, "stock", { min: 0 });
  if (has("description")) out.description = str(body.description, "description", { optional: true, max: 4000 });
  if (has("tag")) out.tag = str(body.tag, "tag", { optional: true, max: 40 });
  if (has("active")) out.active = body.active === true;
  return out;
}

router.post(
  "/products",
  wrap(async (req, res) => {
    const data = parseProduct(req.body, { partial: false });
    const category = await Category.findOne({ slug: str(req.body.categorySlug, "categorySlug", { max: 80 }) });
    if (!category) throw new ValidationError("Unknown category.", "categorySlug");
    const product = await Product.create({
      ...data,
      slug: `${slugify(data.name)}-${randomBytes(3).toString("hex")}`,
      category: category.name,
      categorySlug: category.slug,
    });
    res.status(201).json({ product: toProductDto(product) });
  }),
);

router.patch(
  "/products/:slug",
  wrap(async (req, res) => {
    const update = parseProduct(req.body, { partial: true });
    const product = await Product.findOneAndUpdate({ slug: str(req.params.slug, "slug", { max: 200 }) }, update, { new: true });
    if (!product) throw new HttpError(404, "Product not found.");
    res.json({ product: toProductDto(product) });
  }),
);

// Soft delete: old orders keep working, the product just stops being sold
router.delete(
  "/products/:slug",
  wrap(async (req, res) => {
    const product = await Product.findOneAndUpdate(
      { slug: str(req.params.slug, "slug", { max: 200 }) },
      { active: false },
    );
    if (!product) throw new HttpError(404, "Product not found.");
    res.json({ ok: true });
  }),
);

// Suspending a seller also hides all of their products
router.patch(
  "/sellers/:id/status",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, "Seller not found.");
    const body = isPlainObject(req.body) ? req.body : {};
    const status = oneOf(body.status, "status", ["active", "suspended"], undefined);
    const verified = typeof body.verified === "boolean" ? body.verified : undefined;
    if (!status && verified === undefined) throw new ValidationError("Send a status and/or verified.", "status");

    const update = {};
    if (status) update["seller.status"] = status;
    if (verified !== undefined) update["seller.verified"] = verified;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, "seller.storeName": { $exists: true } },
      update,
      { new: true },
    );
    if (!user) throw new HttpError(404, "Seller not found.");
    if (status === "suspended") await Product.updateMany({ seller: user._id }, { active: false });
    if (verified !== undefined) await Product.updateMany({ seller: user._id }, { sellerVerified: verified });
    res.json({ ok: true, status: user.seller.status, verified: user.seller.verified });
  }),
);

router.get(
  "/orders",
  wrap(async (req, res) => {
    const status = oneOf(req.query.status, "status", ["pending", "paid", "failed", "review"], undefined);
    const orders = await Order.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(100);
    res.json({ items: orders.map(toOrderDto) });
  }),
);

export default router;

// The seller's own dashboard API: list, upload, edit and hide their products,
// and see the orders that contain them. What a seller can upload depends on
// their type: retail (normal products), wholesale (bulk with minimum order and
// price breaks) or individual (second-hand / single items).
import { Router } from "express";
import multer from "multer";
import { randomBytes } from "node:crypto";
import { BULK_UNITS, validateTiers } from "../../shared/pricing.js";
import { Category } from "../models/Category.js";
import { Conversation } from "../models/Conversation.js";
import { Order } from "../models/Order.js";
import { Product, toProductDto } from "../models/Product.js";
import { HttpError, wrap } from "../lib/errors.js";
import { deleteImagesByPath, saveImages } from "../lib/images.js";
import { LISTING_FOR_SELLER } from "../lib/profiles.js";
import { slugify } from "../lib/slug.js";
import { ValidationError, int, isPlainObject, oneOf, str } from "../lib/validate.js";
import { requireSeller } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/security.js";

const router = Router();
router.use(requireSeller);

const MAX_IMAGES = 5;
const MAX_PRODUCTS = { retail: 200, wholesale: 200, individual: 50 };
const CONDITIONS = ["like-new", "good", "fair", "for-parts"];
const DEFAULT_SHIPPING = {
  retail: "Delivery arranged by seller",
  wholesale: "Delivery arranged by seller",
  individual: "Pickup or delivery by arrangement",
};

// Pictures arrive as multipart form data and are held in memory just long
// enough to be checked and saved to MongoDB.
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: MAX_IMAGES, fields: 24, fieldSize: 32 * 1024, parts: 40 },
}).array("images", MAX_IMAGES);

function upload(req, res, next) {
  uploader(req, res, (err) => {
    if (!err) return next();
    const messages = {
      LIMIT_FILE_SIZE: "Each picture must be under 4 MB.",
      LIMIT_FILE_COUNT: `You can upload up to ${MAX_IMAGES} pictures.`,
      LIMIT_UNEXPECTED_FILE: `You can upload up to ${MAX_IMAGES} pictures.`,
    };
    next(err.name === "MulterError" ? new ValidationError(messages[err.code] || "Upload failed.", "images") : err);
  });
}

// Price breaks arrive as a JSON string inside the multipart form
function parseTiersInput(raw) {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw;
  if (raw === "") return [];
  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError("Price breaks couldn't be read.", "priceTiers");
  }
}

// Fields every seller type has, plus the ones that belong to their type
function parseFields(body, { partial, sellerType }) {
  if (!isPlainObject(body)) throw new ValidationError("Invalid product.");
  const out = {};
  const has = (key) => body[key] !== undefined;
  const need = (key) => !partial || has(key);

  if (need("name")) out.name = str(body.name, "name", { min: 3, max: 120 });
  if (need("price")) out.price = int(body.price, "price", { min: 1, max: 100_000_000 });
  if (need("categorySlug")) out.categorySlug = str(body.categorySlug, "categorySlug", { max: 80 });
  if (has("description")) out.description = str(body.description, "description", { optional: true, max: 4000 });
  if (has("shipping")) out.shipping = str(body.shipping, "shipping", { optional: true, max: 80 });
  if (has("oldPrice")) out.oldPrice = body.oldPrice === "" ? 0 : int(body.oldPrice, "oldPrice", { min: 0, max: 100_000_000 });
  if (has("active")) out.active = body.active === true || body.active === "true";

  if (sellerType === "individual") {
    // One-off items: there is exactly one to sell. Stock only changes to mark it sold/relisted.
    if (has("stock")) out.stock = int(body.stock, "stock", { min: 0, max: 1 });
    if (need("condition")) {
      out.condition = oneOf(body.condition, "condition", CONDITIONS, undefined);
      if (!out.condition) throw new ValidationError("Tell buyers what condition the item is in.", "condition");
    }
    if (has("negotiable")) out.negotiable = body.negotiable === true || body.negotiable === "true";
  } else if (need("stock")) {
    out.stock = int(body.stock, "stock", { min: 0, max: 10_000_000 });
  }

  if (sellerType === "wholesale") {
    if (need("unit")) out.unit = oneOf(body.unit, "unit", BULK_UNITS, "piece");
    if (need("minOrderQty")) out.minOrderQty = int(body.minOrderQty, "minOrderQty", { min: 1, max: 100_000 });
    if (need("leadTimeDays")) out.leadTimeDays = int(body.leadTimeDays ?? 0, "leadTimeDays", { min: 0, max: 90 });
    if (need("audience")) out.audience = oneOf(body.audience, "audience", ["everyone", "business"], "everyone");
    if (has("priceTiers")) out.priceTiers = parseTiersInput(body.priceTiers);
  }
  return out;
}

async function resolveCategory(slug) {
  const category = await Category.findOne({ slug });
  if (!category) throw new ValidationError("Choose a category from the list.", "categorySlug");
  return category;
}

function checkOldPrice(price, oldPrice) {
  if (oldPrice && oldPrice <= price) {
    throw new ValidationError('The "was" price must be higher than the selling price.', "oldPrice");
  }
}

// Bulk rules that depend on several fields at once
function checkBulk({ price, minOrderQty, stock, priceTiers }) {
  const result = validateTiers(priceTiers ?? [], { price, minOrderQty });
  if (result.error) throw new ValidationError(result.error, "priceTiers");
  if (stock > 0 && stock < minOrderQty) {
    throw new ValidationError(`Stock must be at least the minimum order (${minOrderQty}), or 0 if you've run out.`, "stock");
  }
  return result.tiers;
}

const sellerDto = (p) => ({ ...toProductDto(p), active: p.active });

router.get(
  "/products",
  wrap(async (req, res) => {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ items: products.map(sellerDto) });
  }),
);

// Numbers for the top of the dashboard
router.get(
  "/stats",
  wrap(async (req, res) => {
    const id = req.user._id;
    const [live, soldOut, orders, unread] = await Promise.all([
      Product.countDocuments({ seller: id, active: true, stock: { $gt: 0 } }),
      Product.countDocuments({ seller: id, stock: 0 }),
      Order.countDocuments({ "items.seller": id, status: { $in: ["paid", "review"] } }),
      Conversation.aggregate([{ $match: { seller: id } }, { $group: { _id: null, n: { $sum: "$unreadSeller" } } }]),
    ]);
    res.json({ live, soldOut, orders, unread: unread[0]?.n ?? 0 });
  }),
);

router.post(
  "/products",
  uploadLimiter,
  upload,
  wrap(async (req, res) => {
    const sellerType = req.user.seller.sellerType;
    const files = req.files || [];
    if (files.length < 1) throw new ValidationError("Add at least one picture of the product.", "images");
    if ((await Product.countDocuments({ seller: req.user._id })) >= MAX_PRODUCTS[sellerType]) {
      throw new HttpError(409, `You've reached the limit of ${MAX_PRODUCTS[sellerType]} listings.`);
    }

    const fields = parseFields(req.body, { partial: false, sellerType });
    checkOldPrice(fields.price, fields.oldPrice);
    const category = await resolveCategory(fields.categorySlug);

    const extra = {};
    if (sellerType === "wholesale") {
      extra.priceTiers = checkBulk(fields);
      extra.unit = fields.unit;
      extra.minOrderQty = fields.minOrderQty;
      extra.leadTimeDays = fields.leadTimeDays;
      extra.audience = fields.audience;
    }
    if (sellerType === "individual") {
      extra.condition = fields.condition;
      extra.negotiable = Boolean(fields.negotiable);
    }

    const images = await saveImages(files, req.user._id);
    try {
      const seller = req.user.seller;
      const product = await Product.create({
        slug: `${slugify(fields.name)}-${randomBytes(3).toString("hex")}`,
        name: fields.name,
        price: fields.price,
        oldPrice: fields.oldPrice || 0,
        stock: sellerType === "individual" ? 1 : fields.stock,
        description: fields.description || "",
        shipping: fields.shipping || DEFAULT_SHIPPING[sellerType],
        image: images[0],
        images,
        category: category.name,
        categorySlug: category.slug,
        seller: req.user._id,
        sellerName: seller.storeName,
        sellerSlug: seller.storeSlug,
        sellerType,
        sellerVerified: Boolean(seller.verified),
        location: { city: seller.city || "", state: seller.state || "" },
        listingType: LISTING_FOR_SELLER[sellerType],
        ...extra,
      });
      res.status(201).json({ product: sellerDto(product) });
    } catch (err) {
      await deleteImagesByPath(images, req.user._id); // don't leave orphaned pictures behind
      throw err;
    }
  }),
);

router.patch(
  "/products/:slug",
  uploadLimiter,
  upload,
  wrap(async (req, res) => {
    const sellerType = req.user.seller.sellerType;
    const product = await Product.findOne({ slug: str(req.params.slug, "slug", { max: 200 }), seller: req.user._id });
    if (!product) throw new HttpError(404, "Product not found.");

    const fields = parseFields(req.body, { partial: true, sellerType });
    checkOldPrice(fields.price ?? product.price, fields.oldPrice ?? product.oldPrice);

    if (fields.categorySlug) {
      const category = await resolveCategory(fields.categorySlug);
      product.category = category.name;
      product.categorySlug = category.slug;
    }
    for (const key of ["name", "price", "oldPrice", "stock", "description", "shipping", "active", "condition", "negotiable", "unit", "minOrderQty", "leadTimeDays", "audience"]) {
      if (fields[key] !== undefined) product[key] = fields[key];
    }
    if (sellerType === "wholesale") {
      product.priceTiers = checkBulk({
        price: product.price,
        minOrderQty: product.minOrderQty,
        stock: product.stock,
        priceTiers: fields.priceTiers ?? product.priceTiers.map((t) => ({ minQty: t.minQty, price: t.price })),
      });
    }

    // New pictures replace the old set
    const files = req.files || [];
    if (files.length > 0) {
      const oldImages = [...product.images];
      const images = await saveImages(files, req.user._id);
      product.images = images;
      product.image = images[0];
      await product.save();
      await deleteImagesByPath(oldImages, req.user._id);
    } else {
      await product.save();
    }
    res.json({ product: sellerDto(product) });
  }),
);

// "Delete" hides the product from the shop (orders keep their own copy of the details)
router.delete(
  "/products/:slug",
  wrap(async (req, res) => {
    const product = await Product.findOneAndUpdate(
      { slug: str(req.params.slug, "slug", { max: 200 }), seller: req.user._id },
      { active: false },
    );
    if (!product) throw new HttpError(404, "Product not found.");
    res.json({ ok: true });
  }),
);

// Paid orders that include this seller's products, with what's needed to deliver
router.get(
  "/orders",
  wrap(async (req, res) => {
    const orders = await Order.find({ "items.seller": req.user._id, status: { $in: ["paid", "review"] } })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({
      items: orders.map((order) => {
        const mine = order.items.filter((item) => String(item.seller) === String(req.user._id));
        return {
          id: String(order._id),
          reference: order.reference,
          createdAt: order.createdAt,
          buyerType: order.buyerType,
          items: mine.map((i) => ({ id: i.slug, name: i.name, price: i.price, quantity: i.quantity, unit: i.unit || "piece" })),
          total: mine.reduce((sum, i) => sum + i.price * i.quantity, 0),
          customer: {
            fullName: order.customer.fullName,
            businessName: order.customer.businessName || "",
            phone: order.customer.phone,
            address: order.customer.address,
            city: order.customer.city,
            state: order.customer.state,
          },
        };
      }),
    });
  }),
);

export default router;

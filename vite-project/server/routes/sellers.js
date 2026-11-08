import { Router } from "express";
import { Product } from "../models/Product.js";
import { User, isSeller, toUserDto } from "../models/User.js";
import { HttpError, wrap } from "../lib/errors.js";
import { slugify } from "../lib/slug.js";
import { ValidationError, isPlainObject, phone, str } from "../lib/validate.js";
import { parseSellerBusiness, parseSellerType } from "../lib/profiles.js";
import { requireAuth, requireSeller } from "../middleware/auth.js";
import { writeLimiter } from "../middleware/security.js";

const router = Router();
const bodyOf = (req) => (isPlainObject(req.body) ? req.body : {});

// Turn the signed-in account into a seller (creates the store)
router.post(
  "/",
  writeLimiter,
  requireAuth,
  wrap(async (req, res) => {
    if (isSeller(req.user)) throw new HttpError(409, "You already have a store.");
    const body = bodyOf(req);

    const storeName = str(body.storeName, "storeName", { min: 3, max: 60 });
    const storeSlug = slugify(storeName);
    if (storeSlug.length < 3) throw new ValidationError("Use letters or numbers in the store name.", "storeName");
    // Stop ordinary accounts posing as the platform itself
    if (storeSlug.includes("marketfind") && req.user.role !== "admin") {
      throw new ValidationError("That store name isn't available.", "storeName");
    }

    const sellerType = parseSellerType(body);
    const business = parseSellerBusiness(sellerType, body);

    const seller = {
      sellerType,
      ...business,
      verified: false,
      storeName,
      storeSlug,
      description: str(body.description, "description", { optional: true, max: 500 }),
      phone: phone(body.phone),
      city: str(body.city, "city", { max: 80 }),
      state: str(body.state, "state", { max: 80 }),
      status: "active",
      createdAt: new Date(),
    };

    let user;
    try {
      user = await User.findOneAndUpdate(
        { _id: req.user._id, "seller.storeName": { $exists: false } },
        { $set: { seller } },
        { new: true },
      );
    } catch (err) {
      if (err.code === 11000) throw new HttpError(409, "That store name is already taken.", "storeName");
      throw err;
    }
    if (!user) throw new HttpError(409, "You already have a store.");
    res.status(201).json({ user: toUserDto(user) });
  }),
);

router.patch(
  "/me",
  writeLimiter,
  requireSeller,
  wrap(async (req, res) => {
    const body = bodyOf(req);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "seller.description": str(body.description, "description", { optional: true, max: 500 }),
          "seller.phone": phone(body.phone),
          "seller.city": str(body.city, "city", { max: 80 }),
          "seller.state": str(body.state, "state", { max: 80 }),
        },
      },
      { new: true },
    );
    res.json({ user: toUserDto(user) });
  }),
);

// Public store page details
router.get(
  "/:slug",
  wrap(async (req, res) => {
    const slug = str(req.params.slug, "slug", { max: 80 });
    const user = await User.findOne({ "seller.storeSlug": slug, "seller.status": "active" });
    if (!user) throw new HttpError(404, "Store not found.");
    const productCount = await Product.countDocuments({ seller: user._id, active: true });
    res.json({
      store: {
        name: user.seller.storeName,
        slug: user.seller.storeSlug,
        description: user.seller.description,
        sellerType: user.seller.sellerType,
        businessName: user.seller.businessName,
        verified: user.seller.verified,
        city: user.seller.city,
        state: user.seller.state,
        since: user.seller.createdAt,
        productCount,
      },
    });
  }),
);

export default router;

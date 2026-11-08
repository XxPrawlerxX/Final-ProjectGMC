import mongoose from "mongoose";
import { imageUrl } from "../lib/imageUrl.js";

const productSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true }, // used in URLs: /product/:slug
    name: { type: String, required: true, trim: true, maxlength: 200 },
    price: { type: Number, required: true, min: 0, validate: Number.isInteger }, // naira
    oldPrice: { type: Number, min: 0, default: 0 },
    image: { type: String, required: true }, // main picture (first of `images` when uploaded)
    images: { type: [String], default: [] }, // uploaded pictures, in display order
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    sellerName: { type: String, default: "" }, // copied from the store so lists need no extra lookup
    sellerSlug: { type: String, default: "", index: true },
    sellerType: { type: String, default: "" }, // retail | wholesale | individual (copied for lists)
    sellerVerified: { type: Boolean, default: false },
    location: { city: { type: String, default: "" }, state: { type: String, default: "" } },

    // What kind of listing this is. Decided by the seller's type, not chosen per product.
    listingType: { type: String, enum: ["retail", "bulk", "secondhand"], default: "retail", index: true },
    audience: { type: String, enum: ["everyone", "business"], default: "everyone" }, // bulk: who may buy

    // Bulk (wholesale) listings
    unit: { type: String, default: "piece" },
    minOrderQty: { type: Number, default: 1, min: 1 },
    priceTiers: { type: [{ _id: false, minQty: Number, price: Number }], default: [] },
    leadTimeDays: { type: Number, default: 0, min: 0 },

    // Second-hand (individual seller) listings
    condition: { type: String, enum: ["", "like-new", "good", "fair", "for-parts"], default: "" },
    negotiable: { type: Boolean, default: false },
    category: { type: String, required: true }, // display name
    categorySlug: { type: String, required: true, index: true },
    tag: { type: String, default: "" },
    shipping: { type: String, default: "Fast delivery" },
    description: { type: String, default: "", maxlength: 4000 },
    stock: { type: Number, default: 50, min: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    collections: { type: [String], default: [], index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ categorySlug: 1, price: 1 });

export const Product = mongoose.model("Product", productSchema);

// Shape sent to the browser. `id` is the slug so cart items and URLs stay simple.
export function toProductDto(p) {
  return {
    id: p.slug,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice || p.price,
    image: imageUrl(p.image),
    images: p.images?.length ? p.images.map(imageUrl) : [imageUrl(p.image)],
    seller: p.sellerSlug
      ? { name: p.sellerName, slug: p.sellerSlug, type: p.sellerType || "retail", verified: Boolean(p.sellerVerified) }
      : null,
    location: p.location?.city ? { city: p.location.city, state: p.location.state } : null,
    listingType: p.listingType || "retail",
    audience: p.audience || "everyone",
    unit: p.unit || "piece",
    minOrderQty: p.minOrderQty || 1,
    priceTiers: (p.priceTiers ?? []).map((t) => ({ minQty: t.minQty, price: t.price })),
    leadTimeDays: p.leadTimeDays || 0,
    condition: p.condition || "",
    negotiable: Boolean(p.negotiable),
    category: p.category,
    categorySlug: p.categorySlug,
    tag: p.tag || null,
    shipping: p.shipping,
    description: p.description,
    stock: p.stock,
    rating: p.ratingAvg,
    reviewCount: p.ratingCount,
  };
}

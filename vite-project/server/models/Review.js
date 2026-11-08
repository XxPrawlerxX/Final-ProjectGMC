import mongoose from "mongoose";
import { Product } from "./Product.js";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: String, required: true, index: true }, // product slug
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    title: { type: String, trim: true, maxlength: 100, default: "" },
    body: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true },
);

// One review per shopper per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);

// Keep the product's average rating in sync after any change
export async function refreshProductRating(slug) {
  const [stats] = await Review.aggregate([
    { $match: { product: slug } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { slug },
    {
      ratingAvg: stats ? Math.round(stats.avg * 10) / 10 : 0,
      ratingCount: stats ? stats.count : 0,
    },
  );
}

export function toReviewDto(r) {
  return {
    id: String(r._id),
    userName: r.userName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt,
  };
}

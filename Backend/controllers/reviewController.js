import mongoose from "mongoose";

import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// Recomputes a product's averageRating/numReviews from its ACTUAL
// reviews. Called after every create/update/delete rather than trying
// to increment/decrement a running total — a full recalculation is
// cheap here (reviews per product are never going to be huge) and
// can't drift out of sync the way an incremental counter could.
const recalculateProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats ? Math.round(stats.averageRating * 10) / 10 : 0,
    numReviews: stats ? stats.numReviews : 0,
  });
};

// GET /api/reviews/product/:productId — public.
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch reviews",
    });
  }
};

// POST /api/reviews
// Body: { productId, rating, comment }
// Customer-only. Only allowed for a product the customer actually
// bought AND received — never trust a claimed purchase from the client,
// we look it up ourselves from real Order data.
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "A valid productId is required",
      });
    }

    const ratingNumber = Number(rating);

    if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json({
        message: "Rating must be a whole number from 1 to 5",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Verified purchase check: a paid order containing this product,
    // with this specific item actually delivered.
    const verifiedOrder = await Order.findOne({
      user: req.user._id,
      paymentStatus: "paid",
      items: { $elemMatch: { product: productId, itemStatus: "delivered" } },
    });

    if (!verifiedOrder) {
      return res.status(403).json({
        message: "You can only review products you've purchased and received",
      });
    }

    const existingReview = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You've already reviewed this product. Edit your existing review instead.",
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: verifiedOrder._id,
      rating: ratingNumber,
      comment: comment || "",
    });

    await recalculateProductRating(productId);

    const populatedReview = await review.populate("user", "name");

    res.status(201).json(populatedReview);
  } catch (error) {
    // A duplicate-key error here means the unique index caught a race
    // (two near-simultaneous submits) that the findOne check above
    // missed — same friendly message either way.
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You've already reviewed this product. Edit your existing review instead.",
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Failed to create review",
    });
  }
};

// PUT /api/reviews/:id — customer, own review only.
export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    if (rating !== undefined) {
      const ratingNumber = Number(rating);

      if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
        return res.status(400).json({
          message: "Rating must be a whole number from 1 to 5",
        });
      }

      review.rating = ratingNumber;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();
    await recalculateProductRating(review.product);

    const populatedReview = await review.populate("user", "name");

    res.json(populatedReview);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update review",
    });
  }
};

// DELETE /api/reviews/:id — the review's own author, or an admin.
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    const isOwner = review.user.toString() === req.user._id.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You can only delete your own review",
      });
    }

    const productId = review.product;

    await review.deleteOne();
    await recalculateProductRating(productId);

    res.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete review",
    });
  }
};

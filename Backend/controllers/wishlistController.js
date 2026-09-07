import mongoose from "mongoose";

import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// Same atomic get-or-create pattern used for Cart — findOneAndUpdate
// with upsert means two simultaneous first-requests can't create two
// wishlists for the same user.
const getOrCreateWishlist = async (userId) => {
  return Wishlist.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, products: [] } },
    { new: true, upsert: true },
  );
};

// Populates the product list and drops any product that's since been
// deleted (a vendor could remove a product that's sitting in someone's
// wishlist) — same self-healing approach used for Cart.
const formatWishlistResponse = async (wishlist) => {
  await wishlist.populate({
    path: "products",
    select: "name price image stock category isActive",
    populate: { path: "vendor", select: "storeName" },
  });

  const validProducts = wishlist.products.filter(Boolean);

  if (validProducts.length !== wishlist.products.length) {
    wishlist.products = validProducts;
    await wishlist.save();
  }

  return {
    _id: wishlist._id,
    products: wishlist.products,
  };
};

// GET /api/wishlist
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);

    res.json(await formatWishlistResponse(wishlist));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch wishlist",
    });
  }
};

// POST /api/wishlist
// Body: { "productId": "..." }
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "productId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // $addToSet makes this naturally idempotent — adding an
    // already-wishlisted product is a harmless no-op, not a duplicate.
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      {
        $setOnInsert: { user: req.user._id },
        $addToSet: { products: productId },
      },
      { new: true, upsert: true },
    );

    res.status(200).json(await formatWishlistResponse(wishlist));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add product to wishlist",
    });
  }
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const wishlist = await getOrCreateWishlist(req.user._id);

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId,
    );

    await wishlist.save();

    res.json(await formatWishlistResponse(wishlist));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to remove product from wishlist",
    });
  }
};

// DELETE /api/wishlist
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);

    wishlist.products = [];
    await wishlist.save();

    res.json(await formatWishlistResponse(wishlist));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to clear wishlist",
    });
  }
};

import mongoose from "mongoose";

import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Finds the logged-in customer's cart, creating an empty one the first
// time they use it. findOneAndUpdate + upsert is atomic, so two requests
// arriving at the same instant can't accidentally create two carts for
// the same user.
const getOrCreateCart = async (userId) => {
  return Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { new: true, upsert: true },
  );
};

// Populates each cart item with live product info (and, through the
// product, its vendor/category), drops any items whose product has
// since been deleted, and calculates subtotal/totalItems from CURRENT
// prices. This is the single place that shapes what the client sees,
// so every endpoint returns the cart in exactly the same format.
const formatCartResponse = async (cart) => {
  await cart.populate({
    path: "items.product",
    select: "name price image stock vendor category isActive",
    populate: [
      { path: "vendor", select: "storeName" },
      { path: "category", select: "name slug" },
    ],
  });

  // Self-heal: a product referenced in the cart may have been deleted
  // by its vendor since it was added. Drop those items instead of
  // crashing or returning broken data.
  const validItems = cart.items.filter((item) => item.product);

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  const items = cart.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
    lineTotal: item.product.price * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    items,
    subtotal,
    totalItems,
  };
};

// GET /api/cart
// Returns the logged-in customer's own cart (creating one if needed).
export const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);

    res.json(await formatCartResponse(cart));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch cart",
    });
  }
};

// POST /api/cart
// Body: { "productId": "...", "quantity": 2 }
// Adds a product to the cart. If it's already in the cart, the new
// quantity is ADDED to the existing quantity instead of creating a
// duplicate line item.
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({
        message: "productId and quantity are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        message: "Quantity must be a whole number of at least 1",
      });
    }

    // Look up the REAL product from the database — we never trust
    // stock, price, or existence claims from the frontend.
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        message: "This product is not currently available",
      });
    }

    const cart = await getOrCreateCart(req.user._id);

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newQuantity = currentQuantity + requestedQuantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} unit(s) of this product are available in stock`,
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity: requestedQuantity });
    }

    await cart.save();

    res.status(200).json(await formatCartResponse(cart));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add product to cart",
    });
  }
};

// PUT /api/cart/:productId
// Body: { "quantity": 3 }
// Sets the quantity of a product ALREADY in the cart to an exact value
// (unlike POST, which adds to the existing quantity).
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        message: "Quantity must be a whole number of at least 1",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (requestedQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} unit(s) of this product are available in stock`,
      });
    }

    const cart = await getOrCreateCart(req.user._id);

    const item = cart.items.find(
      (cartItem) => cartItem.product.toString() === productId,
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    item.quantity = requestedQuantity;

    await cart.save();

    res.json(await formatCartResponse(cart));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update cart item",
    });
  }
};

// DELETE /api/cart/:productId
// Removes one product from the cart entirely.
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product id",
      });
    }

    const cart = await getOrCreateCart(req.user._id);

    const itemExists = cart.items.some(
      (item) => item.product.toString() === productId,
    );

    if (!itemExists) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );

    await cart.save();

    res.json(await formatCartResponse(cart));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to remove product from cart",
    });
  }
};

// DELETE /api/cart
// Empties the entire cart.
export const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);

    cart.items = [];

    await cart.save();

    res.json(await formatCartResponse(cart));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to clear cart",
    });
  }
};

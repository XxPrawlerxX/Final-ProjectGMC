import mongoose from "mongoose";
import crypto from "crypto";

// Generates a stable, human-shareable order reference like "MKT-9F3A2B7C1D".
// This is separate from Mongo's internal _id so we have a clean, stable
// identifier ready to hand to Paystack (and to show customers) later.
const generateOrderNumber = () =>
  `MKT-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

// One line item inside an order. Unlike a Cart item, this is a SNAPSHOT:
// once the order is created, productName/price/image never change again,
// even if the underlying Product is later edited, deleted, or repriced.
// This is what lets us truthfully show a customer what they actually
// paid, months after the fact.
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  // We snapshot the vendor too, so that even if a Product's vendor
  // somehow changed later, this order item still correctly shows who
  // the sale belonged to at the time of purchase.
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },

  productName: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  image: {
    type: String,
    required: true,
  },

  // Per-item fulfillment state. This exists SEPARATELY from the order's
  // overall orderStatus because one customer order can contain products
  // from multiple vendors — Vendor A finishing their item doesn't mean
  // Vendor B has finished theirs. The order's orderStatus is derived
  // from these (see deriveOrderStatus in orderController.js), it is
  // never set directly by a vendor.
  itemStatus: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
});

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // A stable, human-shareable reference distinct from Mongo's _id.
    // This is what we'll eventually pass to Paystack as the transaction
    // reference, and what a customer/support agent can quote out loud.
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      default: generateOrderNumber,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // These are calculated on the SERVER at order creation time from the
    // items above. They are never accepted from the request body.
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Whether the customer has actually paid. Kept separate from
    // orderStatus because a "paid" order can still be pending/shipped/etc.
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // Where the order is in fulfillment. Independent of payment.
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;

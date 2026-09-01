import mongoose from "mongoose";

// One item inside a cart: which product, and how many units.
// We deliberately do NOT store price/name/vendor here — those live on
// the Product document and can change over time. The cart always reads
// the CURRENT product info when it's fetched, so prices never go stale.
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }, // items are identified by product id, so no extra _id needed
);

const cartSchema = new mongoose.Schema(
  {
    // Each customer has exactly ONE cart. "unique" enforces that at the
    // database level so we can never accidentally create two carts for
    // the same user.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [cartItemSchema],
  },
  {
    timestamps: true,
  },
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;

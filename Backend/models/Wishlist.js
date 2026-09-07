import mongoose from "mongoose";

// Much simpler than Cart on purpose: a wishlist has no quantity, no
// stock validation, no price snapshot — it's just "products this
// customer wants to remember", so it's a flat list of product refs.
const wishlistSchema = new mongoose.Schema(
  {
    // One wishlist per customer, same pattern as Cart.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;

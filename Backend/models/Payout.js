import mongoose from "mongoose";

// A record of one payout batch to one vendor. This app does NOT move
// real money — an admin sends the vendor their money manually (bank
// transfer, etc.) outside the app, then records it here. This is the
// audit trail of "what we told an admin they owed, and when they
// marked it paid" — not a payment processor.
const payoutSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    // Total amount paid out in this batch, in naira, AFTER the platform
    // commission has already been deducted — this is what the vendor
    // actually received (or should have).
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Which specific order items this batch covered, for traceability
    // — lets us answer "was this item ever paid out, and when/in which
    // batch" without re-deriving it from scratch.
    items: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          required: true,
        },
        orderItemId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
      },
    ],

    // Which admin recorded this payout.
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Payout = mongoose.model("Payout", payoutSchema);

export default Payout;

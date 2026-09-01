import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Our own reference sent to Paystack at initialize time. Distinct
    // from Order.orderNumber because a customer can make MULTIPLE
    // payment attempts for the same order (e.g. a failed/abandoned
    // attempt followed by a retry) — each attempt gets its own Payment
    // record and its own unique reference.
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    // Paystack's own numeric transaction id, filled in once verified.
    paystackTransactionId: {
      type: Number,
    },

    // Stored in KOBO (Paystack's subunit), NOT naira. This is the exact
    // same unit Paystack itself reports back in verify/webhook payloads,
    // so we can compare amounts directly with no repeated conversion.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "abandoned", "reversed"],
      default: "pending",
    },

    channel: {
      type: String,
      default: "",
    },

    gatewayResponse: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
    },

    // Small bag of extra context (order number, customer id, etc.) sent
    // to Paystack and/or echoed back — not used for any security check,
    // purely informational.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

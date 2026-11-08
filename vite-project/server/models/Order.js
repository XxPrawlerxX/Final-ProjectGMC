import mongoose from "mongoose";
import { imageUrl } from "../lib/imageUrl.js";

const orderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    customer: {
      fullName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      businessName: String, // set when a business account is buying (for the invoice)
    },
    buyerType: { type: String, enum: ["guest", "individual", "business"], default: "guest" },
    // Snapshot of what was bought and at what price
    items: [
      {
        _id: false,
        slug: String,
        name: String,
        image: String,
        seller: { type: mongoose.Schema.Types.ObjectId, default: null },
        unit: String,
        listingType: String,
        price: Number, // the unit price that was charged (bulk price breaks already applied)
        quantity: Number,
      },
    ],
    subtotal: Number,
    deliveryFee: Number,
    total: Number, // naira
    // pending -> paid | failed.  "review" = paid but stock ran out, needs a human.
    status: { type: String, enum: ["pending", "paid", "failed", "review"], default: "pending" },
    paidAt: Date,
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);

export function toOrderDto(o) {
  return {
    id: String(o._id),
    reference: o.reference,
    status: o.status,
    items: o.items.map((i) => ({
      id: i.slug,
      name: i.name,
      image: imageUrl(i.image),
      price: i.price,
      unit: i.unit || "piece",
      listingType: i.listingType || "retail",
      quantity: i.quantity,
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    customer: o.customer,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
  };
}

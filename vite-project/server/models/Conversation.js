import mongoose from "mongoose";
import { imageUrl } from "../lib/imageUrl.js";

// One chat per buyer per product, between that buyer and the product's seller.
const conversationSchema = new mongoose.Schema(
  {
    product: { type: String, required: true }, // product slug
    productName: { type: String, required: true },
    productImage: { type: String, default: "" },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyerName: { type: String, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sellerName: { type: String, required: true }, // store name
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: "" },
    unreadBuyer: { type: Number, default: 0 },
    unreadSeller: { type: Number, default: 0 },
    lastSellerEmailAt: { type: Date, default: null }, // to avoid flooding a seller with alerts
  },
  { timestamps: true },
);

conversationSchema.index({ product: 1, buyer: 1 }, { unique: true });
conversationSchema.index({ buyer: 1, lastMessageAt: -1 });
conversationSchema.index({ seller: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);

// What each side sees in their inbox
export function toConversationDto(c, viewerId) {
  const isBuyer = String(c.buyer) === String(viewerId);
  return {
    id: String(c._id),
    role: isBuyer ? "buyer" : "seller",
    productId: c.product,
    productName: c.productName,
    productImage: imageUrl(c.productImage),
    with: isBuyer ? c.sellerName : c.buyerName,
    lastMessageAt: c.lastMessageAt,
    preview: c.lastMessagePreview,
    unread: isBuyer ? c.unreadBuyer : c.unreadSeller,
  };
}

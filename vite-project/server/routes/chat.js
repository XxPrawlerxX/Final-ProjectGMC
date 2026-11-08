// Buyer <-> seller chat about a product. Replies also go to the other person's email.
import { Router } from "express";
import mongoose from "mongoose";
import { config } from "../config.js";
import { Conversation, toConversationDto } from "../models/Conversation.js";
import { Message, toMessageDto } from "../models/Message.js";
import { Product } from "../models/Product.js";
import { User, isSeller } from "../models/User.js";
import { HttpError, wrap } from "../lib/errors.js";
import { buyerMessageEmail, sellerReplyEmail } from "../lib/emailTemplates.js";
import { sendMail } from "../lib/mailer.js";
import { isPlainObject, str } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/security.js";

const router = Router();
router.use(requireAuth);

const SELLER_ALERT_GAP_MS = 5 * 60 * 1000; // at most one "new message" email per chat per 5 minutes
const sameId = (a, b) => String(a) === String(b);

async function loadConversation(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, "Conversation not found.");
  const conversation = await Conversation.findById(req.params.id);
  // Strangers get "not found", never "forbidden", so ids can't be probed
  if (!conversation || ![conversation.buyer, conversation.seller].some((id) => sameId(id, req.user._id))) {
    throw new HttpError(404, "Conversation not found.");
  }
  return conversation;
}

// Emails the person on the other side. Runs in the background; returns the outcome.
async function emailRecipient({ conversation, role, recipient, body }) {
  const link = `${config.clientOrigin}/messages/${conversation._id}`;
  if (role === "seller") {
    const mail = sellerReplyEmail({
      storeName: conversation.sellerName,
      productName: conversation.productName,
      body,
      link,
    });
    return sendMail({ to: recipient.email, ...mail });
  }

  const last = conversation.lastSellerEmailAt?.getTime() ?? 0;
  if (Date.now() - last < SELLER_ALERT_GAP_MS) return "skipped";
  await Conversation.updateOne({ _id: conversation._id }, { lastSellerEmailAt: new Date() });
  const mail = buyerMessageEmail({
    buyerName: conversation.buyerName,
    productName: conversation.productName,
    body,
    link,
  });
  return sendMail({ to: recipient.email, ...mail });
}

async function postMessage(conversation, user, body) {
  const role = sameId(user._id, conversation.buyer) ? "buyer" : "seller";
  const recipient = await User.findById(role === "buyer" ? conversation.seller : conversation.buyer);
  const emailOff = !recipient || recipient.notifyByEmail === false;

  const message = await Message.create({
    conversation: conversation._id,
    sender: user._id,
    senderRole: role,
    body,
    emailStatus: emailOff ? "off" : "pending",
  });
  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: { lastMessageAt: message.createdAt, lastMessagePreview: body.slice(0, 120) },
      $inc: { [role === "buyer" ? "unreadSeller" : "unreadBuyer"]: 1 },
    },
  );

  if (!emailOff) {
    emailRecipient({ conversation, role, recipient, body })
      .then((status) => Message.updateOne({ _id: message._id }, { emailStatus: status }))
      .catch((err) => console.error("Chat email error:", err.message));
  }
  return message;
}

const bodyOf = (req) => (isPlainObject(req.body) ? req.body : {});

// Red-dot count for the header
router.get(
  "/unread",
  wrap(async (req, res) => {
    const [row] = await Conversation.aggregate([
      { $match: { $or: [{ buyer: req.user._id }, { seller: req.user._id }] } },
      {
        $group: {
          _id: null,
          count: { $sum: { $cond: [{ $eq: ["$buyer", req.user._id] }, "$unreadBuyer", "$unreadSeller"] } },
        },
      },
    ]);
    res.json({ count: row?.count ?? 0 });
  }),
);

router.get(
  "/conversations",
  wrap(async (req, res) => {
    const items = await Conversation.find({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] })
      .sort({ lastMessageAt: -1 })
      .limit(100);
    res.json({ items: items.map((c) => toConversationDto(c, req.user._id)) });
  }),
);

// Does this shopper already have a chat about this product?
router.get(
  "/conversations/for-product/:slug",
  wrap(async (req, res) => {
    const conversation = await Conversation.findOne({
      product: str(req.params.slug, "slug", { max: 200 }),
      buyer: req.user._id,
    });
    res.json({ conversation: conversation ? toConversationDto(conversation, req.user._id) : null });
  }),
);

// Buyer starts (or continues) a chat from a product page
router.post(
  "/conversations",
  chatLimiter,
  wrap(async (req, res) => {
    const body = bodyOf(req);
    const slug = str(body.productId, "productId", { max: 200 });
    const text = str(body.message, "message", { max: 2000 });

    const product = await Product.findOne({ slug, active: true });
    if (!product) throw new HttpError(404, "Product not found.");
    if (!product.seller) throw new HttpError(400, "This item is sold by Marketfind directly, so chat isn't available.");
    if (sameId(product.seller, req.user._id)) throw new HttpError(400, "This is your own product.");

    const seller = await User.findById(product.seller);
    if (!isSeller(seller) || seller.seller.status !== "active") {
      throw new HttpError(404, "This seller is not available right now.");
    }

    const conversation = await Conversation.findOneAndUpdate(
      { product: slug, buyer: req.user._id },
      {
        $setOnInsert: {
          productName: product.name,
          productImage: product.image,
          buyerName: req.user.name,
          seller: seller._id,
          sellerName: seller.seller.storeName,
          lastMessageAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    const message = await postMessage(conversation, req.user, text);
    res.status(201).json({ conversation: toConversationDto(conversation, req.user._id), message: toMessageDto(message) });
  }),
);

// Messages (all, or only those after ?after=<last message id>). Opening a chat marks it read.
router.get(
  "/conversations/:id/messages",
  wrap(async (req, res) => {
    const conversation = await loadConversation(req);
    const filter = { conversation: conversation._id };
    if (req.query.after !== undefined) {
      if (!mongoose.isValidObjectId(req.query.after)) throw new HttpError(400, "Invalid cursor.");
      filter._id = { $gt: req.query.after };
    }
    const messages = await Message.find(filter).sort({ _id: 1 }).limit(200);

    const unreadField = sameId(conversation.buyer, req.user._id) ? "unreadBuyer" : "unreadSeller";
    if (conversation[unreadField] > 0) {
      await Conversation.updateOne({ _id: conversation._id }, { [unreadField]: 0 });
    }
    res.json({
      conversation: toConversationDto(conversation, req.user._id),
      messages: messages.map(toMessageDto),
    });
  }),
);

router.post(
  "/conversations/:id/messages",
  chatLimiter,
  wrap(async (req, res) => {
    const conversation = await loadConversation(req);
    const text = str(bodyOf(req).message, "message", { max: 2000 });
    const message = await postMessage(conversation, req.user, text);
    res.status(201).json({ message: toMessageDto(message) });
  }),
);

export default router;

import { Router } from "express";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";
import { Order, toOrderDto } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { HttpError, wrap } from "../lib/errors.js";
import { paystack } from "../lib/paystack.js";
import { ValidationError, email, int, isPlainObject, phone, str } from "../lib/validate.js";
import { paymentLimiter } from "../middleware/security.js";
import { unitPriceFor } from "../../shared/pricing.js";
import { isBusinessBuyer } from "../lib/access.js";

const router = Router();

function parseCustomer(input) {
  if (!isPlainObject(input)) throw new ValidationError("Delivery details are required.", "customer");
  return {
    fullName: str(input.fullName, "fullName", { min: 2, max: 100 }),
    email: email(input.email),
    phone: phone(input.phone),
    address: str(input.address, "address", { min: 5, max: 300 }),
    city: str(input.city, "city", { max: 80 }),
    state: str(input.state, "state", { max: 80 }),
    businessName: str(input.businessName, "businessName", { optional: true, max: 100 }),
  };
}

// [{ id, quantity }] -> merged list, with every value checked
function parseItems(input) {
  if (!Array.isArray(input) || input.length === 0 || input.length > 50) {
    throw new ValidationError("Your cart is empty.", "items");
  }
  const merged = new Map();
  for (const raw of input) {
    if (!isPlainObject(raw)) throw new ValidationError("Invalid cart.", "items");
    const id = str(raw.id, "items", { max: 200 });
    const quantity = int(raw.quantity, "items", { min: 1, max: 100_000 });
    merged.set(id, Math.min((merged.get(id) || 0) + quantity, 100_000));
  }
  return [...merged].map(([id, quantity]) => ({ id, quantity }));
}

// Marks an order paid exactly once (the verify call and the webhook can both
// arrive), then takes the stock. Safe to call repeatedly.
export async function fulfillOrder(reference) {
  const order = await Order.findOneAndUpdate(
    { reference, status: "pending" },
    { status: "paid", paidAt: new Date() },
    { new: true },
  );
  if (!order) return Order.findOne({ reference }); // already handled

  let shortOnStock = false;
  for (const item of order.items) {
    const result = await Product.updateOne(
      { slug: item.slug, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
    );
    if (result.modifiedCount === 0) shortOnStock = true;
  }
  if (shortOnStock) {
    // Customer has paid but stock ran out in the meantime: flag it for a human
    order.status = "review";
    await order.save();
    console.warn(`Order ${reference} paid but some items were out of stock - needs review`);
  }
  return order;
}

router.post(
  "/initialize",
  paymentLimiter,
  wrap(async (req, res) => {
    const body = isPlainObject(req.body) ? req.body : {};
    const customer = parseCustomer(body.customer);
    const items = parseItems(body.items);

    // Prices and stock come from the database, never from the browser
    const products = await Product.find({ slug: { $in: items.map((i) => i.id) }, active: true });
    const bySlug = new Map(products.map((p) => [p.slug, p]));

    const lines = items.map(({ id, quantity }) => {
      const product = bySlug.get(id);
      if (!product) throw new HttpError(409, "An item in your cart is no longer available.");
      if (product.audience === "business" && !isBusinessBuyer(req.user)) {
        throw new HttpError(403, `${product.name} is for business accounts only. Sign in with a business account to order it.`);
      }
      if (quantity < (product.minOrderQty || 1)) {
        throw new HttpError(409, `The minimum order for ${product.name} is ${product.minOrderQty} ${product.unit}.`);
      }
      if (product.stock < quantity) {
        throw new HttpError(
          409,
          product.stock === 0
            ? `${product.name} is out of stock.`
            : `Only ${product.stock} of ${product.name} left in stock.`,
        );
      }
      return {
        slug: product.slug,
        name: product.name,
        image: product.image,
        seller: product.seller || null,
        unit: product.unit || "piece",
        listingType: product.listingType || "retail",
        // bulk price breaks are applied here, on the server, from the quantity ordered
        price: unitPriceFor(product, quantity),
        quantity,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const total = subtotal + config.deliveryFee;
    const reference = `MF-${randomBytes(12).toString("hex")}`; // unguessable

    const order = await Order.create({
      reference,
      user: req.user?._id ?? null,
      customer,
      buyerType: req.user ? (req.user.buyer?.kind ?? "individual") : "guest",
      items: lines,
      subtotal,
      deliveryFee: config.deliveryFee,
      total,
    });

    try {
      const data = await paystack("/transaction/initialize", {
        method: "POST",
        body: {
          email: customer.email,
          amount: total * 100, // kobo
          currency: "NGN",
          reference,
          metadata: { orderId: String(order._id) },
        },
      });
      res.json({ access_code: data.access_code, reference, amount: total });
    } catch (err) {
      await Order.updateOne({ _id: order._id }, { status: "failed" });
      throw err;
    }
  }),
);

router.post(
  "/verify",
  paymentLimiter,
  wrap(async (req, res) => {
    const reference = str(isPlainObject(req.body) ? req.body.reference : undefined, "reference", { max: 100 });
    let order = await Order.findOne({ reference });
    if (!order) throw new HttpError(404, "We don't have an order with that reference.");

    if (order.status === "pending") {
      const data = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
      if (data.status !== "success") return res.json({ status: data.status || "failed" });
      // Money really moved, but make sure it's the right amount
      if (data.currency !== "NGN" || data.amount !== order.total * 100) {
        console.error(`Order ${reference}: paid amount ${data.amount} != expected ${order.total * 100}`);
        return res.json({ status: "mismatch" });
      }
      order = await fulfillOrder(reference);
    }

    if (order.status === "paid" || order.status === "review") {
      return res.json({ status: "paid", order: toOrderDto(order) });
    }
    res.json({ status: order.status });
  }),
);

// Paystack calls this itself, so orders still complete if the customer closes
// the tab after paying. The signature proves the call really came from Paystack.
router.post(
  "/webhook",
  wrap(async (req, res) => {
    const signature = req.get("x-paystack-signature");
    if (!req.rawBody || typeof signature !== "string") return res.sendStatus(401);

    const expected = createHmac("sha512", config.paystackSecret).update(req.rawBody).digest("hex");
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return res.sendStatus(401);

    const event = req.body;
    if (event?.event === "charge.success" && typeof event.data?.reference === "string") {
      const order = await Order.findOne({ reference: event.data.reference });
      if (
        order &&
        event.data.status === "success" &&
        event.data.currency === "NGN" &&
        event.data.amount === order.total * 100
      ) {
        await fulfillOrder(order.reference);
      }
    }
    res.sendStatus(200);
  }),
);

export default router;

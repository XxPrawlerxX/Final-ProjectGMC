// Minimal payment server. Run with: npm run server
//
// Why this exists: the browser must never decide what an order costs or
// whether it was paid. So the server (1) works out the total from the product
// catalog, (2) asks Paystack to create the transaction, and (3) after the
// customer pays, asks Paystack directly whether it really succeeded.
import http from "node:http";
import { randomBytes } from "node:crypto";
import { DELIVERY_FEE, getProduct } from "../src/catalog.js";

const PORT = process.env.PORT || 8787;
const SECRET = process.env.PAYSTACK_SECRET_KEY;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const PAYSTACK = "https://api.paystack.co";

if (!SECRET) {
  console.error("Missing PAYSTACK_SECRET_KEY. Copy .env.example to .env first.");
  process.exit(1);
}

// reference -> order. In-memory for now: it is lost when the server restarts.
// Swap for a database before going live.
const orders = new Map();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 50_000) reject(new HttpError(413, "Request too large."));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new HttpError(400, "Invalid JSON."));
      }
    });
  });
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function paystack(path, options = {}) {
  const response = await fetch(`${PAYSTACK}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.status === false) {
    throw new HttpError(502, body.message || "Paystack request failed.");
  }
  return body.data;
}

function cleanCustomer(input = {}) {
  const customer = {};
  for (const key of ["fullName", "email", "phone", "address", "city", "state"]) {
    customer[key] = String(input[key] ?? "").trim().slice(0, 300);
  }
  if (!customer.fullName || !/^\S+@\S+\.\S+$/.test(customer.email)) {
    throw new HttpError(400, "A name and valid email are required.");
  }
  if (!customer.address || !customer.city || !customer.state || !customer.phone) {
    throw new HttpError(400, "Please complete your delivery details.");
  }
  return customer;
}

// Prices come from OUR catalog, never from the request.
function buildOrder(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
    throw new HttpError(400, "Your cart is empty.");
  }
  const items = rawItems.map(({ id, quantity }) => {
    const product = getProduct(id);
    if (!product) throw new HttpError(400, "An item in your cart is no longer available.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new HttpError(400, "Invalid quantity.");
    }
    return { id: product.id, name: product.name, price: product.price, quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { items, subtotal, deliveryFee: DELIVERY_FEE, total: subtotal + DELIVERY_FEE };
}

async function initialize(req, res) {
  const body = await readJson(req);
  const customer = cleanCustomer(body.customer);
  const order = buildOrder(body.items);
  const reference = `MF-${Date.now()}-${randomBytes(3).toString("hex")}`;

  const data = await paystack("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: customer.email,
      amount: order.total * 100, // Paystack wants kobo
      currency: "NGN",
      reference,
      metadata: { customer, items: order.items },
    }),
  });

  orders.set(reference, { ...order, reference, customer, status: "pending" });
  send(res, 200, { access_code: data.access_code, reference, amount: order.total });
}

async function verify(req, res) {
  const { reference } = await readJson(req);
  const order = orders.get(reference);
  if (!order) throw new HttpError(404, "We don't have an order with that reference.");

  if (order.status !== "paid") {
    const data = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
    const genuine =
      data.status === "success" &&
      data.currency === "NGN" &&
      data.amount === order.total * 100;

    if (!genuine) {
      return send(res, 200, { status: data.status === "success" ? "mismatch" : data.status });
    }
    order.status = "paid";
    // TODO: save the order to a database, email the customer, notify fulfilment.
    console.log(`Order ${reference} paid: ${order.total} NGN`);
  }

  send(res, 200, { status: "paid", order });
}

const routes = {
  "POST /api/payments/initialize": initialize,
  "POST /api/payments/verify": verify,
};

http
  .createServer(async (req, res) => {
    if (CLIENT_ORIGIN) {
      res.setHeader("Access-Control-Allow-Origin", CLIENT_ORIGIN);
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    }
    if (req.method === "OPTIONS") return send(res, 204, {});

    const handler = routes[`${req.method} ${req.url.split("?")[0]}`];
    if (!handler) return send(res, 404, { error: "Not found." });

    try {
      await handler(req, res);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      send(res, status, {
        error: status === 500 ? "Something went wrong on our side." : err.message,
      });
    }
  })
  .listen(PORT, () => console.log(`Payment server on http://localhost:${PORT}`));

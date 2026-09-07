import crypto from "crypto";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import {
  initializeTransaction,
  verifyTransaction,
} from "../services/paystackService.js";
import { expireOrder } from "../services/orderExpiryService.js";

// Generates a unique reference for ONE payment attempt. We tie it to the
// order's own reference for easy tracing in the Paystack dashboard, plus
// a random suffix so a customer can retry payment on the same order
// (e.g. after an abandoned attempt) without a reference collision.
const generatePaymentReference = (orderNumber) => {
  const orderTag = orderNumber.replace("MKT-", "");
  const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `PAY-${orderTag}-${randomSuffix}`;
};

// Order.totalAmount is stored in NAIRA (whole currency unit). Paystack
// requires amounts in KOBO (₦1 = 100 kobo). Math.round guards against
// floating-point drift (e.g. 30.1 * 100 can come out as 3009.999999...
// in JS) turning into an off-by-one-kobo mismatch later during verify.
const toKobo = (nairaAmount) => Math.round(nairaAmount * 100);

// POST /api/payments/initialize/:orderId
// Starts a Paystack transaction for one of the LOGGED-IN customer's own
// orders. The amount charged is always read from Order.totalAmount in
// MongoDB — nothing in the request body is ever used for the amount.
export const initializePayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    // Scoping the lookup to { _id, user: req.user._id } together means a
    // request for someone else's order simply finds nothing — same
    // pattern already used by getMyOrderById in orderController.js.
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // The order's stock reservation has a deadline (see
    // PAYMENT_RESERVATION_MINUTES in orderController.js). If it's
    // passed but the background sweep hasn't gotten to it yet, release
    // it right now rather than making the customer wait for that sweep
    // — and rather than letting them pay for stock that's about to be
    // (or already was) given back to other customers.
    if (
      order.paymentStatus === "pending" &&
      order.orderStatus !== "cancelled" &&
      order.paymentExpiresAt &&
      order.paymentExpiresAt < new Date()
    ) {
      await expireOrder(order._id);

      return res.status(400).json({
        message: "This order has expired because payment wasn't completed in time.",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This order has already been paid for",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        message: "Cannot pay for a cancelled order",
      });
    }

    // Deliberately NOT reading req.body.amount anywhere above this line
    // or below it — the amount charged can only ever come from here.
    const amountInKobo = toKobo(order.totalAmount);
    const reference = generatePaymentReference(order.orderNumber);

    // Record the attempt BEFORE calling Paystack, as "pending". If the
    // Paystack call itself fails, this stays a harmless pending row —
    // it never gets marked successful except by our own verify/webhook
    // logic after Paystack confirms it.
    const payment = await Payment.create({
      order: order._id,
      customer: req.user._id,
      reference,
      amount: amountInKobo,
      currency: "NGN",
      status: "pending",
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
    });

    // Where Paystack sends the customer's browser back to after checkout.
    // Without this, Paystack falls back to whatever (if anything) is
    // configured in the dashboard, which breaks local development. The
    // frontend route itself reads ?reference= from the URL and calls
    // verifyPayment below — Paystack redirecting here is NOT treated as
    // proof of payment by itself.
    // FRONTEND_URL may list multiple comma-separated origins (see the CORS
    // setup in server.js) — Paystack only needs one to redirect back to.
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5180")
      .split(",")[0]
      .trim();
    const callbackUrl = `${frontendUrl}/payment/callback`;

    const paystackResponse = await initializeTransaction({
      email: req.user.email,
      amount: amountInKobo,
      reference,
      callback_url: callbackUrl,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerId: req.user._id.toString(),
      },
    });

    payment.gatewayResponse = paystackResponse.message || "";
    await payment.save();

    // Only ever return the safe fields Paystack gives us for the
    // frontend to redirect/embed the checkout with — never our secret
    // key, never internal Payment/Order document fields.
    res.status(200).json({
      message: "Payment initialized successfully",
      data: {
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        reference: paystackResponse.data.reference,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to initialize payment",
    });
  }
};

// GET /api/payments/verify/:reference
// Called by the frontend after the customer returns from Paystack's
// checkout, to find out whether the payment actually succeeded. We
// NEVER trust the frontend's own claim of success — we ask Paystack.
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const payment = await Payment.findOne({ reference });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot access this payment",
      });
    }

    // Idempotency: if we already confirmed this succeeded (via an
    // earlier verify call OR the webhook beating us to it), don't call
    // Paystack again or repeat the Order update — just report the
    // already-settled state.
    if (payment.status === "success") {
      return res.json({
        message: "Payment already verified",
        data: {
          reference: payment.reference,
          status: payment.status,
          paidAt: payment.paidAt,
        },
      });
    }

    const paystackResponse = await verifyTransaction(reference);
    const transaction = paystackResponse.data;

    // Every one of these must hold before we treat the payment as real:
    // Paystack says the API call itself succeeded, the transaction
    // status is "success" (not pending/failed/abandoned/etc.), the
    // reference matches (defends against a mixed-up lookup), and the
    // amount matches what WE charged (defends against any tampering).
    const isConfirmedSuccess =
      paystackResponse.status === true &&
      transaction.status === "success" &&
      transaction.reference === payment.reference &&
      transaction.amount === payment.amount;

    if (!isConfirmedSuccess) {
      // Reflect Paystack's real status (failed/abandoned) without ever
      // claiming success. "pending"/"ongoing"/"processing" stay as-is
      // on our side too, since the transaction may still complete.
      if (transaction.status === "failed" || transaction.status === "abandoned") {
        payment.status = transaction.status;
        payment.gatewayResponse = transaction.gateway_response || "";
        await payment.save();
      }

      return res.status(400).json({
        message: "Payment could not be verified as successful",
        data: { status: transaction.status },
      });
    }

    payment.status = "success";
    payment.paystackTransactionId = transaction.id;
    payment.paidAt = transaction.paid_at
      ? new Date(transaction.paid_at)
      : new Date();
    payment.channel = transaction.channel || "";
    payment.gatewayResponse = transaction.gateway_response || "";
    await payment.save();

    // Only paymentStatus changes here — orderStatus (fulfillment) is a
    // completely separate lifecycle and is untouched by payment success.
    await Order.findByIdAndUpdate(payment.order, { paymentStatus: "paid" });

    res.json({
      message: "Payment verified successfully",
      data: {
        reference: payment.reference,
        status: payment.status,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to verify payment",
    });
  }
};

// POST /api/payments/webhook
// Called directly by Paystack's servers, NOT by our frontend — there is
// no JWT here. Its own signature check is what proves a request is
// genuinely from Paystack and hasn't been tampered with in transit.
export const handlePaystackWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    // req.rawBody is populated by the express.json({ verify }) hook in
    // server.js. We MUST hash the exact raw bytes Paystack sent — hashing
    // JSON.stringify(req.body) instead could produce a different string
    // (key order, spacing) and make even a genuine request look invalid.
    if (!signature || !req.rawBody) {
      return res.sendStatus(400);
    }

    const expectedSignature = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(req.rawBody)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    // timingSafeEqual throws if lengths differ, so we check that first
    // — a length mismatch is already conclusive proof it's invalid.
    const isValidSignature =
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValidSignature) {
      return res.sendStatus(400);
    }

    const event = req.body;

    // We only act on successful charges right now. Any other event type
    // is acknowledged (so Paystack stops retrying it) but ignored.
    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const transaction = event.data;
    const payment = await Payment.findOne({ reference: transaction.reference });

    if (!payment) {
      // A charge.success for a reference we don't recognize. Log it and
      // acknowledge — we do NOT touch any order, since we have nothing
      // to safely tie this event to.
      console.warn(
        `Paystack webhook: no matching Payment for reference "${transaction.reference}"`,
      );
      return res.sendStatus(200);
    }

    // Idempotency: if this payment is already marked successful (e.g.
    // the customer's own verify call already processed it, or Paystack
    // sent this webhook more than once), do nothing further.
    if (payment.status === "success") {
      return res.sendStatus(200);
    }

    const amountMatches = transaction.amount === payment.amount;
    const referenceMatches = transaction.reference === payment.reference;
    const statusIsSuccess = transaction.status === "success";

    if (!amountMatches || !referenceMatches || !statusIsSuccess) {
      console.warn(
        `Paystack webhook: transaction "${transaction.reference}" failed validation ` +
          `(amountMatches=${amountMatches}, referenceMatches=${referenceMatches}, status=${transaction.status})`,
      );
      return res.sendStatus(200);
    }

    payment.status = "success";
    payment.paystackTransactionId = transaction.id;
    payment.paidAt = transaction.paid_at
      ? new Date(transaction.paid_at)
      : new Date();
    payment.channel = transaction.channel || "";
    payment.gatewayResponse = transaction.gateway_response || "";
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, { paymentStatus: "paid" });

    res.sendStatus(200);
  } catch (error) {
    // Signature was already validated above, so an error here is an
    // internal bug on our side, not a bad/fraudulent request. We return
    // 500 (not 200) so Paystack's automatic retry can deliver this
    // charge.success again later once the underlying issue is fixed,
    // instead of us silently losing the event.
    console.error(error);
    res.sendStatus(500);
  }
};

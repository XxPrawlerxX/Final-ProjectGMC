import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/Product.js";

// The actual mutation: gives back every item's reserved stock and marks
// the order (and each non-delivered item) cancelled + payment failed.
// Shared by expireOrder below AND by a customer voluntarily cancelling
// their own still-unpaid order (see cancelMyOrder in
// orderController.js) — same end state either way, whether the order
// died from a timeout or a deliberate choice. Caller is responsible for
// its own transaction/precondition checks; this just does the write.
export const releaseOrderStock = async (order, session) => {
  for (const item of order.items) {
    // findByIdAndUpdate simply no-ops if the product was since
    // deleted — same defensive pattern used elsewhere in this app.
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.quantity } },
      { session },
    );
  }

  order.items.forEach((item) => {
    if (item.itemStatus !== "delivered") {
      item.itemStatus = "cancelled";
    }
  });

  order.orderStatus = "cancelled";
  order.paymentStatus = "failed";

  await order.save({ session });
};

// Releases ONE order's reserved stock and marks it cancelled/failed.
// Used both by the periodic sweep below and by a "lazy" check inside
// initializePayment (see paymentController.js) for a customer who comes
// back to pay after their reservation already expired, rather than
// making them wait for the next sweep cycle.
//
// Wrapped in a transaction for the same reason order creation is: stock
// must be given back for EVERY item or NONE, never partially.
export const expireOrder = async (orderId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Re-fetch and re-check INSIDE the transaction — something else
    // (a webhook, an admin cancelling it, another sweep tick) may have
    // already resolved this order between when the caller decided to
    // expire it and now.
    const order = await Order.findOne({
      _id: orderId,
      paymentStatus: "pending",
      orderStatus: { $ne: "cancelled" },
    }).session(session);

    if (!order || !order.paymentExpiresAt || order.paymentExpiresAt > new Date()) {
      await session.abortTransaction();
      session.endSession();
      return false;
    }

    await releaseOrderStock(order, session);

    await session.commitTransaction();
    session.endSession();

    return true;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Finds every pending, unpaid order whose reservation has expired and
// releases each one. Meant to be called on an interval (see server.js).
//
// NOTE: this runs in-process via setInterval, which is simple and
// correct for a single backend instance. If this app is ever
// horizontally scaled to multiple instances, each instance would run
// its own sweep — harmless (expireOrder is idempotent and re-checks
// inside its transaction) but redundant. At that point this should
// move to a dedicated worker/cron so only one instance sweeps at a time.
export const expirePendingOrders = async () => {
  const candidates = await Order.find({
    paymentStatus: "pending",
    orderStatus: { $ne: "cancelled" },
    paymentExpiresAt: { $lte: new Date() },
  }).select("_id");

  let expiredCount = 0;

  for (const { _id } of candidates) {
    try {
      const wasExpired = await expireOrder(_id);
      if (wasExpired) expiredCount += 1;
    } catch (error) {
      console.error(`Failed to expire order ${_id}:`, error);
    }
  }

  return expiredCount;
};

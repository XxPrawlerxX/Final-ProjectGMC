import Order from "../models/Order.js";

// Not yet configurable per-vendor or via the database — a single flat
// rate for the whole marketplace. If this needs to vary later (e.g.
// per-vendor negotiated rates), this is the one place that changes.
export const PLATFORM_COMMISSION_RATE = 0.1;

// An order item is only "earned" by a vendor once the CUSTOMER has
// actually paid AND the vendor has actually DELIVERED it — the same
// conservative rule real marketplaces use, since a not-yet-delivered
// item could still be cancelled/returned. Nothing here moves money; it
// only calculates what a vendor is owed.
export const computeVendorEarnings = async (vendorId) => {
  const orders = await Order.find({
    paymentStatus: "paid",
    "items.vendor": vendorId,
  }).select("orderNumber items");

  let pendingAmount = 0;
  let paidAmount = 0;
  const pendingItems = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (item.vendor.toString() !== vendorId.toString()) continue;
      if (item.itemStatus !== "delivered") continue;

      const vendorShare = item.price * item.quantity * (1 - PLATFORM_COMMISSION_RATE);

      if (item.payoutStatus === "paid") {
        paidAmount += vendorShare;
      } else {
        pendingAmount += vendorShare;
        pendingItems.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderItemId: item._id,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          vendorShare,
        });
      }
    }
  }

  return {
    pendingAmount: Math.round(pendingAmount),
    paidAmount: Math.round(paidAmount),
    pendingItems,
  };
};

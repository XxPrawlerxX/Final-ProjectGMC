import mongoose from "mongoose";

import Order from "../models/Order.js";
import Payout from "../models/Payout.js";
import Vendor from "../models/Vendor.js";
import { computeVendorEarnings } from "../services/payoutService.js";

// GET /api/payouts/vendor/me
// The logged-in vendor's own earnings: what's pending, what's already
// been paid out, and their payout history.
export const getMyEarnings = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor profile not found",
      });
    }

    const { pendingAmount, paidAmount, pendingItems } = await computeVendorEarnings(
      vendor._id,
    );

    const history = await Payout.find({ vendor: vendor._id }).sort({
      createdAt: -1,
    });

    res.json({ pendingAmount, paidAmount, pendingItems, history });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch earnings",
    });
  }
};

// GET /api/payouts/admin/summary
// Admin-only: every vendor's pending/paid totals, so an admin can see
// at a glance who needs paying.
export const getAdminPayoutSummary = async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: "approved" }).select(
      "storeName user",
    );

    const summary = await Promise.all(
      vendors.map(async (vendor) => {
        const { pendingAmount, paidAmount } = await computeVendorEarnings(vendor._id);

        return {
          vendor: { _id: vendor._id, storeName: vendor.storeName },
          pendingAmount,
          paidAmount,
        };
      }),
    );

    res.json(summary);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch payout summary",
    });
  }
};

// POST /api/payouts/admin/:vendorId/pay
// Admin-only. Records that ALL of a vendor's currently pending, earned
// items have been paid out — this does NOT move real money. The admin
// is expected to have already sent the vendor their money (bank
// transfer, etc.) outside this app; this just marks it recorded.
export const payoutVendor = async (req, res) => {
  const { vendorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    return res.status(400).json({
      message: "Invalid vendor id",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const vendor = await Vendor.findById(vendorId).session(session);

    if (!vendor) {
      throw Object.assign(new Error("Vendor not found"), { statusCode: 404 });
    }

    const { pendingAmount, pendingItems } = await computeVendorEarnings(vendorId);

    if (pendingItems.length === 0) {
      throw Object.assign(new Error("This vendor has nothing pending payout"), {
        statusCode: 400,
      });
    }

    // Mark each covered order item as paid out. Multiple pending items
    // can belong to the same order, so group by order to avoid loading
    // (and re-saving) the same order document more than once.
    const itemsByOrder = new Map();

    for (const item of pendingItems) {
      const key = item.orderId.toString();
      if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
      itemsByOrder.get(key).push(item.orderItemId.toString());
    }

    for (const [orderId, orderItemIds] of itemsByOrder) {
      const order = await Order.findById(orderId).session(session);

      order.items.forEach((item) => {
        if (orderItemIds.includes(item._id.toString())) {
          item.payoutStatus = "paid";
        }
      });

      await order.save({ session });
    }

    const [payout] = await Payout.create(
      [
        {
          vendor: vendorId,
          amount: pendingAmount,
          items: pendingItems.map((item) => ({
            order: item.orderId,
            orderItemId: item.orderItemId,
          })),
          paidBy: req.user._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(payout);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);

    res.status(500).json({
      message: "Failed to record payout",
    });
  }
};

// GET /api/payouts/admin/history
// Admin-only: every payout ever recorded, across all vendors.
export const getAllPayoutHistory = async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate("vendor", "storeName")
      .populate("paidBy", "name email")
      .sort({ createdAt: -1 });

    res.json(payouts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch payout history",
    });
  }
};

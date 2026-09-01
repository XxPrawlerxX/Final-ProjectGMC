import mongoose from "mongoose";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";

// A small internal error type so we can throw a specific status code +
// message from deep inside the checkout transaction below, and have the
// outer catch block turn it into the right HTTP response instead of a
// generic 500.
class OrderError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// The list of valid item/order statuses, and which transitions are
// allowed FROM each one. This is the single source of truth for "what
// counts as a sensible next step" — both status-update endpoints below
// check against this instead of allowing any value to jump to any other.
const STATUS_VALUES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const ITEM_STATUS_FLOW = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [], // terminal — nothing can come after "delivered"
  cancelled: [], // terminal — nothing can come after "cancelled"
};

const isValidItemTransition = (from, to) =>
  ITEM_STATUS_FLOW[from]?.includes(to) ?? false;

// Admin's whole-order cancellation is a broader, top-down override:
// unlike a vendor's per-item cancel (only allowed before shipping), an
// admin can cancel even a shipped order (e.g. a lost package, a support
// escalation) — just never one that's already delivered or cancelled.
const canCancelWholeOrder = (currentOrderStatus) =>
  currentOrderStatus !== "delivered" && currentOrderStatus !== "cancelled";

// Figures out the order's overall orderStatus from its items' itemStatus
// values. This is a "weakest link" rule: the order is only as advanced
// as its LEAST advanced item, so Vendor A finishing their item can never
// make the order look "shipped" while Vendor B's item is still pending.
// Cancelled items are excluded from this calculation (unless EVERY item
// is cancelled) so one cancelled line doesn't hold back the rest.
const deriveOrderStatus = (items) => {
  const statuses = items.map((item) => item.itemStatus);

  if (statuses.every((status) => status === "cancelled")) {
    return "cancelled";
  }

  const activeStatuses = statuses.filter((status) => status !== "cancelled");

  if (activeStatuses.every((status) => status === "delivered")) {
    return "delivered";
  }

  if (
    activeStatuses.every(
      (status) => status === "delivered" || status === "shipped",
    )
  ) {
    return "shipped";
  }

  if (
    activeStatuses.every((status) =>
      ["delivered", "shipped", "processing"].includes(status),
    )
  ) {
    return "processing";
  }

  return "pending";
};

// POST /api/orders
// Creates an order from the logged-in customer's CURRENT cart.
// Body: { "shippingAddress": { fullName, phone, address, city, state } }
export const createOrder = async (req, res) => {
  const { shippingAddress } = req.body;
  const { fullName, phone, address, city, state } = shippingAddress || {};

  if (!fullName || !phone || !address || !city || !state) {
    return res.status(400).json({
      message:
        "Complete shipping address (fullName, phone, address, city, state) is required",
    });
  }

  // We use a transaction because THREE things must succeed or fail
  // together: creating the order, reducing product stock, and clearing
  // the cart. If any step fails partway through, we don't want stock
  // reduced without an order existing, or an order created without
  // stock being reduced.
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const cart = await Cart.findOne({ user: req.user._id }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new OrderError(400, "Your cart is empty");
    }

    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      // Always re-read the product fresh from the database. We never
      // trust price, vendor, or stock claims from the frontend.
      const product = await Product.findById(cartItem.product).session(
        session,
      );

      if (!product) {
        throw new OrderError(
          400,
          "One of the products in your cart is no longer available",
        );
      }

      if (!product.isActive) {
        throw new OrderError(
          400,
          `"${product.name}" is not currently available for purchase.`,
        );
      }

      // Legacy products created before vendor ownership existed have no
      // vendor. We deliberately refuse to guess/assign one — we just
      // block the purchase with a clear message, rather than silently
      // attributing the sale to the wrong (or no) vendor.
      if (!product.vendor) {
        throw new OrderError(
          400,
          "This product is not currently available for purchase.",
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new OrderError(
          400,
          `Insufficient stock for "${product.name}". Only ${product.stock} unit(s) left.`,
        );
      }

      // Atomically reduce stock, but ONLY if enough stock is still
      // available at this exact moment. This guards against a race
      // condition where two checkouts for the last unit happen at the
      // same time — the second one's $gte check will fail here even
      // though it passed the check above a moment earlier.
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: cartItem.quantity } },
        { $inc: { stock: -cartItem.quantity } },
        { new: true, session },
      );

      if (!updatedProduct) {
        throw new OrderError(
          400,
          `Insufficient stock for "${product.name}".`,
        );
      }

      orderItems.push({
        product: product._id,
        vendor: product.vendor,
        productName: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });

      subtotal += product.price * cartItem.quantity;
    }

    // Flat rate for now, as agreed — real shipping calculation comes later.
    const shippingFee = 0;
    const totalAmount = subtotal + shippingFee;

    const [order] = await Order.create(
      [
        {
          user: req.user._id,
          items: orderItems,
          shippingAddress: { fullName, phone, address, city, state },
          subtotal,
          shippingFee,
          totalAmount,
        },
      ],
      { session },
    );

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(order);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error instanceof OrderError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error(error);

    return res.status(500).json({
      message: "Failed to create order",
    });
  }
};

// GET /api/orders
// Returns only the logged-in customer's own orders.
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

// GET /api/orders/:id
// Returns ONE order, but only if it belongs to the logged-in customer.
export const getMyOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    // Filtering by user AND _id together means a request for someone
    // else's order id simply finds nothing — we never reveal whether
    // the order exists at all, only that "you" don't have access to it.
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

// GET /api/orders/admin/all
// Admin-only: see every order in the marketplace.
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

// GET /api/orders/vendor
// Vendor-only: see orders that contain at least one of THEIR products —
// but only their own items within each order, never another vendor's
// items or the marketplace-wide order total.
export const getVendorOrders = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor profile not found",
      });
    }

    const orders = await Order.find({ "items.vendor": vendor._id }).sort({
      createdAt: -1,
    });

    const vendorOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendor.toString() === vendor._id.toString(),
      );

      const vendorSubtotal = vendorItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      return {
        _id: order._id,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        items: vendorItems,
        vendorSubtotal,
      };
    });

    res.json(vendorOrders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch vendor orders",
    });
  }
};

// PUT /api/orders/:id/items/:itemId/status
// Body: { "itemStatus": "processing" }
// Updates ONE item's fulfillment status inside an order.
// - A vendor may only update items that belong to THEIR vendor profile.
// - An admin may update any item.
// After updating, the order's overall orderStatus is recalculated from
// all of its items (see deriveOrderStatus above) — it is never set
// directly by this endpoint.
export const updateOrderItemStatus = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { itemStatus } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return res.status(400).json({
        message: "Invalid order or item id",
      });
    }

    if (!STATUS_VALUES.includes(itemStatus)) {
      return res.status(400).json({
        message: `itemStatus must be one of: ${STATUS_VALUES.join(", ")}`,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Mongoose subdocument arrays support looking a sub-item up by its
    // own _id with .id(...) — no manual .find() loop needed.
    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Order item not found",
      });
    }

    // Ownership check: a vendor can only touch their OWN items. We look
    // this up from req.user._id — never trust a vendor id from the body.
    let vendor = null;

    if (req.user.role === "vendor") {
      vendor = await Vendor.findOne({ user: req.user._id });

      if (!vendor || item.vendor.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          message: "You can only update your own items in this order",
        });
      }
    }

    if (!isValidItemTransition(item.itemStatus, itemStatus)) {
      return res.status(400).json({
        message: `Cannot change item status from "${item.itemStatus}" to "${itemStatus}"`,
      });
    }

    item.itemStatus = itemStatus;
    order.orderStatus = deriveOrderStatus(order.items);

    await order.save();

    // A vendor should only ever see THEIR OWN items and pricing from
    // this order — never another vendor's products or the marketplace
    // wide subtotal/total, same rule as GET /api/orders/vendor.
    if (vendor) {
      const vendorItems = order.items.filter(
        (orderItem) => orderItem.vendor.toString() === vendor._id.toString(),
      );

      const vendorSubtotal = vendorItems.reduce(
        (sum, orderItem) => sum + orderItem.price * orderItem.quantity,
        0,
      );

      return res.json({
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        items: vendorItems,
        vendorSubtotal,
      });
    }

    res.json(order);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update item status",
    });
  }
};

// PUT /api/orders/:id/status
// Body: { "orderStatus": "cancelled" }
// Admin-only. This endpoint deliberately supports ONLY cancellation.
//
// WHY: Marketfind orders can contain items from multiple vendors, so
// there is no single honest "processing"/"shipped"/"delivered" value
// for the WHOLE order — that has to be derived bottom-up from each
// item's own status (see updateOrderItemStatus above). Cancellation is
// the one exception: it's a top-down override an admin can apply to an
// entire order at once (e.g. fraud, customer request, out-of-stock
// across the board), so it gets its own explicit action instead of
// being folded into the per-item flow.
export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order id",
      });
    }

    if (!STATUS_VALUES.includes(orderStatus)) {
      return res.status(400).json({
        message: `orderStatus must be one of: ${STATUS_VALUES.join(", ")}`,
      });
    }

    if (orderStatus !== "cancelled") {
      return res.status(400).json({
        message:
          "This endpoint only supports cancelling an entire order. " +
          "To advance an order (processing/shipped/delivered), update " +
          "the relevant vendor's item(s) via " +
          "PUT /api/orders/:id/items/:itemId/status instead.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (!canCancelWholeOrder(order.orderStatus)) {
      return res.status(400).json({
        message: `Cannot cancel an order that is already "${order.orderStatus}"`,
      });
    }

    // Cascade the cancellation to every item that hasn't already been
    // delivered — a delivered item can't retroactively un-deliver.
    order.items.forEach((item) => {
      if (item.itemStatus !== "delivered") {
        item.itemStatus = "cancelled";
      }
    });

    order.orderStatus = "cancelled";

    await order.save();

    res.json(order);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update order status",
    });
  }
};

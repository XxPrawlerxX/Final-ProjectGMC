import { Router } from "express";
import { Order, toOrderDto } from "../models/Order.js";
import { wrap } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  wrap(async (req, res) => {
    const orders = await Order.find({ user: req.user._id, status: { $in: ["paid", "review"] } })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ items: orders.map(toOrderDto) });
  }),
);

export default router;

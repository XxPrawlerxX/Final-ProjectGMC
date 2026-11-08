import { Router } from "express";
import { config } from "../config.js";
import { Subscriber } from "../models/Subscriber.js";
import { wrap } from "../lib/errors.js";
import { email, isPlainObject } from "../lib/validate.js";
import { writeLimiter } from "../middleware/security.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.get("/config", (req, res) => res.json({ deliveryFee: config.deliveryFee }));

router.post(
  "/newsletter",
  writeLimiter,
  wrap(async (req, res) => {
    const body = isPlainObject(req.body) ? req.body : {};
    const address = email(body.email);
    await Subscriber.updateOne({ email: address }, { email: address }, { upsert: true });
    res.json({ ok: true }); // same answer whether or not they were already subscribed
  }),
);

export default router;

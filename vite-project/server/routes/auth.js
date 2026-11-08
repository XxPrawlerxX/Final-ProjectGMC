import { Router } from "express";
import { User, toUserDto } from "../models/User.js";
import { HttpError, wrap } from "../lib/errors.js";
import { ValidationError, email, isPlainObject, phone, str } from "../lib/validate.js";
import { parseBuyerProfile } from "../lib/profiles.js";
import {
  burnPasswordTime,
  checkPasswordPolicy,
  hashPassword,
  verifyPassword,
} from "../lib/password.js";
import { endOtherSessions, endSession, startSession } from "../lib/sessions.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/security.js";

const router = Router();
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const bodyOf = (req) => (isPlainObject(req.body) ? req.body : {});

router.post(
  "/register",
  authLimiter,
  wrap(async (req, res) => {
    const body = bodyOf(req);
    const name = str(body.name, "name", { min: 2, max: 80 });
    const mail = email(body.email);
    const problem = checkPasswordPolicy(body.password, { email: mail, name });
    if (problem) throw new ValidationError(problem, "password");
    const buyer = parseBuyerProfile(body); // individual or business, retail or bulk shopper

    let user;
    try {
      user = await User.create({
        name,
        email: mail,
        phone: body.phone ? phone(body.phone) : "", // kept so sellers' emails and orders can reach the buyer
        buyer,
        passwordHash: await hashPassword(body.password),
      });
    } catch (err) {
      if (err.code === 11000) {
        throw new HttpError(409, "An account with this email already exists.", "email");
      }
      throw err;
    }
    await startSession(req, res, user);
    res.status(201).json({ user: toUserDto(user) });
  }),
);

router.post(
  "/login",
  authLimiter,
  wrap(async (req, res) => {
    const body = bodyOf(req);
    const mail = email(body.email);
    const password = typeof body.password === "string" ? body.password.slice(0, 128) : "";
    const generic = new HttpError(401, "Incorrect email or password.");

    const user = await User.findOne({ email: mail }).select("+passwordHash");
    if (!user) {
      await burnPasswordTime(password);
      throw generic;
    }
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new HttpError(429, "Too many failed attempts. Try again in a few minutes.");
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      const updated = await User.findByIdAndUpdate(user._id, { $inc: { failedLogins: 1 } }, { new: true });
      if (updated.failedLogins >= MAX_FAILED) {
        await User.updateOne(
          { _id: user._id },
          { failedLogins: 0, lockUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) },
        );
      }
      throw generic;
    }

    await User.updateOne({ _id: user._id }, { failedLogins: 0, lockUntil: null });
    await startSession(req, res, user);
    res.json({ user: toUserDto(user) });
  }),
);

router.post(
  "/logout",
  wrap(async (req, res) => {
    await endSession(req, res);
    res.json({ ok: true });
  }),
);

router.get("/me", (req, res) => {
  res.json({ user: req.user ? toUserDto(req.user) : null });
});

router.patch(
  "/me",
  requireAuth,
  wrap(async (req, res) => {
    const body = bodyOf(req);
    const update = { name: str(body.name, "name", { min: 2, max: 80 }) };
    update.phone = body.phone ? phone(body.phone) : "";
    update.address = str(body.address, "address", { optional: true, max: 300 });
    update.city = str(body.city, "city", { optional: true, max: 80 });
    update.state = str(body.state, "state", { optional: true, max: 80 });
    if (typeof body.notifyByEmail === "boolean") update.notifyByEmail = body.notifyByEmail;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json({ user: toUserDto(user) });
  }),
);

// Switch between individual/business or retail/bulk recommendations. Fields left out keep their value.
router.patch(
  "/buyer",
  requireAuth,
  wrap(async (req, res) => {
    const body = bodyOf(req);
    const current = req.user.buyer ?? {};
    const buyer = parseBuyerProfile({
      buyerKind: body.buyerKind ?? current.kind,
      buyingMode: body.buyingMode ?? current.mode,
      businessName: body.businessName ?? current.businessName,
      rcNumber: body.rcNumber ?? current.rcNumber,
      industry: body.industry ?? current.industry,
    });
    const user = await User.findByIdAndUpdate(req.user._id, { buyer }, { new: true });
    res.json({ user: toUserDto(user) });
  }),
);

router.post(
  "/change-password",
  authLimiter,
  requireAuth,
  wrap(async (req, res) => {
    const body = bodyOf(req);
    const user = await User.findById(req.user._id).select("+passwordHash");
    const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
    if (!(await verifyPassword(current, user.passwordHash))) {
      throw new HttpError(400, "Your current password is incorrect.", "currentPassword");
    }
    const problem = checkPasswordPolicy(body.newPassword, { email: user.email, name: user.name });
    if (problem) throw new ValidationError(problem, "newPassword");

    user.passwordHash = await hashPassword(body.newPassword);
    await user.save();
    await endOtherSessions(user._id, req.session._id); // sign out every other device
    res.json({ ok: true });
  }),
);

export default router;

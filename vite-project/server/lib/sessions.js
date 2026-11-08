import { createHash, randomBytes } from "node:crypto";
import { config } from "../config.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const maxAgeMs = () => config.sessionDays * 24 * 60 * 60 * 1000;

const baseCookie = () => ({
  httpOnly: true, // JavaScript on the page can't read it (blocks XSS token theft)
  secure: config.isProd, // HTTPS only in production
  sameSite: "lax", // not sent on cross-site POSTs (CSRF defence)
  path: "/",
});

export async function startSession(req, res, user) {
  const token = randomBytes(32).toString("base64url");
  await Session.create({
    tokenHash: sha256(token),
    user: user._id,
    userAgent: String(req.get("user-agent") || "").slice(0, 300),
    expiresAt: new Date(Date.now() + maxAgeMs()),
  });
  res.cookie(config.cookieName, token, { ...baseCookie(), maxAge: maxAgeMs() });
}

export async function findSessionUser(req) {
  const token = req.cookies?.[config.cookieName];
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const session = await Session.findOne({
    tokenHash: sha256(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  const user = await User.findById(session.user);
  return user ? { user, session } : null;
}

export async function endSession(req, res) {
  const token = req.cookies?.[config.cookieName];
  if (typeof token === "string") await Session.deleteOne({ tokenHash: sha256(token) });
  res.clearCookie(config.cookieName, baseCookie());
}

// Used after a password change: log the user out everywhere except here
export async function endOtherSessions(userId, keepSessionId) {
  await Session.deleteMany({ user: userId, _id: { $ne: keepSessionId } });
}

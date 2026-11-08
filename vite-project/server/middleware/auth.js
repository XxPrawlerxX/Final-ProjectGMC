import { findSessionUser } from "../lib/sessions.js";
import { config } from "../config.js";

// Attaches req.user / req.session when a valid session cookie is present.
// Never rejects: routes that need a user add requireAuth after it.
export async function loadUser(req, res, next) {
  try {
    if (req.cookies?.[config.cookieName]) {
      const found = await findSessionUser(req);
      if (found) {
        req.user = found.user;
        req.session = found.session;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Please sign in to continue." });
  next();
}

export function requireSeller(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Please sign in to continue." });
  if (!req.user.seller?.storeName) {
    return res.status(403).json({ error: "Register as a seller first." });
  }
  if (req.user.seller.status !== "active") {
    return res.status(403).json({ error: "Your seller account is suspended. Please contact support." });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Please sign in to continue." });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Not allowed." });
  next();
}

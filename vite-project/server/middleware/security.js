import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";

export const securityHeaders = helmet();

export const corsMiddleware = () =>
  cors({
    origin: config.clientOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  });

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

// Extra CSRF defence on top of SameSite cookies: browsers always send Origin on
// cross-site writes, so refuse any write that comes from another site.
// (Paystack's webhook is a server call with no Origin header, so it passes.)
export function originGuard(req, res, next) {
  const origin = req.get("origin");
  if (!SAFE.has(req.method) && origin && origin !== config.clientOrigin) {
    return res.status(403).json({ error: "Request blocked." });
  }
  next();
}

// Writes must be JSON. A cross-site <form> can't send JSON without a CORS
// pre-flight, which our CORS settings refuse.
const UPLOAD_PATH = /^\/api\/seller\/products(\/|$)/;

export function requireJson(req, res, next) {
  const hasBody = Number(req.get("content-length") || 0) > 0;
  const isUpload = UPLOAD_PATH.test(req.path) && req.is("multipart/form-data");
  if (!SAFE.has(req.method) && hasBody && !isUpload && !req.is("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json." });
  }
  next();
}

const limiter = (limit, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: message },
  });

export const generalLimiter = limiter(600, 15, "Too many requests. Please slow down.");
export const authLimiter = limiter(15, 15, "Too many attempts. Please try again in a few minutes.");
export const writeLimiter = limiter(60, 15, "You're doing that too often. Please wait a moment.");
// These run after requireAuth, so they count per signed-in user instead of per IP
const perUser = (limit, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user._id),
    message: { error: message },
  });

export const chatLimiter = perUser(40, 10, "You're sending messages too quickly. Please wait a few minutes.");
export const uploadLimiter = perUser(30, 60, "Too many uploads. Please try again later.");

export const paymentLimiter = limiter(30, 15, "Too many payment attempts. Please wait a few minutes.");

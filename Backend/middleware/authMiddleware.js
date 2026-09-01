import jwt from "jsonwebtoken";

import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        message: "Not authorized. No token provided.",
      });
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Invalid token format.",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Not authorized. User not found.",
      });
    }

    // Attach user to request
    req.user = user;

    // Continue to next middleware/controller
    next();
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      message: "Not authorized. Invalid or expired token.",
    });
  }
};

// ADMIN ONLY
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admins only.",
    });
  }

  next();
};

// VENDOR ONLY
export const vendorOnly = (req, res, next) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({
      message: "Access denied. Vendors only.",
    });
  }

  next();
};

// VENDOR OR ADMIN
export const vendorOrAdmin = (req, res, next) => {
  if (req.user.role !== "vendor" && req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Vendors or admins only.",
    });
  }

  next();
};

// CUSTOMER ONLY
// Used for the shopping cart: vendors manage products, not carts, and
// admins don't need a personal shopping cart either — so we keep this
// strict, matching the pattern of the other role guards above.
export const customerOnly = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      message: "Access denied. Customers only.",
    });
  }

  next();
};

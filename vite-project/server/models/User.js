import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // scrypt hash string. Never selected by default so it can't leak by accident.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },

    // Saved delivery details (pre-fill checkout)
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    address: { type: String, trim: true, maxlength: 300, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    state: { type: String, trim: true, maxlength: 80, default: "" },

    wishlist: { type: [String], default: [] }, // product slugs

    // Chat replies and message alerts are emailed unless the shopper turns this off
    notifyByEmail: { type: Boolean, default: true },

    // How this person shops: a private individual or a business, and what they want
    // to be shown (retail, wholesale/bulk, or both). Everyone has this.
    buyer: {
      kind: { type: String, enum: ["individual", "business"], default: "individual" },
      mode: { type: String, enum: ["retail", "bulk", "both"], default: "retail" },
      businessName: { type: String, trim: true, maxlength: 100, default: "" },
      rcNumber: { type: String, trim: true, maxlength: 30, default: "" },
      industry: { type: String, trim: true, maxlength: 60, default: "" },
    },

    // Present only for people who registered to sell
    seller: {
      // retail business | wholesale (bulk) business | individual (second-hand / single items)
      sellerType: { type: String, enum: ["retail", "wholesale", "individual"], default: "retail" },
      businessName: { type: String, trim: true, maxlength: 100, default: "" },
      rcNumber: { type: String, trim: true, maxlength: 30, default: "" },
      verified: { type: Boolean, default: false }, // set by an admin after checking documents
      storeName: { type: String, trim: true, maxlength: 60 },
      storeSlug: { type: String },
      description: { type: String, trim: true, maxlength: 500, default: "" },
      phone: { type: String, trim: true, maxlength: 30 },
      city: { type: String, trim: true, maxlength: 80 },
      state: { type: String, trim: true, maxlength: 80 },
      status: { type: String, enum: ["active", "suspended"], default: "active" },
      createdAt: { type: Date },
    },

    // Brute-force protection
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

// Store addresses (/store/:slug) are unique, but only for people who have a store
userSchema.index(
  { "seller.storeSlug": 1 },
  { unique: true, partialFilterExpression: { "seller.storeSlug": { $type: "string" } } },
);

export const User = mongoose.model("User", userSchema);

export const isSeller = (user) => Boolean(user?.seller?.storeName);

export function toSellerDto(user) {
  if (!isSeller(user)) return null;
  const s = user.seller;
  return {
    sellerType: s.sellerType,
    businessName: s.businessName,
    rcNumber: s.rcNumber,
    verified: s.verified,
    storeName: s.storeName,
    storeSlug: s.storeSlug,
    description: s.description,
    phone: s.phone,
    city: s.city,
    state: s.state,
    status: s.status,
  };
}

export function toUserDto(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    city: user.city,
    state: user.state,
    notifyByEmail: user.notifyByEmail,
    buyer: {
      kind: user.buyer?.kind ?? "individual",
      mode: user.buyer?.mode ?? "retail",
      businessName: user.buyer?.businessName ?? "",
      rcNumber: user.buyer?.rcNumber ?? "",
      industry: user.buyer?.industry ?? "",
    },
    seller: toSellerDto(user),
  };
}

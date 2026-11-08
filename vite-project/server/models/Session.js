import mongoose from "mongoose";

// One document per logged-in browser. The cookie holds a random token; only its
// SHA-256 hash is stored, so a database leak can't be used to hijack sessions.
const sessionSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  userAgent: { type: String, maxlength: 300, default: "" },
  createdAt: { type: Date, default: Date.now },
  // MongoDB deletes the document automatically once this date passes
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

export const Session = mongoose.model("Session", sessionSchema);

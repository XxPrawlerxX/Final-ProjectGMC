import mongoose from "mongoose";

// Uploaded pictures live in MongoDB itself, so they survive redeploys on hosts
// with temporary disks. (Each is small: the browser shrinks them before upload.)
const imageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const Image = mongoose.model("Image", imageSchema);

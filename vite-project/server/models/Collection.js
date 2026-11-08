import mongoose from "mongoose";

// A curated row on the home page ("Top selling", "Limited stock deals"...).
// Products join a collection through their `collections` array.
const collectionSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  kind: { type: String, enum: ["shelf", "deals", "top"], default: "shelf" },
  category: { type: String, default: "" }, // category slug for the "See all" link
  showOnHome: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

export const Collection = mongoose.model("Collection", collectionSchema);

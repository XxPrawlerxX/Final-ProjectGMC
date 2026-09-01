import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    storeDescription: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;

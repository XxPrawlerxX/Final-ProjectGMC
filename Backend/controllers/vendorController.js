import Vendor from "../models/Vendor.js";
import User from "../models/User.js";

// NOTE: The old "apply to become a vendor" endpoint (POST /api/vendors/apply)
// has been removed. Vendors now register directly through the dedicated
// POST /api/auth/register/vendor endpoint, which creates the User account
// AND the pending Vendor application together. Keeping both systems would
// let a client end up with two different, competing ways to become a
// vendor, so we removed the old one instead of running them side by side.

// GET MY VENDOR PROFILE
export const getMyVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      user: req.user._id,
    }).populate("user", "name email role");

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor profile not found",
      });
    }

    res.json(vendor);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get vendor profile",
    });
  }
};

// UPDATE MY VENDOR PROFILE
// Body: { storeName, storeDescription, phone, address }
// Only the store details are editable here — status/rejectionReason
// stay admin-controlled (see approveVendor/rejectVendor below).
export const updateMyVendorProfile = async (req, res) => {
  try {
    const { storeName, storeDescription, phone, address } = req.body;

    if (!storeName || !phone || !address) {
      return res.status(400).json({
        message: "Store name, phone and address are required",
      });
    }

    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor profile not found",
      });
    }

    vendor.storeName = storeName;
    vendor.storeDescription = storeDescription || "";
    vendor.phone = phone;
    vendor.address = address;

    await vendor.save();

    res.json({
      message: "Store profile updated successfully",
      vendor,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update store profile",
    });
  }
};

// GET ALL VENDOR APPLICATIONS
export const getVendorApplications = async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.json(vendors);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get vendor applications",
    });
  }
};

// APPROVE VENDOR
export const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor application not found",
      });
    }

    vendor.status = "approved";
    vendor.rejectionReason = "";

    await vendor.save();

    // Change the user's role to vendor
    await User.findByIdAndUpdate(
      vendor.user,
      {
        role: "vendor",
      },
      {
        new: true,
      },
    );

    res.json({
      message: "Vendor approved successfully",
      vendor,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to approve vendor",
    });
  }
};

// REJECT VENDOR
export const rejectVendor = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor application not found",
      });
    }

    vendor.status = "rejected";
    vendor.rejectionReason = rejectionReason || "Application rejected";

    await vendor.save();

    res.json({
      message: "Vendor application rejected",
      vendor,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to reject vendor",
    });
  }
};

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";

import User from "../models/User.js";
import Vendor from "../models/Vendor.js";

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "customer",
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to register user",
    });
  }
};

// VENDOR REGISTRATION
// Creates a User account AND a Vendor application in one request.
// The user's role stays "customer" until an admin approves the
// Vendor application (see approveVendor in vendorController.js).
export const registerVendor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      storeName,
      storeDescription,
      phone,
      address,
    } = req.body;

    // Validate ALL required fields up front (account info + store info)
    if (!name || !email || !password || !storeName || !phone || !address) {
      return res.status(400).json({
        message:
          "Name, email, password, store name, phone and address are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // We create the User and the Vendor together inside a transaction.
    // A transaction makes sure that if either document fails to save,
    // BOTH are rolled back — so we never end up with a User that has
    // no Vendor application, or vice versa. This only works because
    // our MongoDB Atlas cluster runs as a replica set (Atlas always
    // does, even on the free tier). If you ever move to a standalone
    // MongoDB server without replication, transactions like this are
    // not supported and would need to be replaced with manual cleanup
    // (e.g. deleting the User if the Vendor creation fails).
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // NOTE: When creating documents inside a transaction, Mongoose
      // requires create() to be called with an array, and it returns
      // an array back — that's why we grab [0] below.
      const [user] = await User.create(
        [
          {
            name,
            email,
            password: hashedPassword,
            // Role is ALWAYS "customer" here. We never read req.body.role.
            // The user only becomes a "vendor" later, once an admin
            // approves their Vendor application.
            role: "customer",
          },
        ],
        { session },
      );

      const [vendor] = await Vendor.create(
        [
          {
            user: user._id,
            storeName,
            storeDescription,
            phone,
            address,
            status: "pending",
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message:
          "Vendor registration submitted. Your application is pending admin approval.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        vendor: {
          id: vendor._id,
          storeName: vendor.storeName,
          status: vendor.status,
        },
      });
    } catch (transactionError) {
      // Something failed while creating the User or the Vendor.
      // Roll back so we don't leave a "half-registered" account behind.
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to register vendor",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to login",
    });
  }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get user",
    });
  }
};

// POST /api/auth/forgot-password
// Body: { email }
// Always responds with the SAME generic message whether or not the
// email is registered — confirming "that email isn't registered" is an
// account-enumeration leak, so we never distinguish the two cases.
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const genericResponse = {
      message:
        "If an account exists for that email, password reset instructions have been sent.",
    };

    const user = await User.findOne({ email });

    if (!user) {
      return res.json(genericResponse);
    }

    // Only the HASH is stored — the raw token is what a real email
    // would deliver to the user, and is the only thing that can ever
    // satisfy resetPassword below.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // ---------------------------------------------------------------
    // TEMPORARY / DEV-ONLY: this project has no email service wired up
    // yet (see the "email notifications" item on the project to-do
    // list). A real deployment MUST email `rawToken` to the user here
    // instead of ever returning or logging it — anyone who can see
    // this response/log could reset that account's password. Gating
    // behind NODE_ENV so this can't silently ship to production; once
    // email is built, this whole block should be replaced with an
    // actual send-email call and nothing else should change.
    // ---------------------------------------------------------------
    console.log(`[DEV ONLY] Password reset token for ${email}: ${rawToken}`);

    const response = { ...genericResponse };

    if (process.env.NODE_ENV !== "production") {
      response.devResetToken = rawToken;
    }

    res.json(response);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to process password reset request",
    });
  }
};

// POST /api/auth/reset-password
// Body: { token, password }
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Matching on the hash (never the raw token) and requiring the
    // expiry to still be in the future together mean a stale, reused,
    // or fabricated token simply matches nothing.
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid or has expired",
      });
    }

    user.password = await bcrypt.hash(password, 10);

    // Single-use: the token can never be replayed after this.
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: "Your password has been reset. You can now log in with your new password.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to reset password",
    });
  }
};

// PUT /api/auth/profile
// Body: { name, email }
// Any authenticated user (customer/vendor/admin) can update their own
// name/email. Does NOT touch password or role — those have their own
// dedicated, more guarded paths.
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const user = await User.findById(req.user._id);

    if (email !== user.email) {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          message: "That email is already in use",
        });
      }
    }

    user.name = name;
    user.email = email;
    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // A race with another update to the same email hits the schema's
    // unique index — same friendly message either way.
    if (error.code === 11000) {
      return res.status(400).json({
        message: "That email is already in use",
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

// PUT /api/auth/change-password
// Body: { currentPassword, newPassword }
// Requires the CURRENT password, not just a valid session — otherwise
// a stolen/leaked JWT alone could permanently lock the real owner out
// by changing their password without ever knowing it.
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to change password",
    });
  }
};

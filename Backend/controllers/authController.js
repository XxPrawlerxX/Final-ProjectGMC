import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

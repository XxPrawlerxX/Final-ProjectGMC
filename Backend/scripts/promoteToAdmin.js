// One-off script: promotes a user to the "admin" role by email, and
// optionally sets their password at the same time.
// Usage: node scripts/promoteToAdmin.js <email> [newPassword]
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

dotenv.config();

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email) {
  console.error("Usage: node scripts/promoteToAdmin.js <email> [newPassword]");
  process.exit(1);
}

await connectDB();

const user = await User.findOne({ email });

if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

user.role = "admin";

if (newPassword) {
  user.password = await bcrypt.hash(newPassword, 10);
}

await user.save();

console.log(`${user.email} is now an admin${newPassword ? " (password updated)" : ""}.`);

await mongoose.disconnect();

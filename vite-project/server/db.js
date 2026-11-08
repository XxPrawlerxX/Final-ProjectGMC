import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log("MongoDB connected");
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

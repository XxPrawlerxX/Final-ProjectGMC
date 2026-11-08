// Gives an existing account admin rights:  npm run make-admin -- you@example.com
import { connectDb, disconnectDb } from "./db.js";
import { User } from "./models/User.js";

const address = (process.argv[2] || "").trim().toLowerCase();
if (!process.env.MONGODB_URI || !address) {
  console.error("Usage: npm run make-admin -- you@example.com  (and set MONGODB_URI in .env)");
  process.exit(1);
}

await connectDb();
const user = await User.findOneAndUpdate({ email: address }, { role: "admin" }, { new: true });
console.log(user ? `${user.email} is now an admin` : `No account found for ${address} - register first`);
await disconnectDb();

// Fills MongoDB with the starter catalog (the data that used to live in the
// frontend). Safe to run more than once: products are matched by slug and
// stock levels are left alone. Use --reset to wipe products/categories first.
//
//   npm run seed
//   npm run seed -- --reset
import { connectDb, disconnectDb } from "./db.js";
import { Category } from "./models/Category.js";
import { Collection } from "./models/Collection.js";
import { Product } from "./models/Product.js";
import { buildSeed } from "./seed/build.js";

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI. Copy .env.example to .env first.");
  process.exit(1);
}

const { categories, collections, products } = buildSeed();
const reset = process.argv.includes("--reset");

await connectDb();
if (reset) {
  await Promise.all([Product.deleteMany({}), Category.deleteMany({}), Collection.deleteMany({})]);
  console.log("Cleared products, categories and collections");
}

await Category.bulkWrite(
  categories.map((c) => ({ updateOne: { filter: { slug: c.slug }, update: { $set: c }, upsert: true } })),
);
await Collection.bulkWrite(
  collections.map((c) => ({ updateOne: { filter: { slug: c.slug }, update: { $set: c }, upsert: true } })),
);
await Product.bulkWrite(
  products.map((p) => ({
    updateOne: {
      filter: { slug: p.slug },
      update: { $set: p, $setOnInsert: { stock: 50, ratingAvg: 0, ratingCount: 0, active: true } },
      upsert: true,
    },
  })),
);

console.log(`Seeded ${categories.length} categories, ${collections.length} collections, ${products.length} products`);
await disconnectDb();

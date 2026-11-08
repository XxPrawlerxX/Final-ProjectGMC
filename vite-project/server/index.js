// Marketfind API. Run with: npm run server
import express from "express";
import cookieParser from "cookie-parser";
import { assertConfig, config } from "./config.js";
import { connectDb, disconnectDb } from "./db.js";
import { loadUser } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import {
  corsMiddleware,
  generalLimiter,
  originGuard,
  requireJson,
  securityHeaders,
} from "./middleware/security.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import homeRoutes from "./routes/home.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import miscRoutes from "./routes/misc.js";
import sellerRoutes from "./routes/sellers.js";
import sellerProductRoutes from "./routes/sellerProducts.js";
import imageRoutes from "./routes/images.js";
import chatRoutes from "./routes/chat.js";
import recommendationRoutes from "./routes/recommendations.js";

assertConfig();

const app = express();
app.disable("x-powered-by");
if (config.trustProxy) app.set("trust proxy", config.trustProxy);

app.use(securityHeaders);
app.use(corsMiddleware());
app.use(generalLimiter);
app.use(cookieParser());
app.use(
  express.json({
    limit: "100kb",
    // The Paystack webhook signature is computed over the exact raw bytes
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(requireJson);
app.use(originGuard);
app.use(loadUser);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/seller", sellerProductRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api", miscRoutes);

app.use(notFound);
app.use(errorHandler);

await connectDb();
const server = app.listen(config.port, () =>
  console.log(`Marketfind API on http://localhost:${config.port}`),
);

async function shutdown() {
  server.close();
  await disconnectDb();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

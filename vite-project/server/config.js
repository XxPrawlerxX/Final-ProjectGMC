const env = process.env;

export const config = {
  port: Number(env.PORT) || 8787,
  mongoUri: env.MONGODB_URI,
  paystackSecret: env.PAYSTACK_SECRET_KEY,
  clientOrigin: env.CLIENT_ORIGIN || "http://localhost:5173",
  isProd: env.NODE_ENV === "production",
  // Set to 1 when the server sits behind one proxy (Render, Railway, Nginx...)
  trustProxy: env.TRUST_PROXY ? Number(env.TRUST_PROXY) : 0,
  deliveryFee: Number(env.DELIVERY_FEE) || 2500, // naira
  // Absolute URL of this API, only needed if the website is on a different domain
  // (so uploaded-image links work from there). Leave empty in development.
  publicApiUrl: (env.PUBLIC_API_URL || "").replace(/\/$/, ""),
  smtp: {
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM || "Marketfind <no-reply@marketfind.local>",
  },
  sessionDays: 7,
  cookieName: "mf_session",
};

export function assertConfig() {
  const missing = [];
  if (!config.mongoUri) missing.push("MONGODB_URI");
  if (!config.paystackSecret) missing.push("PAYSTACK_SECRET_KEY");
  if (missing.length) {
    console.error(`Missing ${missing.join(", ")}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

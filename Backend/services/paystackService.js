// All direct communication with Paystack's API lives here, kept separate
// from our own business logic (order lookups, ownership checks, etc.)
// in controllers/paymentController.js. Uses Node's built-in fetch —
// no HTTP client dependency needed.

const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Shared request helper: attaches the secret key and Content-Type, then
// throws if Paystack reports failure so callers can just await + catch.
const paystackRequest = async (path, options = {}) => {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  // Paystack returns { status: false, message: "..." } on its own
  // errors even with an HTTP 200, so we check both.
  if (!response.ok || data.status === false) {
    throw new Error(data?.message || "Paystack request failed");
  }

  return data;
};

// Starts a new transaction. `amount` MUST already be in kobo — this
// function does no currency conversion, that happens in the controller
// right next to where Order.totalAmount is read, so the conversion is
// never more than one line away from its authoritative source.
export const initializeTransaction = async ({
  email,
  amount,
  reference,
  callback_url,
  metadata,
}) => {
  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email, amount, reference, callback_url, metadata }),
  });
};

// Asks Paystack for the true, authoritative status of a transaction by
// OUR reference. This is what we trust — never a frontend callback.
export const verifyTransaction = async (reference) => {
  return paystackRequest(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );
};

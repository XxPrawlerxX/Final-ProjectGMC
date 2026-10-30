// Talks to the payment server in /server. In development Vite proxies /api to
// it (see vite.config.js). For production set VITE_API_URL to the server's URL.
const API_BASE = import.meta.env.VITE_API_URL || "";

async function post(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "We couldn't reach the payment server. Check your connection and try again.",
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function initializePayment({ items, customer }) {
  return post("/api/payments/initialize", { items, customer });
}

export function verifyPayment(reference) {
  return post("/api/payments/verify", { reference });
}

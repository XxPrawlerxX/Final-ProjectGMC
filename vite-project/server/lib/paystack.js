import { config } from "../config.js";
import { HttpError } from "./errors.js";

export async function paystack(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`https://api.paystack.co${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${config.paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpError(502, "We couldn't reach the payment provider. Please try again.");
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.status === false) {
    console.error("Paystack error:", response.status, json.message);
    throw new HttpError(502, "The payment provider rejected the request. Please try again.");
  }
  return json.data;
}

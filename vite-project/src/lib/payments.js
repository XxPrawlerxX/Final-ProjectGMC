import { api } from "./api";

export function initializePayment({ items, customer }) {
  return api.post("/api/payments/initialize", { items, customer });
}

export function verifyPayment(reference) {
  return api.post("/api/payments/verify", { reference });
}

// Pricing rules shared by the website (to show prices) and the server (to charge them).
// Pure functions only, so the same code is used on both sides.

export const BULK_UNITS = ["piece", "dozen", "pack", "carton", "bag", "kg", "tonne", "litre", "set", "pallet"];
export const MAX_TIERS = 4;

// Bulk listings: `price` is the unit price at the minimum order. `priceTiers` are
// cheaper unit prices for larger orders: [{ minQty: 100, price: 850 }, ...]
export function unitPriceFor(product, quantity) {
  let price = product.price;
  for (const tier of product.priceTiers ?? []) {
    if (quantity >= tier.minQty && tier.price < price) price = tier.price;
  }
  return price;
}

export const lineTotal = (product, quantity) => unitPriceFor(product, quantity) * quantity;

// Cheapest unit price anyone can get
export function bestPrice(product) {
  return Math.min(product.price, ...(product.priceTiers ?? []).map((t) => t.price));
}

// Checks a seller's price breaks. Returns { tiers } or { error }.
export function validateTiers(rawTiers, { price, minOrderQty }) {
  if (rawTiers === undefined || rawTiers === null) return { tiers: [] };
  if (!Array.isArray(rawTiers)) return { error: "Price breaks must be a list." };
  if (rawTiers.length > MAX_TIERS) return { error: `Add at most ${MAX_TIERS} price breaks.` };

  let previousQty = minOrderQty;
  let previousPrice = price;
  const tiers = [];
  for (const tier of rawTiers) {
    const minQty = tier?.minQty;
    const tierPrice = tier?.price;
    if (!Number.isInteger(minQty) || !Number.isInteger(tierPrice)) {
      return { error: "Enter whole numbers for every price break." };
    }
    if (minQty <= previousQty) return { error: `Each price break must start above ${previousQty} units.` };
    if (tierPrice < 1 || tierPrice >= previousPrice) {
      return { error: `Each price break must be cheaper than the one before it (below ₦${previousPrice}).` };
    }
    tiers.push({ minQty, price: tierPrice });
    previousQty = minQty;
    previousPrice = tierPrice;
  }
  return { tiers };
}

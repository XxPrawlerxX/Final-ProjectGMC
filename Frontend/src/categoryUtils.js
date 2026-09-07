// Small formatting helper kept from the original mock-data file — this
// one is still genuinely useful with real data, so it stays. The fake
// category/product generators that used to live here have been removed;
// real categories and products now come from src/api/.
export function formatNaira(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

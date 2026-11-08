// Validates the "who are you" parts of registration: buyer type/mode and seller type.
// Pure functions (no database) so they are easy to test.
import { ValidationError, isPlainObject, oneOf, str } from "./validate.js";

export const BUYER_KINDS = ["individual", "business"];
export const BUYING_MODES = ["retail", "bulk", "both"];
export const SELLER_TYPES = ["retail", "wholesale", "individual"];

const RC_NUMBER = /^[A-Za-z0-9\-/ ]{3,30}$/;

function optionalRc(value) {
  const text = str(value, "rcNumber", { optional: true, max: 30 });
  if (text && !RC_NUMBER.test(text)) throw new ValidationError("Use letters, numbers and dashes only.", "rcNumber");
  return text;
}

// Business details, required whenever the account is a business
export function parseBusiness(body) {
  return {
    businessName: str(body.businessName, "businessName", { min: 2, max: 100 }),
    rcNumber: optionalRc(body.rcNumber),
  };
}

// -> { kind, mode, businessName, rcNumber, industry }
export function parseBuyerProfile(input) {
  const body = isPlainObject(input) ? input : {};
  const kind = oneOf(body.buyerKind, "buyerKind", BUYER_KINDS, "individual");
  // Businesses default to wholesale buying, individuals to retail
  const mode = oneOf(body.buyingMode, "buyingMode", BUYING_MODES, kind === "business" ? "bulk" : "retail");
  if (kind === "individual") return { kind, mode, businessName: "", rcNumber: "", industry: "" };
  return {
    kind,
    mode,
    ...parseBusiness(body),
    industry: str(body.industry, "industry", { optional: true, max: 60 }),
  };
}

export const isBusinessSeller = (sellerType) => sellerType === "retail" || sellerType === "wholesale";

export const LISTING_FOR_SELLER = { retail: "retail", wholesale: "bulk", individual: "secondhand" };

// Seller side of registration. Business sellers must give business details;
// individuals selling their own things don't need to register a business.
export function parseSellerType(body) {
  const sellerType = oneOf(body.sellerType, "sellerType", SELLER_TYPES, undefined);
  if (!sellerType) throw new ValidationError("Choose what kind of seller you are.", "sellerType");
  return sellerType;
}

export function parseSellerBusiness(sellerType, body) {
  return isBusinessSeller(sellerType) ? parseBusiness(body) : { businessName: "", rcNumber: "" };
}

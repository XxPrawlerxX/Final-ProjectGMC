import test from "node:test";
import assert from "node:assert/strict";
import { ValidationError } from "./validate.js";
import { parseBuyerProfile, parseSellerBusiness, parseSellerType } from "./profiles.js";
import { audienceFilter, isBusinessBuyer } from "./access.js";
import { rankByAffinity, sectionsForMode, topCategories } from "./recommend.js";

test("individual buyers default to retail, businesses to bulk", () => {
  assert.deepEqual(parseBuyerProfile({}), { kind: "individual", mode: "retail", businessName: "", rcNumber: "", industry: "" });
  const biz = parseBuyerProfile({ buyerKind: "business", businessName: "Ada Traders", rcNumber: "RC-123456" });
  assert.equal(biz.mode, "bulk");
  assert.equal(biz.businessName, "Ada Traders");
  assert.equal(parseBuyerProfile({ buyerKind: "business", businessName: "X Ltd", buyingMode: "both" }).mode, "both");
});

test("business accounts need a business name; bad values are rejected", () => {
  assert.throws(() => parseBuyerProfile({ buyerKind: "business" }), ValidationError);
  assert.throws(() => parseBuyerProfile({ buyerKind: "business", businessName: "OK Ltd", rcNumber: "<script>" }), ValidationError);
  assert.throws(() => parseBuyerProfile({ buyerKind: "admin" }), ValidationError);
  assert.throws(() => parseBuyerProfile({ buyerKind: { $ne: 1 } }), ValidationError);
});

test("seller types: businesses give details, individuals don't have to", () => {
  assert.equal(parseSellerType({ sellerType: "wholesale" }), "wholesale");
  assert.throws(() => parseSellerType({}), ValidationError);
  assert.throws(() => parseSellerType({ sellerType: "wizard" }), ValidationError);
  assert.deepEqual(parseSellerBusiness("individual", {}), { businessName: "", rcNumber: "" });
  assert.throws(() => parseSellerBusiness("retail", {}), ValidationError);
  assert.equal(parseSellerBusiness("wholesale", { businessName: "Bulk Co" }).businessName, "Bulk Co");
});

test("business-only listings are hidden from non-business viewers", () => {
  assert.deepEqual(audienceFilter(null), { audience: { $ne: "business" } });
  assert.deepEqual(audienceFilter({ buyer: { kind: "individual" } }), { audience: { $ne: "business" } });
  assert.deepEqual(audienceFilter({ buyer: { kind: "business" } }), {});
  assert.equal(isBusinessBuyer({ buyer: { kind: "business" } }), true);
});

test("recommendations favour interests, keep newest-first order otherwise", () => {
  const products = [
    { id: "a", categorySlug: "shoes" }, { id: "b", categorySlug: "tv" },
    { id: "c", categorySlug: "shoes" }, { id: "d", categorySlug: "bags" },
  ];
  assert.deepEqual(topCategories(["tv", "tv", "bags", "shoes", "tv", "bags"]), ["tv", "bags", "shoes"]);
  assert.deepEqual(rankByAffinity(products, ["tv", "bags"]).map((p) => p.id), ["b", "d", "a", "c"]);
  assert.deepEqual(rankByAffinity(products, []).map((p) => p.id), ["a", "b", "c", "d"]);
  assert.deepEqual(sectionsForMode("bulk"), ["bulk-deals", "suppliers", "reorder"]);
  assert.deepEqual(sectionsForMode("retail"), ["for-you", "preloved"]);
});

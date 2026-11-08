import test from "node:test";
import assert from "node:assert/strict";
import { buildSeed } from "./build.js";

const { categories, collections, products } = buildSeed();

test("slugs are unique and prices are whole naira", () => {
  const slugs = products.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(new Set(categories.map((c) => c.slug)).size, categories.length);
  for (const p of products) {
    assert.ok(Number.isInteger(p.price) && p.price > 0, p.slug);
    assert.ok(p.image && p.categorySlug && p.category, p.slug);
  }
});

test("every product points at a real category, every collection has products", () => {
  const categorySlugs = new Set(categories.map((c) => c.slug));
  for (const p of products) assert.ok(categorySlugs.has(p.categorySlug), `${p.slug} -> ${p.categorySlug}`);
  for (const c of collections) {
    assert.ok(products.some((p) => p.collections.includes(c.slug)), `empty collection ${c.slug}`);
  }
  assert.ok(products.some((p) => p.collections.includes("hero")));
});

test("home page shows a small number of rows, tiles use real image URLs", () => {
  assert.ok(collections.filter((c) => c.showOnHome).length <= 4);
  const featured = categories.filter((c) => c.featured);
  assert.ok(featured.length >= 6);
  for (const c of featured) assert.ok(c.image.startsWith("http"), c.slug);
});

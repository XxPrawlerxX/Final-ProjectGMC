import test from "node:test";
import assert from "node:assert/strict";
import { bestPrice, lineTotal, unitPriceFor, validateTiers } from "./pricing.js";

const rice = { price: 1000, minOrderQty: 10, priceTiers: [{ minQty: 50, price: 900 }, { minQty: 200, price: 800 }] };

test("unit price drops as the quantity passes each price break", () => {
  assert.equal(unitPriceFor(rice, 10), 1000);
  assert.equal(unitPriceFor(rice, 49), 1000);
  assert.equal(unitPriceFor(rice, 50), 900);
  assert.equal(unitPriceFor(rice, 199), 900);
  assert.equal(unitPriceFor(rice, 5000), 800);
  assert.equal(lineTotal(rice, 60), 54000);
  assert.equal(bestPrice(rice), 800);
});

test("products without tiers just use their price", () => {
  assert.equal(unitPriceFor({ price: 5000 }, 3), 5000);
  assert.equal(bestPrice({ price: 5000 }), 5000);
});

test("tier validation", () => {
  const base = { price: 1000, minOrderQty: 10 };
  assert.deepEqual(validateTiers([], base), { tiers: [] });
  assert.equal(validateTiers([{ minQty: 50, price: 900 }], base).tiers.length, 1);
  assert.match(validateTiers([{ minQty: 10, price: 900 }], base).error, /above 10/);
  assert.match(validateTiers([{ minQty: 50, price: 1000 }], base).error, /cheaper/);
  assert.match(validateTiers([{ minQty: 50, price: 900 }, { minQty: 40, price: 800 }], base).error, /above 50/);
  assert.match(validateTiers([{ minQty: 50, price: 900 }, { minQty: 60, price: 950 }], base).error, /cheaper/);
  assert.match(validateTiers([{ minQty: 5.5, price: 900 }], base).error, /whole numbers/);
  assert.match(validateTiers("nope", base).error, /list/);
  const five = [1, 2, 3, 4, 5].map((n) => ({ minQty: 10 + n * 10, price: 1000 - n * 10 }));
  assert.match(validateTiers(five, base).error, /at most/);
});

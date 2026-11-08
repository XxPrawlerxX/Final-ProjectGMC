import test from "node:test";
import assert from "node:assert/strict";
import { ValidationError, email, escapeRegex, int, oneOf, str } from "./validate.js";

test("rejects objects (NoSQL operator injection attempt)", () => {
  assert.throws(() => str({ $gt: "" }, "email"), ValidationError);
  assert.throws(() => email({ $ne: null }), ValidationError);
  assert.throws(() => str(["a"], "name"), ValidationError);
});

test("email, int, oneOf", () => {
  assert.equal(email("  Ada@Example.COM "), "ada@example.com");
  assert.throws(() => email("nope"), ValidationError);
  assert.equal(int("5", "n", { min: 1, max: 9 }), 5);
  assert.throws(() => int(1.5, "n"), ValidationError);
  assert.throws(() => int(100, "n", { max: 50 }), ValidationError);
  assert.equal(oneOf(undefined, "s", ["a"], "a"), "a");
  assert.throws(() => oneOf("zzz", "s", ["a"], "a"), ValidationError);
});

test("escapeRegex neutralises regex input", () => {
  const re = new RegExp(escapeRegex("a.*(b"), "i");
  assert.ok(re.test("xa.*(by"));
  assert.ok(!re.test("axxb"));
});

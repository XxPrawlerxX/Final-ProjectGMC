import test from "node:test";
import assert from "node:assert/strict";
import { checkPasswordPolicy, hashPassword, verifyPassword } from "./password.js";

test("hash verifies, wrong password does not, hashes are salted", async () => {
  const a = await hashPassword("Correct-horse-9");
  const b = await hashPassword("Correct-horse-9");
  assert.notEqual(a, b);
  assert.ok(a.startsWith("scrypt$"));
  assert.equal(await verifyPassword("Correct-horse-9", a), true);
  assert.equal(await verifyPassword("Correct-horse-8", a), false);
  assert.equal(await verifyPassword("anything", "garbage"), false);
});

test("password policy", () => {
  assert.match(checkPasswordPolicy("short1"), /8 characters/);
  assert.match(checkPasswordPolicy("password123"), /common/);
  assert.match(checkPasswordPolicy("onlyletters"), /letters and numbers/);
  assert.match(checkPasswordPolicy("adaeze2024x", { email: "adaeze@x.com" }), /email/);
  assert.equal(checkPasswordPolicy("blue-River-42"), null);
});

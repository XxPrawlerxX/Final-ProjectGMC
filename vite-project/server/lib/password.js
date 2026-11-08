// Password hashing with scrypt (built into Node, memory-hard, no extra packages).
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 32768; // CPU/memory cost
const R = 8;
const P = 1;
const KEY_LEN = 64;
const MAXMEM = 128 * N * R * 2;

function derive(password, salt, n = N, r = R, p = P) {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, { N: n, r, p, maxmem: MAXMEM }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

// Stored as: scrypt$N$r$p$salt$hash  (so the cost can be raised later)
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password, stored) {
  const [scheme, n, r, p, saltB64, hashB64] = String(stored).split("$");
  if (scheme !== "scrypt" || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await derive(password, Buffer.from(saltB64, "base64"), +n, +r, +p);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when the email doesn't exist, so "no such user" takes as long as "wrong
// password" and can't be told apart by timing.
let dummy;
export async function burnPasswordTime(password) {
  dummy ??= await hashPassword("not-a-real-password");
  await verifyPassword(password, dummy);
}

const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwerty123", "qwertyuiop", "iloveyou", "11111111", "00000000", "abc12345",
  "letmein123", "welcome123", "admin1234", "marketfind",
]);

// Returns an error message, or null when the password is acceptable.
export function checkPasswordPolicy(password, { email = "", name = "" } = {}) {
  if (typeof password !== "string") return "Enter a password.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 128) return "Use at most 128 characters.";
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) return "That password is too common. Choose something harder to guess.";
  const local = email.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local))
    return "Your password shouldn't contain your email.";
  const first = name.trim().split(/\s+/)[0]?.toLowerCase();
  if (first && first.length >= 4 && lower === first) return "Your password shouldn't be your name.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return "Use a mix of letters and numbers.";
  return null;
}

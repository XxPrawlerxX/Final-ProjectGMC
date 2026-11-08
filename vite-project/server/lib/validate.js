// Tiny input validators. Every value from the browser goes through one of
// these, which also guarantees it is a plain string/number (never an object
// like {"$gt": ""}), so it can't be used for NoSQL operator injection.

export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.status = 400;
    this.field = field;
  }
}

export function str(value, field, { min = 1, max = 200, optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return "";
    throw new ValidationError("This field is required.", field);
  }
  if (typeof value !== "string") throw new ValidationError("Invalid value.", field);
  const text = value.trim();
  if (text.length < min) throw new ValidationError(`Must be at least ${min} characters.`, field);
  if (text.length > max) throw new ValidationError(`Must be at most ${max} characters.`, field);
  return text;
}

export function email(value, field = "email") {
  const text = str(value, field, { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text))
    throw new ValidationError("Enter a valid email address.", field);
  return text;
}

export function int(value, field, { min = 0, max = 1_000_000_000 } = {}) {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(n) || n < min || n > max)
    throw new ValidationError(`Must be a whole number between ${min} and ${max}.`, field);
  return n;
}

// Same, but for optional query-string values: returns undefined when absent.
export function optionalInt(value, field, opts) {
  if (value === undefined || value === "") return undefined;
  return int(value, field, opts);
}

export function oneOf(value, field, allowed, fallback) {
  if (value === undefined || value === "") return fallback;
  if (typeof value !== "string" || !allowed.includes(value))
    throw new ValidationError("Invalid option.", field);
  return value;
}

// Phone: digits, spaces, +, -, parentheses
export function phone(value, field = "phone") {
  const text = str(value, field, { min: 7, max: 20 });
  if (!/^[+\d][\d\s\-()]{5,}$/.test(text)) throw new ValidationError("Enter a valid phone number.", field);
  return text;
}

export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

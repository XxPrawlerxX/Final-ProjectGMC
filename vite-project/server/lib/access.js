// Who may see or buy what.
export const isBusinessBuyer = (user) => user?.buyer?.kind === "business";

// Business-only wholesale listings are hidden from everyone except business accounts
export function audienceFilter(user) {
  return isBusinessBuyer(user) ? {} : { audience: { $ne: "business" } };
}

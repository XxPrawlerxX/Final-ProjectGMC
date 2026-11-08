// Rule-based recommendations (no AI needed): favour the categories a shopper has
// shown interest in, then fill up with the newest listings.

// categories the shopper has saved or bought from, most frequent first
export function topCategories(slugs, limit = 5) {
  const counts = new Map();
  for (const slug of slugs) counts.set(slug, (counts.get(slug) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([slug]) => slug);
}

// products already sorted newest-first -> same products, favourite categories first
export function rankByAffinity(products, categorySlugs) {
  const rank = new Map(categorySlugs.map((slug, index) => [slug, index]));
  const score = (p) => (rank.has(p.categorySlug) ? rank.get(p.categorySlug) : categorySlugs.length);
  return products
    .map((product, index) => ({ product, index }))
    .sort((a, b) => score(a.product) - score(b.product) || a.index - b.index)
    .map((entry) => entry.product);
}

// which sections a shopper's mode asks for
export function sectionsForMode(mode) {
  if (mode === "bulk") return ["bulk-deals", "suppliers", "reorder"];
  if (mode === "both") return ["bulk-deals", "for-you", "preloved", "reorder"];
  return ["for-you", "preloved"];
}

// One place that knows about every product on the site.
// Pure data + helpers (no React) so the payment server can import it and
// work out prices itself instead of trusting the browser.
import {
  categoryNames,
  getCategoryData,
  slugifyCategory,
} from "./categoryData.js";
import {
  limitedStockDeals,
  marketShelves,
  products as heroProducts,
  topSellingItems,
} from "./homeData.js";

export const DELIVERY_FEE = 2500; // naira

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function fromTuple([name, price, oldPrice, image], category) {
  return {
    id: slugify(name),
    name,
    price,
    oldPrice,
    image,
    category,
    tag: null,
    shipping: "Fast delivery",
  };
}

function buildCatalog() {
  const all = [];

  // Products shown on the home page
  for (const shelf of marketShelves) {
    for (const item of shelf.items) all.push(fromTuple(item, shelf.category));
  }
  for (const item of limitedStockDeals) all.push(fromTuple(item, "SuperDeals"));
  for (const item of topSellingItems) all.push(fromTuple(item, "Choice"));
  for (const hero of heroProducts) {
    all.push({
      id: hero.id,
      name: hero.name,
      price: hero.price,
      oldPrice: hero.oldPrice,
      image: hero.image,
      category: "Electronics",
      tag: hero.discount,
      shipping: "Free delivery",
      description: hero.description,
    });
  }

  // Products generated for each category page
  for (const category of categoryNames) {
    all.push(
      ...getCategoryData(category).products.map((p) => ({ ...p, category })),
    );
  }

  // First one wins if two products ever share an id
  const byId = new Map();
  for (const product of all) {
    if (!byId.has(product.id)) {
      byId.set(product.id, {
        ...product,
        categorySlug: slugifyCategory(product.category),
      });
    }
  }
  return byId;
}

const catalog = buildCatalog();

export function getAllProducts() {
  return [...catalog.values()];
}

export function getProduct(id) {
  return catalog.get(id);
}

export function getProductsByCategory(category) {
  return getAllProducts().filter((product) => product.category === category);
}

export function getRelatedProducts(product, limit = 4) {
  const sameCategory = getAllProducts().filter(
    (p) => p.category === product.category && p.id !== product.id,
  );
  return sameCategory.slice(0, limit);
}

export function searchProducts(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const seenNames = new Set();
  return getAllProducts().filter((product) => {
    const haystack = `${product.name} ${product.category}`.toLowerCase();
    if (!terms.every((term) => haystack.includes(term))) return false;
    if (seenNames.has(product.name)) return false; // same name in many categories
    seenNames.add(product.name);
    return true;
  });
}

export function productPath(id) {
  return `/product/${id}`;
}

export function categoryPath(category) {
  return `/category/${slugifyCategory(category)}`;
}

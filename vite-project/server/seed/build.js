import { categoryNames, getCategoryData, slugifyCategory } from "./categoryData.js";
import { getAllProducts, slugify } from "./catalog.js";
import {
  essentialCategories,
  limitedStockDeals,
  marketShelves,
  products as heroProducts,
  topSellingItems,
} from "./homeData.js";

// Pure function: turns the starter data into documents ready for MongoDB.
export function buildSeed() {
  // Which home-page rows each product belongs to
  const membership = new Map();
  function join(slug, collection) {
    membership.set(slug, [...(membership.get(slug) || []), collection]);
  }

  const collections = [];
  collections.push({
    slug: "limited-stock-deals",
    title: "Limited stock deals",
    subtitle: "Up to 70% off while stock lasts",
    kind: "deals",
    category: "superdeals",
    showOnHome: true,
    order: 1,
  });
  limitedStockDeals.forEach(([name]) => join(slugify(name), "limited-stock-deals"));

  collections.push({
    slug: "top-selling",
    title: "Top selling",
    subtitle: "Popular picks shoppers love",
    kind: "top",
    category: "choice",
    showOnHome: true,
    order: 2,
  });
  topSellingItems.forEach(([name]) => join(slugify(name), "top-selling"));

  marketShelves.forEach((shelf, index) => {
    const slug = slugify(shelf.title);
    collections.push({
      slug,
      title: shelf.title,
      subtitle: shelf.subtitle,
      kind: "shelf",
      category: slugifyCategory(shelf.category),
      showOnHome: index < 2, // flip showOnHome in the database to feature others
      order: 3 + index,
    });
    shelf.items.forEach(([name]) => join(slugify(name), slug));
  });

  heroProducts.forEach((hero) => join(hero.id, "hero"));

  // Categories (+ the featured tiles shown on the home page)
  const tileImages = new Map();
  for (const [, category, image] of essentialCategories) {
    // images starting with "/" pointed at files that don't exist in /public
    if (!image.startsWith("/") && !tileImages.has(category)) tileImages.set(category, image);
  }
  const categories = categoryNames.map((name, index) => {
    const data = getCategoryData(name);
    return {
      slug: slugifyCategory(name),
      name,
      headline: data.headline,
      description: data.description,
      heroImage: data.heroImage,
      image: tileImages.get(name) || data.heroImage,
      featured: tileImages.has(name),
      order: index,
    };
  });

  const products = getAllProducts().map((p) => ({
    slug: p.id,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice,
    image: p.image,
    category: p.category,
    categorySlug: p.categorySlug,
    tag: p.tag || "",
    shipping: p.shipping,
    description: p.description || "",
    collections: membership.get(p.id) || [],
  }));

  return { categories, collections, products };
}

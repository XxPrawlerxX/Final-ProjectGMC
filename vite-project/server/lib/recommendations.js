// Builds the "for you" sections shown on the home page and the shopper's dashboard.
// What a shopper sees depends on their choice: retail, bulk (B2B) or both.
import { Order } from "../models/Order.js";
import { Product, toProductDto } from "../models/Product.js";
import { User } from "../models/User.js";
import { audienceFilter } from "./access.js";
import { rankByAffinity, sectionsForMode, topCategories } from "./recommend.js";

async function interestCategories(user) {
  if (!user) return { categories: [], orderedSlugs: [] };
  const orders = await Order.find({ user: user._id, status: { $in: ["paid", "review"] } })
    .sort({ createdAt: -1 })
    .limit(10);
  const orderedSlugs = [...new Set(orders.flatMap((o) => o.items.map((i) => i.slug)))];
  const known = await Product.find({ slug: { $in: [...user.wishlist, ...orderedSlugs] } }).select("categorySlug");
  return { categories: topCategories(known.map((p) => p.categorySlug)), orderedSlugs };
}

export async function recommendFor(user, { limit = 8 } = {}) {
  const mode = user?.buyer?.mode || "retail";
  const visible = { active: true, stock: { $gt: 0 }, ...audienceFilter(user) };
  const { categories, orderedSlugs } = await interestCategories(user);
  const personal = categories.length > 0;

  const listings = async (listingType) => {
    const found = await Product.find({ ...visible, listingType }).sort({ createdAt: -1 }).limit(60);
    return rankByAffinity(found, categories).slice(0, limit).map(toProductDto);
  };

  const builders = {
    "for-you": async () => ({
      title: personal ? "Recommended for you" : "New in the shop",
      subtitle: personal ? "Based on what you've saved and bought" : "Fresh retail finds",
      link: "/",
      products: await listings("retail"),
    }),
    preloved: async () => ({
      title: "Pre-loved finds",
      subtitle: "Second-hand items from people near you",
      link: "/preloved",
      products: await listings("secondhand"),
    }),
    "bulk-deals": async () => ({
      title: "Bulk deals for your business",
      subtitle: "Wholesale prices that drop as you order more",
      link: "/wholesale",
      products: await listings("bulk"),
    }),
    suppliers: async () => {
      const sellers = await User.find({ "seller.sellerType": "wholesale", "seller.status": "active" }).limit(6);
      const counts = await Product.aggregate([
        { $match: { listingType: "bulk", active: true, sellerSlug: { $in: sellers.map((s) => s.seller.storeSlug) } } },
        { $group: { _id: "$sellerSlug", n: { $sum: 1 } } },
      ]);
      const countOf = new Map(counts.map((c) => [c._id, c.n]));
      return {
        title: "Wholesale suppliers",
        subtitle: "Stores that sell in bulk",
        link: "/wholesale",
        suppliers: sellers.map((s) => ({
          name: s.seller.storeName,
          slug: s.seller.storeSlug,
          city: s.seller.city,
          state: s.seller.state,
          verified: s.seller.verified,
          productCount: countOf.get(s.seller.storeSlug) ?? 0,
        })),
      };
    },
    reorder: async () => {
      const found = await Product.find({ slug: { $in: orderedSlugs }, active: true, ...audienceFilter(user) });
      const bySlug = new Map(found.map((p) => [p.slug, p]));
      return {
        title: "Order again",
        subtitle: "Things you've bought before",
        link: "/account?tab=orders",
        products: orderedSlugs.map((slug) => bySlug.get(slug)).filter(Boolean).slice(0, limit).map(toProductDto),
      };
    },
  };

  const sections = [];
  for (const key of sectionsForMode(mode)) {
    const section = await builders[key]();
    if (section.products?.length || section.suppliers?.length) sections.push({ key, ...section });
  }
  return { mode, sections };
}

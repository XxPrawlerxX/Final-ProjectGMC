const productImages = {
  fashion: [
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85",
  ],
  home: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85",
  ],
  automotive: [
    "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=85",
  ],
};

const categories = {
  Automotive: [
    "automotive",
    "Road-ready accessories",
    "Upgrade every trip with practical car essentials.",
  ],
  Appliances: [
    "home",
    "Smarter home routines",
    "Useful kitchen and home helpers for everyday living.",
  ],
  "Women's Clothing": [
    "fashion",
    "Style that moves with you",
    "Fresh silhouettes and polished everyday pieces.",
  ],
  "Men's Clothing": [
    "fashion",
    "Built for your everyday",
    "Clean fits and dependable essentials.",
  ],
  Furniture: [
    "home",
    "Make space feel like yours",
    "Comfortable furniture for modern rooms.",
  ],
  "Toys & Games": [
    "home",
    "Playtime made brighter",
    "Creative toys and games for curious minds.",
  ],
  "Beauty & Health": [
    "fashion",
    "Small rituals, better days",
    "Beauty tools and wellness essentials.",
  ],
  Shoes: [
    "fashion",
    "Step into your next move",
    "Comfortable pairs designed for busy days.",
  ],
  "Cell Phones & Accessories": [
    "electronics",
    "Keep your world connected",
    "Smart accessories for work and play.",
  ],
  "Hair Extensions & Wigs": [
    "fashion",
    "Your look, your way",
    "Texture, volume, and confidence for every occasion.",
  ],
  Electronics: [
    "electronics",
    "Useful tech, beautifully chosen",
    "Reliable devices and accessories.",
  ],
  "Pet Supplies": [
    "home",
    "Good things for good companions",
    "Comfort, care, and play for pets.",
  ],
  "Jewelry & Accessories": [
    "fashion",
    "The finishing touch",
    "Simple pieces for every outfit.",
  ],
  "Tools & Home Improvement": [
    "home",
    "Make every project easier",
    "Practical tools and upgrades for your space.",
  ],
  "Sports & Outdoors": [
    "automotive",
    "Move more, go further",
    "Gear for training and weekends.",
  ],
  "Patio, Lawn & Garden": [
    "home",
    "Bring life outside",
    "Finds for patios, balconies, and gardens.",
  ],
  "Food & Grocery": [
    "home",
    "Everyday pantry finds",
    "Helpful kitchen and grocery essentials.",
  ],
  "Bags & Luggage": [
    "fashion",
    "Carry it your way",
    "Versatile bags for commutes and travel.",
  ],
  "Novelty & Special Use": [
    "home",
    "A little more personality",
    "Unexpected finds for memorable moments.",
  ],
  "Motorcycles & Powersports": [
    "automotive",
    "Ride with confidence",
    "Practical riding accessories.",
  ],
  "Baby & Maternity": [
    "home",
    "Gentle essentials for new days",
    "Practical products for growing families.",
  ],
  "Books & Media": [
    "home",
    "Stories for every shelf",
    "Reading and media picks.",
  ],
  "Office & School Supplies": [
    "electronics",
    "Better tools for better focus",
    "Organize work and study.",
  ],
  "Arts, Crafts & Sewing": [
    "fashion",
    "Make something meaningful",
    "Materials for creative time.",
  ],
  "Business, Industry & Science": [
    "electronics",
    "Ready for serious work",
    "Dependable workplace supplies.",
  ],
  "Bundle deals": [
    "electronics",
    "More value in one box",
    "Curated bundles that make choosing easier.",
  ],
  Choice: [
    "fashion",
    "Choice picks, clearly selected",
    "A focused edit of products worth a closer look.",
  ],
  SuperDeals: [
    "electronics",
    "Limited-time value",
    "Popular finds at attractive prices.",
  ],
  "AliExpress Business": [
    "home",
    "Stock up with confidence",
    "Practical business supplies.",
  ],
};

const productNames = {
  fashion: [
    "Soft-touch crossbody bag",
    "Relaxed cotton overshirt",
    "Everyday gold-tone watch",
    "Lightweight travel sneakers",
  ],
  electronics: [
    "Magnetic phone stand",
    "Compact wireless earbuds",
    "Fast-charge power bank",
    "Smart desk lamp",
  ],
  home: [
    "Textured accent cushion",
    "Warm ambient table lamp",
    "Minimal storage basket",
    "Soft woven throw",
  ],
  automotive: [
    "Portable tire inflator",
    "Magnetic car phone mount",
    "Interior LED light kit",
    "All-purpose car organiser",
  ],
};

const prices = {
  fashion: [18500, 24900, 32900, 45000],
  electronics: [12900, 28500, 39900, 64500],
  home: [15900, 28900, 42500, 68000],
  automotive: [21900, 29500, 34900, 57000],
};

export const categoryNames = Object.keys(categories);

export function slugifyCategory(category) {
  return category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function categoryFromSlug(slug) {
  return (
    categoryNames.find((category) => slugifyCategory(category) === slug) ||
    "Electronics"
  );
}

export function formatNaira(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCategoryData(category) {
  const [group, headline, description] =
    categories[category] || categories.Electronics;

  return {
    category,
    headline,
    description,
    heroImage: productImages[group][0],
    products: productNames[group].map((name, index) => ({
      id: `${slugifyCategory(category)}-${index}`,
      name,
      price: prices[group][index],
      oldPrice: Math.round(prices[group][index] * 1.22),
      image: productImages[group][index],
      tag: index === 0 ? "Popular" : index === 1 ? "New" : "Top pick",
      shipping: index % 2 === 0 ? "Free delivery" : "Fast delivery",
    })),
  };
}

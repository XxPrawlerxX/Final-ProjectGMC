import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  // Facebook,
  Globe2,
  // Instagram,
  Mail,
  Menu,
  Search,
  ShoppingCart,
  Smartphone,
  // Twitter,
  // Youtube,
  X,
} from "lucide-react";
import { FaFacebookF } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";

import { formatNaira, slugifyCategory } from "./categoryData";

const categories = [
  "Automotive",
  "Appliances",
  "Women's Clothing",
  "Men's Clothing",
  "Furniture",
  "Toys & Games",
  "Beauty & Health",
  "Shoes",
  "Cell Phones & Accessories",
  "Hair Extensions & Wigs",
  "Electronics",
  "Pet Supplies",
  "Jewelry & Accessories",
  "Tools & Home Improvement",
  "Sports & Outdoors",
  "Patio, Lawn & Garden",
  "Food & Grocery",
  "Bags & Luggage",
  "Novelty & Special Use",
  "Motorcycles & Powersports",
  "Baby & Maternity",
  "Books & Media",
  "Office & School Supplies",
  "Arts, Crafts & Sewing",
  "Business, Industry & Science",
];

const navItems = [
  "Bundle deals",
  "Choice",
  "SuperDeals",
  "Automotive",
  "Appliances",
  "Women's Clothing",
  "Men's Clothing",
  "Furniture",
];

const essentialCategories = [
  [
    "Phones & Tablets",
    "Cell Phones & Accessories",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=85",
  ],
  [
    "Appliances deals",
    "Appliances",
    "/manus-storage/marketfind-home-appliances_a7c6637e.jpg",
  ],
  [
    "Kids, Baby And More",
    "Baby & Maternity",
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=500&q=85",
  ],
  [
    "Fashion deals",
    "Women's Clothing",
    "/manus-storage/marketfind-fashion-lifestyle_ffc6d532.jpg",
  ],
  [
    "Beauty Must Have",
    "Beauty & Health",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=500&q=85",
  ],
  [
    "Sneakers deals",
    "Shoes",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=85",
  ],
  [
    "New Arrival",
    "Electronics",
    "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=500&q=85",
  ],
  [
    "Home & Office deals",
    "Furniture",
    "/manus-storage/marketfind-home-living_7d29842f.jpg",
  ],
  [
    "Supermarket deals",
    "Food & Grocery",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=85",
  ],
  [
    "Mobile Accessories deals",
    "Cell Phones & Accessories",
    "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=500&q=85",
  ],
  [
    "Computing deals",
    "Electronics",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=85",
  ],
];
const marketShelves = [
  {
    title: "Budget Jewelry",
    subtitle: "As low as ₦10,000",
    category: "Jewelry & Accessories",
    items: [
      [
        "Gold 9-Piece Knuckle Ring Set",
        1831,
        5049,
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "3-in-1 Necklace and Earring Set",
        1990,
        2390,
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "13-in-1 Knuckle Ring Collection",
        2200,
        4100,
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Layered Ankle Bracelet",
        2130,
        3050,
        "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Silver Heart Earrings",
        3780,
        8510,
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Five-piece Chain Bracelet Set",
        2200,
        3990,
        "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=85",
      ],
    ],
  },
  {
    title: "Power Banks",
    subtitle: "Up to 50% off",
    category: "Electronics",
    items: [
      [
        "GDTINA 30000mAh Fast-Charge Bank",
        14900,
        32000,
        "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "EASYPIE 20000mAh Ultra Bank",
        7499,
        14400,
        "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "itel 20000mAh Dual Output Bank",
        15750,
        20000,
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "C Idea 30000mAh Type-C Bank",
        12800,
        14890,
        "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Oraimo Traveler Power Bank",
        17597,
        27360,
        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "MKTEL M200 Power Bank",
        10196,
        17707,
        "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=85",
      ],
    ],
  },
  {
    title: "Large TVs",
    subtitle: "Up to 50% off",
    category: "Electronics",
    items: [
      [
        "TCL 55-inch UHD 4K Google TV",
        449999,
        660000,
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "LP Smart TV 43-inch Android TV",
        178742,
        328500,
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "LP Smart TV 50-inch 4K UHD",
        282828,
        455700,
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Royal 50-inch QLED Google TV",
        339622,
        563233,
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "LP Smart TV 55-inch Voice Control",
        350000,
        481648,
        "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Hikers 55-inch Smart TV UHD",
        368640,
        432000,
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=700&q=85",
      ],
    ],
  },
  {
    title: "Bedding",
    subtitle: "Up to 60% off",
    category: "Furniture",
    items: [
      [
        "Exclusive Duvet Bed Set",
        26900,
        29999,
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Waterproof Mattress Protector",
        8580,
        21450,
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Golden Rose Elegance Bedding",
        16000,
        29000,
        "https://images.unsplash.com/photo-1616627561950-9f746e330187?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Bedding Set with Two Pillows",
        3494,
        6932,
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Quality Star Print Bedding",
        8000,
        15000,
        "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=700&q=85",
      ],
      [
        "Breathable Six-piece Bedding Set",
        12960,
        23040,
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=85",
      ],
    ],
  },
];
const limitedStockDeals = [
  [
    "Samsung Galaxy A17 5G Smartphone",
    235814,
    289000,
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "LP Smart TV 32-inch Android TV",
    120802,
    189000,
    "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Dettol Skincare Blossom Set",
    3600,
    5400,
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "EcoFlow DELTA Pro Power Station",
    3231835,
    3799000,
    "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Silver Crest 2-in-1 Blender",
    21999,
    26386,
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "GQT Light Makeup Brush Set",
    2685,
    4200,
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Royal 43-inch Google Smart TV",
    229983,
    419000,
    "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Women's Halter Neck Dress",
    10224,
    22800,
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Black Frameless Wall Clock",
    5210,
    11800,
    "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Maxi 20L Electric Oven",
    62640,
    94000,
    "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Yara Baby Diaper Size 5",
    1125,
    1800,
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Poco C61 Pro 6GB Smartphone",
    129000,
    165000,
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85",
  ],
];

const topSellingItems = [
  [
    "EASYPIE 20000mAh Ultra Bank",
    7499,
    14400,
    "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Silver Crest 2-in-1 Blender",
    21999,
    26386,
    "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Hansen Electric Iron",
    5999,
    7777,
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "GDTINA 30000mAh Power Bank",
    14900,
    32000,
    "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "Silver Crest Extra Large Air Fryer",
    29999,
    44000,
    "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=700&q=85",
  ],
  [
    "itel 20000mAh Power Bank",
    7599,
    11400,
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=700&q=85",
  ],
];
const products = [
  {
    name: "Aurora Smart Watch",
    category: "HEALTH + STYLE",
    discount: "20% OFF",
    description:
      "Track your day, calls, sleep, and movement with a clean wrist-first design.",
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=90",
  },
  {
    name: "Studio Noise-Cancelling Headphones",
    category: "SOUND, REFINED",
    discount: "20% OFF",
    description:
      "A quieter commute and a richer listening experience in one comfortable pair.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=90",
  },
  {
    name: "Everyday Carry Pack",
    category: "READY FOR MORE",
    discount: "20% OFF",
    description:
      "Room for the essentials, built for busy mornings, quick trips, and weekends away.",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1600&q=90",
  },
];
export default function Home({ onSignIn, onCategorySelect }) {
  const [activeProduct, setActiveProduct] = useState(0);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveProduct((current) => (current + 1) % products.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  function showNotice(message) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 2200);
  }

  function handleSearch(event) {
    event.preventDefault();

    showNotice(query ? `Searching for “${query}”` : "Type a product to search");
  }

  function subscribeToNewsletter(event) {
    event.preventDefault();

    if (!newsletterEmail.trim()) {
      showNotice("Enter your email address first");
      return;
    }

    showNotice("Thanks — newsletter signup saved");
    setNewsletterEmail("");
  }

  function openCategory(category) {
    setCategoryOpen(false);
    setMobileOpen(false);
    onCategorySelect?.(slugifyCategory(category));
  }

  const product = products[activeProduct];

  return (
    <div className="storefront-shell">
      <div className="announcement-bar">
        Free gifts without any money
        <span>•</span>
        New finds added every day
      </div>

      <header className="store-header">
        <div className="header-main">
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <button
            className="wordmark"
            onClick={() => showNotice("Home selected")}
            aria-label="Go home"
          >
            <span className="wordmark-lockup">
              <img
                className="brand-logo"
                src="/marketfind-logo.png"
                alt="Marketfind logo"
              />
            </span>
          </button>

          <form className="search-bar" onSubmit={handleSearch}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, brands and more"
              aria-label="Search products"
            />

            <button type="submit" aria-label="Search">
              <Search size={19} />
            </button>
          </form>

          <div className="utility-actions">
            <button onClick={() => showNotice("Download app coming soon")}>
              Download app
            </button>

            <button
              onClick={() => showNotice("Language and currency settings")}
            >
              <Globe2 size={16} />
              EN / NGN
              <ChevronDown size={13} />
            </button>

            <div
              className="account-control"
              onClick={(event) => event.stopPropagation()}
            >
              <button onClick={() => setAccountOpen(!accountOpen)}>
                <CircleUserRound size={18} />
                Sign in / Register
              </button>

              {accountOpen && (
                <div className="account-popover">
                  <button
                    className="popover-primary"
                    onClick={() => {
                      setAccountOpen(false);
                      onSignIn?.();
                    }}
                  >
                    Sign in
                  </button>

                  <button
                    onClick={() => showNotice("Registration coming soon")}
                  >
                    Register
                  </button>

                  <hr />

                  <button onClick={() => showNotice("My Orders coming soon")}>
                    My Orders
                  </button>

                  <button onClick={() => showNotice("Wish List coming soon")}>
                    Wish List
                  </button>

                  <button onClick={() => showNotice("Settings coming soon")}>
                    Settings
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => showNotice("Your cart is empty")}>
              <ShoppingCart size={18} />
              Cart
              <b>0</b>
            </button>
          </div>
        </div>

        <nav className="category-nav" aria-label="Primary navigation">
          <button
            className="all-categories-button"
            onClick={() => setCategoryOpen(!categoryOpen)}
          >
            All Categories
            <span>
              <ChevronDown size={15} />
            </span>
          </button>

          {navItems.map((item, index) => (
            <button
              key={item}
              className={index === 0 ? "nav-highlight" : ""}
              onClick={() => openCategory(item)}
            >
              {item}
            </button>
          ))}

          <button onClick={() => showNotice("More categories coming soon")}>
            More
            <ChevronDown size={14} />
          </button>
        </nav>

        {categoryOpen && (
          <div className="mega-menu">
            <div className="category-list">
              <p>SHOP BY CATEGORY</p>

              {categories.map((category) => (
                <button key={category} onClick={() => openCategory(category)}>
                  {category}
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>

            <div className="mega-feature">
              <p>CURATED PICKS</p>

              <h2>
                Small upgrades.
                <br />
                Better every day.
              </h2>

              <span>
                Explore practical products selected for work, home, and travel.
              </span>

              <button onClick={() => showNotice("Curated picks selected")}>
                Shop picks
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </header>

      {mobileOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-heading">
            <span>Browse marketplace</span>

            <button onClick={() => setMobileOpen(false)}>
              <X size={21} />
            </button>
          </div>

          <button
            className="mobile-all-categories"
            onClick={() => setCategoryOpen(!categoryOpen)}
          >
            All Categories
            <ChevronDown size={17} />
          </button>

          {navItems.map((item) => (
            <button key={item} onClick={() => openCategory(item)}>
              {item}
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      )}

      <main>
      

        {/* ================================
            PRODUCT HERO
        ================================= */}

        <section className="product-hero">
          <div className="hero-copy">
            <p className="hero-eyebrow">{product.category}</p>

            <div className="discount-badge">{product.discount}</div>

            <h1>{product.name}</h1>

            <p>{product.description}</p>

            <button
              className="hero-button"
              onClick={() => showNotice(`${product.name} selected`)}
            >
              Shop now
              <ChevronRight size={18} />
            </button>

            <div className="hero-controls">
              <div className="hero-dots">
                {products.map((item, index) => (
                  <button
                    key={item.name}
                    className={index === activeProduct ? "active" : ""}
                    onClick={() => setActiveProduct(index)}
                    aria-label={`Show ${item.name}`}
                  />
                ))}
              </div>

              <span>
                {String(activeProduct + 1).padStart(2, "0")} /{" "}
                {String(products.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="hero-image-panel">
            <img src={product.image} alt={product.name} />

            <div className="image-caption">
              <span>Featured product</span>
              <strong>{product.name}</strong>
            </div>
          </div>
        </section>

        {/* ================================
            MARKET SHELVES
        ================================= */}

        <section
          className="market-shelves"
          aria-label="Featured product collections"
        >
          {marketShelves.map((shelf) => (
            <section className="market-shelf" key={shelf.title}>
              <div className="shelf-heading">
                <div>
                  <h2>{shelf.title}</h2>
                  <span>{shelf.subtitle}</span>
                </div>

                <button onClick={() => openCategory(shelf.category)}>
                  See All
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="shelf-products">
                {shelf.items.map(([name, price, oldPrice, image]) => (
                  <article className="shelf-card" key={name}>
                    <button
                      className="shelf-card-image"
                      onClick={() => showNotice(`${name} selected`)}
                      aria-label={`View ${name}`}
                    >
                      <img src={image} alt={name} loading="lazy" />

                      <span>-{Math.round((1 - price / oldPrice) * 100)}%</span>
                    </button>

                    <button
                      className="shelf-card-name"
                      onClick={() => showNotice(`${name} selected`)}
                    >
                      {name}
                    </button>

                    <strong>{formatNaira(price)}</strong>

                    <del>{formatNaira(oldPrice)}</del>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        {/* ================================
            LIMITED STOCK DEALS
        ================================= */}

        <section
          className="dense-deals-section"
          aria-label="Limited Stock Deals"
        >
          <div className="dense-deals-heading">
            <div>
              <h2>Limited Stock Deals</h2>
              <span>Up to 70% off</span>
            </div>

            <button
              onClick={() => showNotice("All limited stock deals selected")}
            >
              See All
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="dense-deals-grid">
            {limitedStockDeals.map(([name, price, oldPrice, image]) => (
              <article className="dense-product-card" key={name}>
                <button
                  className="dense-product-image"
                  onClick={() => showNotice(`${name} selected`)}
                  aria-label={`View ${name}`}
                >
                  <img src={image} alt={name} loading="lazy" />

                  <span>-{Math.round((1 - price / oldPrice) * 100)}%</span>
                </button>

                <button
                  className="dense-product-name"
                  onClick={() => showNotice(`${name} selected`)}
                >
                  {name}
                </button>

                <strong>{formatNaira(price)}</strong>

                <del>{formatNaira(oldPrice)}</del>
              </article>
            ))}
          </div>
        </section>

        {/* ================================
            TOP SELLING
        ================================= */}

        <section
          className="dense-deals-section top-selling-section"
          aria-label="Top Selling Items"
        >
          <div className="dense-deals-heading">
            <div>
              <h2>Top Selling Items</h2>

              <span>Popular picks shoppers love</span>
            </div>

            <button
              onClick={() => showNotice("All top selling items selected")}
            >
              See All
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="dense-deals-grid">
            {topSellingItems.map(([name, price, oldPrice, image]) => (
              <article className="dense-product-card" key={name}>
                <button
                  className="dense-product-image"
                  onClick={() => showNotice(`${name} selected`)}
                  aria-label={`View ${name}`}
                >
                  <img src={image} alt={name} loading="lazy" />

                  <span>-{Math.round((1 - price / oldPrice) * 100)}%</span>
                </button>

                <button
                  className="dense-product-name"
                  onClick={() => showNotice(`${name} selected`)}
                >
                  {name}
                </button>

                <strong>{formatNaira(price)}</strong>

                <del>{formatNaira(oldPrice)}</del>
              </article>
            ))}
          </div>
        </section>

        {/* ================================
            ESSENTIALS
        ================================= */}

        <section className="essentials-panel" aria-label="All your essentials">
          <div className="essentials-heading">
            <h2>All Your Essentials in One Place</h2>
          </div>

          <div className="essentials-grid">
            {essentialCategories.map(([label, category, image]) => (
              <button
                className="essential-card"
                key={label}
                onClick={() => openCategory(category)}
              >
                <span className="essential-image-wrap">
                  <img src={image} alt={label} loading="lazy" />
                </span>

                <strong>{label}</strong>
              </button>
            ))}

            <button
              className="essential-card essential-buy-now"
              onClick={() => showNotice("Buy now, pay small small")}
            >
              <span className="buy-now-copy">
                BUY NOW
                <br />
                PAY SMALL SMALL
              </span>

              <strong>Buy Now, Pay Small Small</strong>
            </button>
          </div>
        </section>
      </main>

      {/* ================================
          FOOTER
      ================================= */}

      <footer className="market-footer">
        <section className="footer-newsletter">
          <div className="footer-newsletter-copy">
            <p className="footer-kicker">NEW TO MARKETFIND?</p>

            <h2>Fresh finds, sent your way.</h2>

            <p>
              Subscribe for new arrivals, useful deals, and special offers from
              across the marketplace.
            </p>
          </div>

          <form
            className="footer-subscribe-form"
            onSubmit={subscribeToNewsletter}
          >
            <label htmlFor="newsletter-email">Email address</label>

            <div>
              <Mail size={17} />

              <input
                id="newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Enter your email address"
              />

              <button type="submit">Subscribe</button>
            </div>

            <small>
              By subscribing, you agree to receive Marketfind updates.
            </small>
          </form>

          <div className="footer-app-promo">
            <Smartphone size={26} />

            <div>
              <strong>Shop on the go</strong>

              <span>Download the Marketfind app</span>
            </div>

            <button onClick={() => showNotice("App download coming soon")}>
              Get the app
            </button>
          </div>
        </section>

        <section className="footer-main">
          <div className="footer-brand-column">
            <div className="footer-wordmark">
              market<span>find</span>
            </div>

            <p>
              Everyday discoveries for your home, style, work, and next big
              idea.
            </p>

            <h3>Connect with us</h3>

            <div className="footer-socials">
              <button
                onClick={() => showNotice("Facebook coming soon")}
                aria-label="Facebook"
              >
                <FaFacebookF />
              </button>

              <button
                onClick={() => showNotice("Instagram coming soon")}
                aria-label="Instagram"
              >
                <FaInstagram />
              </button>

              <button
                onClick={() => showNotice("Twitter coming soon")}
                aria-label="Twitter"
              >
                <FaTwitter />
              </button>

              <button
                onClick={() => showNotice("YouTube coming soon")}
                aria-label="YouTube"
              >
                <FaYoutube />
              </button>
            </div>
          </div>

          <div className="footer-link-column">
            <h3>Need help?</h3>

            <button onClick={() => showNotice("Chat support coming soon")}>
              Chat with us
            </button>

            <button onClick={() => showNotice("Help center coming soon")}>
              Help center
            </button>

            <button onClick={() => showNotice("Contact page coming soon")}>
              Contact us
            </button>

            <h3>Useful links</h3>

            <button onClick={() => showNotice("How to shop coming soon")}>
              How to shop
            </button>

            <button
              onClick={() => showNotice("Delivery information coming soon")}
            >
              Delivery information
            </button>

            <button
              onClick={() => showNotice("Returns information coming soon")}
            >
              Returns and refunds
            </button>
          </div>

          <div className="footer-link-column">
            <h3>About Marketfind</h3>

            <button onClick={() => showNotice("About page coming soon")}>
              About us
            </button>

            <button onClick={() => showNotice("Careers coming soon")}>
              Marketfind careers
            </button>

            <button onClick={() => showNotice("Terms coming soon")}>
              Terms and conditions
            </button>

            <button onClick={() => showNotice("Privacy page coming soon")}>
              Privacy notice
            </button>

            <button onClick={() => showNotice("Cookie settings coming soon")}>
              Cookie preferences
            </button>
          </div>

          <div className="footer-link-column">
            <h3>Make money with us</h3>

            <button onClick={() => showNotice("Selling page coming soon")}>
              Sell on Marketfind
            </button>

            <button onClick={() => showNotice("Vendor hub coming soon")}>
              Vendor hub
            </button>

            <button onClick={() => showNotice("Business sales coming soon")}>
              Business sales
            </button>

            <h3>International</h3>

            <div className="footer-country-list">
              <span>Nigeria</span>
              <span>Ghana</span>
              <span>Kenya</span>
              <span>Uganda</span>
            </div>
          </div>
        </section>

        <section className="footer-contact-row">
          <div>
            <h3>Contact us</h3>

            <p>Marketfind Nigeria</p>

            <p>4 alhaji Ganiyu, Lekki, Lagos, Nigeria</p>

            <p>Phone: +23416313124</p>

            <p>WhatsApp: +2347057095939</p>
          </div>

          <div>
            <h3>Payment methods</h3>

            <div className="footer-payment-list">
              <span>Card</span>
              <span>Visa</span>
              <span>Mastercard</span>
              <span>Pay</span>
            </div>
          </div>
        </section>

        <div className="footer-bottom">
          <span>© 2026 Marketfind. All rights reserved.</span>

          <span>Secure shopping • Reliable delivery • Local prices in NGN</span>
        </div>
      </footer>

      {notice && (
        <button className="toast-message" onClick={() => setNotice("")}>
          {notice}
          <span>×</span>
        </button>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import {slugifyCategory} from "./categoryData"
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Globe2,
  Menu,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

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
    name: "Studio Noise Cancelling Headphones",
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

export default function Home({onSignIn,onCategorySelect}) {
  const [activeProduct, setActiveProduct] = useState(0);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveProduct((current) => (current + 1) % products.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function handleSearch(event) {
    event.preventDefault();
    showNotice(query ? `Searching for “${query}”` : "Type a product to search");
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
            <small>E-commerce</small>
            <strong>
              market<span>find</span>
            </strong>
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
                      onSignIn();
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
                <button
                  key={category}
                  onClick={() => openCategory(category)}
                >
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
            <button
              key={item}
              onClick={() => {
                showNotice(`${item} selected`);
                setMobileOpen(false);
              }}
            >
              {item}
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      )}

      <main>
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
                {String(activeProduct + 1).padStart(2, "0")} / 0
                {products.length}
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
      </main>

      {notice && (
        <button className="toast-message" onClick={() => setNotice("")}>
          {notice}
          <span>×</span>
        </button>
      )}
    </div>
  );
}

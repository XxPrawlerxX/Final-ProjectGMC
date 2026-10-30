import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { productPath, slugify } from "./catalog";
import { useCart } from "./useCart";

import { categories, navItems, essentialCategories, marketShelves, limitedStockDeals, topSellingItems, products } from "./homeData";

export default function Home() {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
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

    if (!query.trim()) {
      showNotice("Type a product to search");
      return;
    }

    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
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
    navigate(`/category/${slugifyCategory(category)}`);
    window.scrollTo({ top: 0 });
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
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
                      navigate("/signin");
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
            <button
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart size={18} />
              Cart
              <b>{cartCount}</b>
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
              onClick={() => {
                addToCart(product);
                showNotice(`${product.name} added to cart`);
              }}
            >
              Add to cart
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
                      onClick={() => navigate(productPath(slugify(name)))}
                      aria-label={`View ${name}`}
                    >
                      <img src={image} alt={name} loading="lazy" />

                      <span>-{Math.round((1 - price / oldPrice) * 100)}%</span>
                    </button>

                    <button
                      className="shelf-card-image"
                      onClick={() => navigate(productPath(slugify(name)))}
                      aria-label={`View ${name}`}
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
                  onClick={() => navigate(productPath(slugify(name)))}
                  aria-label={`View ${name}`}
                >
                  <img src={image} alt={name} loading="lazy" />

                  <span>-{Math.round((1 - price / oldPrice) * 100)}%</span>
                </button>

                <button
                  className="dense-product-name"
                  onClick={() => navigate(productPath(slugify(name)))}
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
                  onClick={() => navigate(productPath(slugify(name)))}
                  aria-label={`View ${name}`}
                >
                  <img src={image} alt={name} loading="lazy" />

                  <span>-{Math.round((1 - price / oldPrice) * 100)}%</span>
                </button>

                <button
                  className="dense-product-name"
                  onClick={() => navigate(productPath(slugify(name)))}
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
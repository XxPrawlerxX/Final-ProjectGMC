import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Globe2,
  Mail,
  Menu,
  Search,
  ShoppingCart,
  Smartphone,
  X,
} from "lucide-react";
import { FaFacebookF } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";

import { formatNaira } from "../categoryUtils";
import { getCategories } from "../api/categoryApi";
import { getProducts } from "../api/productApi";
// Reused here for .product-shop-button, so the explicit "Add to cart"
// buttons on this page match CategoryPage's/ProductDetail's styling.
import "./category.css";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { cart, addItem } = useCart();
  const { wishlist } = useWishlist();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [activeProduct, setActiveProduct] = useState(0);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  // Real categories and products, replacing the page's original mock
  // data. Categories drive the nav/mega-menu/essentials sections;
  // products are reused across the hero, shelves, and deals sections
  // below (there's no backend concept of "curated shelves" or "top
  // selling" — those sections are derived from the same real product
  // list rather than inventing fake ones).
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));

    getProducts({ limit: 40 })
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, []);

  const heroProducts = products.slice(0, 3);
  const activeHeroProduct = heroProducts[activeProduct] || null;

  const navCategories = categories.slice(0, 8);

  const shelves = categories
    .map((category) => ({
      category,
      items: products.filter((product) => product.category?._id === category._id),
    }))
    .filter((shelf) => shelf.items.length > 0)
    .slice(0, 4);

  const limitedStockDeals = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  );

  const topSellingItems = [...products].reverse().slice(0, 12);

  const essentialCategories = categories.slice(0, 10);

  useEffect(() => {
    if (heroProducts.length === 0) return undefined;

    const timer = window.setInterval(() => {
      setActiveProduct((current) => (current + 1) % heroProducts.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [heroProducts.length]);

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

  function openCategory(slug) {
    setCategoryOpen(false);
    setMobileOpen(false);
    navigate(`/category/${slug}`);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleAddToCart(product) {
    if (!isAuthenticated) {
      showNotice("Please sign in to add items to your cart");
      window.setTimeout(() => navigate("/signin", { state: { from: "/" } }), 900);
      return;
    }

    const result = await addItem(product._id, 1);

    showNotice(result.ok ? `${product.name} added to cart` : result.message);
  }

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
            onClick={() => navigate("/")}
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
                {isAuthenticated ? `Hi, ${user.name.split(" ")[0]}` : "Sign in / Register"}
              </button>

              {accountOpen && (
                <div className="account-popover">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          navigate("/orders");
                        }}
                      >
                        My Orders
                      </button>

                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          navigate("/vendor");
                        }}
                      >
                        {user.role === "vendor" ? "Vendor Dashboard" : "Sell on Marketfind"}
                      </button>

                      {user.role === "admin" && (
                        <button
                          onClick={() => {
                            setAccountOpen(false);
                            navigate("/admin");
                          }}
                        >
                          Admin Dashboard
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          navigate("/wishlist");
                        }}
                      >
                        Wish List ({wishlist.products.length})
                      </button>

                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          navigate("/account");
                        }}
                      >
                        Settings
                      </button>

                      <hr />

                      <button
                        className="popover-primary"
                        onClick={() => {
                          setAccountOpen(false);
                          logout();
                          navigate("/");
                        }}
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
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
                        onClick={() => {
                          setAccountOpen(false);
                          navigate("/register");
                        }}
                      >
                        Register
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => navigate("/cart")}>
              <ShoppingCart size={18} />
              Cart
              <b>{cart.totalItems}</b>
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

          {navCategories.map((category, index) => (
            <button
              key={category._id}
              className={index === 0 ? "nav-highlight" : ""}
              onClick={() => openCategory(category.slug)}
            >
              {category.name}
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
                <button key={category._id} onClick={() => openCategory(category.slug)}>
                  {category.name}
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

          {navCategories.map((category) => (
            <button key={category._id} onClick={() => openCategory(category.slug)}>
              {category.name}
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      )}

      <main>
        {/* ================================
            PRODUCT HERO
        ================================= */}

        {activeHeroProduct && (
          <section className="product-hero">
            <div className="hero-copy">
              <p className="hero-eyebrow">
                {activeHeroProduct.category?.name?.toUpperCase() || "FEATURED"}
              </p>

              {activeHeroProduct.oldPrice && activeHeroProduct.oldPrice > activeHeroProduct.price && (
                <div className="discount-badge">
                  {Math.round(
                    (1 - activeHeroProduct.price / activeHeroProduct.oldPrice) * 100,
                  )}
                  % OFF
                </div>
              )}

              <h1>{activeHeroProduct.name}</h1>

              <p>{activeHeroProduct.description}</p>

              <button
                className="hero-button"
                onClick={() => handleAddToCart(activeHeroProduct)}
              >
                Add to cart
                <ChevronRight size={18} />
              </button>

              <div className="hero-controls">
                <div className="hero-dots">
                  {heroProducts.map((item, index) => (
                    <button
                      key={item._id}
                      className={index === activeProduct ? "active" : ""}
                      onClick={() => setActiveProduct(index)}
                      aria-label={`Show ${item.name}`}
                    />
                  ))}
                </div>

                <span>
                  {String(activeProduct + 1).padStart(2, "0")} /{" "}
                  {String(heroProducts.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div
              className="hero-image-panel"
              onClick={() => navigate(`/product/${activeHeroProduct._id}`)}
              style={{ cursor: "pointer" }}
            >
              <img src={activeHeroProduct.image} alt={activeHeroProduct.name} />

              <div className="image-caption">
                <span>Featured product</span>
                <strong>{activeHeroProduct.name}</strong>
              </div>
            </div>
          </section>
        )}

        {/* ================================
            MARKET SHELVES
        ================================= */}

        <section
          className="market-shelves"
          aria-label="Featured product collections"
        >
          {shelves.map((shelf) => (
            <section className="market-shelf" key={shelf.category._id}>
              <div className="shelf-heading">
                <div>
                  <h2>{shelf.category.name}</h2>
                  <span>{shelf.items.length} product(s) available</span>
                </div>

                <button onClick={() => openCategory(shelf.category.slug)}>
                  See All
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="shelf-products">
                {shelf.items.map((product) => (
                  <article className="shelf-card" key={product._id}>
                    <button
                      className="shelf-card-image"
                      onClick={() => navigate(`/product/${product._id}`)}
                      aria-label={`View ${product.name}`}
                    >
                      <img src={product.image} alt={product.name} loading="lazy" />

                      {product.oldPrice && product.oldPrice > product.price && (
                        <span>
                          -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                        </span>
                      )}
                    </button>

                    <button
                      className="shelf-card-image"
                      onClick={() => navigate(`/product/${product._id}`)}
                      aria-label={`View ${product.name}`}
                    >
                      {product.name}
                    </button>

                    <strong>{formatNaira(product.price)}</strong>

                    {product.oldPrice && product.oldPrice > product.price && (
                      <del>{formatNaira(product.oldPrice)}</del>
                    )}

                    <button
                      className="product-shop-button"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? "Out of stock" : "Add to cart"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>

        {/* ================================
            LIMITED STOCK DEALS
        ================================= */}

        {limitedStockDeals.length > 0 && (
          <section
            className="dense-deals-section"
            aria-label="Limited Stock Deals"
          >
            <div className="dense-deals-heading">
              <div>
                <h2>Limited Stock Deals</h2>
                <span>While supplies last</span>
              </div>

              <button
                onClick={() => showNotice("All limited stock deals selected")}
              >
                See All
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="dense-deals-grid">
              {limitedStockDeals.map((product) => (
                <article className="dense-product-card" key={product._id}>
                  <button
                    className="dense-product-image"
                    onClick={() => navigate(`/product/${product._id}`)}
                    aria-label={`View ${product.name}`}
                  >
                    <img src={product.image} alt={product.name} loading="lazy" />

                    <span>{product.stock} left</span>
                  </button>

                  <button
                    className="dense-product-name"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {product.name}
                  </button>

                  <strong>{formatNaira(product.price)}</strong>

                  {product.oldPrice && product.oldPrice > product.price && (
                    <del>{formatNaira(product.oldPrice)}</del>
                  )}

                  <button
                    className="product-shop-button"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to cart
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ================================
            TOP SELLING
        ================================= */}

        {topSellingItems.length > 0 && (
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
              {topSellingItems.map((product) => (
                <article className="dense-product-card" key={product._id}>
                  <button
                    className="dense-product-image"
                    onClick={() => navigate(`/product/${product._id}`)}
                    aria-label={`View ${product.name}`}
                  >
                    <img src={product.image} alt={product.name} loading="lazy" />

                    {product.oldPrice && product.oldPrice > product.price && (
                      <span>
                        -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                      </span>
                    )}
                  </button>

                  <button
                    className="dense-product-name"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {product.name}
                  </button>

                  <strong>{formatNaira(product.price)}</strong>

                  {product.oldPrice && product.oldPrice > product.price && (
                    <del>{formatNaira(product.oldPrice)}</del>
                  )}

                  <button
                    className="product-shop-button"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? "Out of stock" : "Add to cart"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ================================
            ESSENTIALS
        ================================= */}

        <section className="essentials-panel" aria-label="All your essentials">
          <div className="essentials-heading">
            <h2>All Your Essentials in One Place</h2>
          </div>

          <div className="essentials-grid">
            {essentialCategories.map((category) => (
              <button
                className="essential-card"
                key={category._id}
                onClick={() => openCategory(category.slug)}
              >
                <span className="essential-image-wrap">
                  <img src={category.image} alt={category.name} loading="lazy" />
                </span>

                <strong>{category.name}</strong>
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

            <button onClick={() => navigate("/register")}>
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

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  CircleUserRound,
  Heart,
  LayoutGrid,
  MessageCircle,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useAuth } from "./auth/authContext";
import { useCart } from "./useCart";
import { useCategories } from "./useCategories";
import { usePolling } from "./usePolling";
import { useWishlist } from "./wishlist/wishlistContext";
import "./site.css";

const NAV_COUNT = 8;

// Header shared by every shop page. `search` lets a page filter its own list
// instead of jumping to the search page.
export default function SiteHeader({ activeCategory }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const wishlist = useWishlist();
  const categories = useCategories();
  const unread = usePolling(user ? "/api/chat/unread" : null, 30000);
  const unreadCount = unread.data?.count ?? 0;

  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") || "");
  // Which menu is open, and on which page. A menu opened on another page counts
  // as closed, so navigating away closes it without an effect.
  const pageKey = location.pathname + location.search;
  const [menu, setMenu] = useState({ open: null, at: "" });
  const accountOpen = menu.open === "account" && menu.at === pageKey;
  const menuOpen = menu.open === "menu" && menu.at === pageKey;
  const toggleMenu = (name) =>
    setMenu({ open: menu.open === name && menu.at === pageKey ? null : name, at: pageKey });
  const accountRef = useRef(null);

  // Close menus on Escape or a click elsewhere
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") setMenu({ open: null, at: "" });
    }
    function onClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setMenu((current) => (current.open === "account" ? { open: null, at: "" } : current));
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  async function handleLogout() {
    setMenu({ open: null, at: "" });
    await logout();
    navigate("/");
  }

  const firstName = user?.name.split(" ")[0];

  return (
    <header className="site-header">
      <div className="site-header-main site-container">
        <Link className="site-logo" to="/" aria-label="Marketfind home">
          <img src="/marketfind-logo.png" alt="Marketfind" width="105" height="58" />
        </Link>

        <form className="site-search" role="search" onSubmit={handleSearch}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, brands and more"
            aria-label="Search products"
            maxLength={100}
          />
          <button type="submit" aria-label="Search">
            <Search size={19} />
          </button>
        </form>

        <div className="site-actions">
          <div className="site-account" ref={accountRef}>
            <button
              className="site-action"
              onClick={() => toggleMenu("account")}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <CircleUserRound size={22} />
              <span className="site-action-label">{user ? `Hi, ${firstName}` : "Sign in"}</span>
              <ChevronDown size={14} className="site-action-chevron" />
            </button>

            {accountOpen && (
              <div className="site-popover" role="menu">
                {user ? (
                  <>
                    <div className="site-popover-user">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/account" role="menuitem">My account</Link>
                    <Link to="/messages" role="menuitem">Messages</Link>
                    <Link to="/sell" role="menuitem">{user.seller ? "Seller dashboard" : "Sell on Marketfind"}</Link>
                    <Link to="/account?tab=orders" role="menuitem">Orders</Link>
                    <Link to="/account?tab=wishlist" role="menuitem">Wishlist</Link>
                    <button onClick={handleLogout} role="menuitem">Sign out</button>
                  </>
                ) : (
                  <>
                    <Link className="site-popover-primary" to="/signin" role="menuitem">Sign in</Link>
                    <Link to="/register" role="menuitem">Create account</Link>
                    <Link to="/sell/register" role="menuitem">Sell on Marketfind</Link>
                  </>
                )}
              </div>
            )}
          </div>

          {user && (
            <Link className="site-action" to="/messages" aria-label={`Messages${unreadCount ? `, ${unreadCount} unread` : ""}`}>
              <MessageCircle size={22} />
              <span className="site-action-label">Messages</span>
              {unreadCount > 0 && <b>{unreadCount}</b>}
            </Link>
          )}

          <Link className="site-action" to="/account?tab=wishlist" aria-label="Wishlist">
            <Heart size={22} />
            <span className="site-action-label">Wishlist</span>
            {wishlist.ids.length > 0 && <b>{wishlist.ids.length}</b>}
          </Link>

          <Link className="site-action" to="/cart" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingCart size={22} />
            <span className="site-action-label">Cart</span>
            {cartCount > 0 && <b>{cartCount}</b>}
          </Link>
        </div>
      </div>

      <nav className="site-nav site-container" aria-label="Categories">
        <button
          className="site-nav-all"
          onClick={() => toggleMenu("menu")}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={17} /> : <LayoutGrid size={17} />}
          All categories
        </button>
        <div className="site-nav-scroll">
          <Link to="/wholesale" className="nav-bulk">Wholesale</Link>
          <Link to="/preloved" className="nav-pre">Pre-loved</Link>
          {categories.slice(0, NAV_COUNT).map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className={category.slug === activeCategory ? "active" : ""}
            >
              {category.name}
            </Link>
          ))}
        </div>
        <Link className="site-nav-sell" to={user?.seller ? "/sell" : "/sell/register"}>
          {user?.seller ? "Seller dashboard" : "Sell on Marketfind"}
        </Link>
      </nav>

      {menuOpen && (
        <div className="site-category-panel">
          <div className="site-container">
            <ul>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link to={`/category/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ShoppingCart } from "lucide-react";
import { categoryNames, slugifyCategory } from "./categoryData";
import { useCart } from "./useCart";
import "./category.css";
import "./shop.css";

// Shared header for every page except the home page and sign-in.
// Pass `search` ({ value, onChange, placeholder }) to filter the current page;
// leave it out and the search box takes the shopper to /search instead.
export default function ShopHeader({ activeCategory, search }) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [globalQuery, setGlobalQuery] = useState("");

  const value = search ? search.value : globalQuery;
  const onChange = search ? search.onChange : setGlobalQuery;

  function handleSubmit(event) {
    event.preventDefault();
    if (search) return;
    const trimmed = globalQuery.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="category-page-header">
      <div className="category-header-inner">
        <Link className="category-back-button shop-link" to="/">
          <ArrowLeft size={18} />
          <span>Marketfind</span>
        </Link>

        <form className="category-search" onSubmit={handleSubmit}>
          <Search size={18} />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={search?.placeholder || "Search products, brands and more"}
            aria-label="Search products"
          />
        </form>

        <Link className="category-cart-button shop-link" to="/cart">
          <ShoppingCart size={20} />
          <span>Cart</span>
          <b>{cartCount}</b>
        </Link>
      </div>

      <nav className="category-shortcuts" aria-label="Categories">
        {categoryNames.slice(0, 7).map((item) => (
          <button
            key={item}
            className={item === activeCategory ? "active" : ""}
            onClick={() => navigate(`/category/${slugifyCategory(item)}`)}
          >
            {item}
          </button>
        ))}
      </nav>
    </header>
  );
}

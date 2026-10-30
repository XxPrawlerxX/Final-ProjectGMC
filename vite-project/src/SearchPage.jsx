import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import { searchProducts } from "./catalog";
import { useCart } from "./useCart";
import ShopHeader from "./ShopHeader";
import ProductCard from "./ProductCard";
import "./category.css";
import "./shop.css";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim();
  const { addToCart } = useCart();
  const [notice, setNotice] = useState("");

  const results = searchProducts(query);

  function handleAdd(product) {
    addToCart(product);
    setNotice(`${product.name} added to cart`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  return (
    <div className="shop-page">
      <ShopHeader />

      <main className="shop-main">
        <div className="search-heading">
          <p className="shop-kicker">SEARCH</p>
          <h1>{query ? `Results for “${query}”` : "Search Marketfind"}</h1>
          {query && (
            <span>
              {results.length} {results.length === 1 ? "product" : "products"}{" "}
              found
            </span>
          )}
        </div>

        {results.length > 0 ? (
          <div className="product-grid">
            {results.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAdd}
              />
            ))}
          </div>
        ) : (
          <div className="shop-empty">
            <SearchX size={54} />
            <h1>{query ? "No products found" : "What are you looking for?"}</h1>
            <p>
              {query
                ? "Try a different spelling or a more general word."
                : "Type a product name in the search box above."}
            </p>
            <Link className="shop-primary-link" to="/">
              Browse the marketplace
            </Link>
          </div>
        )}
      </main>

      {notice && (
        <div className="shop-toast" role="status">
          {notice}
          <Link to="/cart">View cart</Link>
        </div>
      )}
    </div>
  );
}

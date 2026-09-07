import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Heart, Search, ShoppingCart, Star } from "lucide-react";
import { formatNaira } from "../categoryUtils";
import { getProducts } from "../api/productApi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
// Reuses CategoryPage's product-grid styling — this is the same kind
// of "browse a list of real products" screen, just filtered by search
// term instead of category.
import "./category.css";

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { cart, addItem } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("featured");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setInputValue(query);

    if (!query) {
      setProducts([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    getProducts({ search: query, limit: 40 })
      .then((data) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const sortedProducts = useMemo(() => {
    if (sort === "low") return [...products].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...products].sort((a, b) => b.price - a.price);
    return products;
  }, [products, sort]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    setSearchParams(inputValue ? { q: inputValue } : {});
  }

  async function handleAddToCart(product) {
    if (!isAuthenticated) {
      showNotice("Please sign in to add items to your cart");
      window.setTimeout(() => navigate("/signin", { state: { from: "/search" } }), 900);
      return;
    }

    const result = await addItem(product._id, 1);
    showNotice(result.ok ? `${product.name} added to cart` : result.message);
  }

  async function handleToggleWishlist(product) {
    if (!isAuthenticated) {
      showNotice("Please sign in to save items");
      window.setTimeout(() => navigate("/signin", { state: { from: "/search" } }), 900);
      return;
    }

    const wasWishlisted = isWishlisted(product._id);
    const result = await toggleWishlist(product._id);

    showNotice(
      result.ok
        ? wasWishlisted
          ? `${product.name} removed from wishlist`
          : `${product.name} saved to wishlist`
        : result.message,
    );
  }

  return (
    <div className="category-page-shell">
      <header className="category-page-header">
        <div className="category-header-inner">
          <button className="category-back-button" onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
            <span>Marketfind</span>
          </button>

          <form className="category-search" onSubmit={handleSearchSubmit}>
            <Search size={18} />
            <input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search products, brands and more"
            />
          </form>

          <button className="category-cart-button" onClick={() => navigate("/cart")}>
            <ShoppingCart size={20} />
            <span>Cart</span>
            <b>{cart.totalItems}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="category-content">
          <div className="category-toolbar">
            <div>
              <p className="category-kicker">SEARCH RESULTS</p>
              <h2>{query ? `"${query}"` : "Search Marketfind"}</h2>
              {query && <span>{sortedProducts.length} product(s) found</span>}
            </div>

            {query && (
              <div className="category-toolbar-actions">
                <label className="sort-select">
                  <span>Sort:</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value)}>
                    <option value="featured">Featured</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                  </select>
                  <ChevronDown size={15} />
                </label>
              </div>
            )}
          </div>

          {!query && <p>Type something above to search the marketplace.</p>}
          {loading && <p>Searching…</p>}
          {error && <p className="signin-form-message">{error}</p>}
          {query && !loading && sortedProducts.length === 0 && (
            <p>No products matched "{query}".</p>
          )}

          <div className="product-grid">
            {sortedProducts.map((product) => (
              <article className="market-product-card" key={product._id}>
                <div
                  className="market-product-image"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <img src={product.image} alt={product.name} />
                  {product.tag && <span className="product-tag">{product.tag}</span>}
                  <button
                    className={`product-wishlist${isWishlisted(product._id) ? " active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleWishlist(product);
                    }}
                    aria-label={
                      isWishlisted(product._id)
                        ? `Remove ${product.name} from wishlist`
                        : `Save ${product.name} to wishlist`
                    }
                  >
                    <Heart size={17} fill={isWishlisted(product._id) ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="market-product-copy">
                  <div className="product-rating">
                    <Star size={14} fill="currentColor" />
                    {product.numReviews > 0 ? product.averageRating.toFixed(1) : "New"}
                    {product.numReviews > 0 && <em>({product.numReviews})</em>}
                  </div>
                  <h3
                    onClick={() => navigate(`/product/${product._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {product.name}
                  </h3>
                  <div className="product-price-row">
                    <strong>{formatNaira(product.price)}</strong>
                    {product.oldPrice && <del>{formatNaira(product.oldPrice)}</del>}
                  </div>
                  <p>{product.shipping || "Standard delivery"}</p>
                  <button
                    className="product-shop-button"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? "Out of stock" : "Add to cart"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {notice && (
        <button className="category-toast" onClick={() => setNotice("")}>
          {notice}
          <span>×</span>
        </button>
      )}
    </div>
  );
}

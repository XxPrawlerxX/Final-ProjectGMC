import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Heart,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { formatNaira } from "../categoryUtils";
import { getCategories } from "../api/categoryApi";
import { getProducts } from "../api/productApi";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import "./category.css";

export default function CategoryPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { cart, addItem } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [notice, setNotice] = useState("");

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  // Real categories are shared across the whole site, so we fetch the
  // full list here (cheap — categories are few) and resolve the current
  // one from the URL slug, rather than baking a fake category into the
  // route.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (!cancelled) setCategories(data);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const category = categories.find((item) => item.slug === slug);

  useEffect(() => {
    if (!category) return;

    let cancelled = false;
    setLoading(true);

    getProducts({ category: category._id, limit: 24 })
      .then((data) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase()),
    );

    if (sort === "low") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, query, sort]);

  async function handleToggleWishlist(product) {
    if (!isAuthenticated) {
      showNotice("Please sign in to save items");
      window.setTimeout(
        () => navigate("/signin", { state: { from: `/category/${slug}` } }),
        900,
      );
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

  async function handleAddToCart(product) {
    if (!isAuthenticated) {
      showNotice("Please sign in to add items to your cart");
      window.setTimeout(
        () => navigate("/signin", { state: { from: `/category/${slug}` } }),
        900,
      );
      return;
    }

    const result = await addItem(product._id, 1);

    showNotice(result.ok ? `${product.name} added to cart` : result.message);
  }

  if (!category && categories.length > 0) {
    return (
      <div className="category-page-shell">
        <p>Category not found.</p>
        <button onClick={() => navigate("/")}>Return home</button>
      </div>
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

          <form
            className="category-search"
            onSubmit={(event) => event.preventDefault()}
          >
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${(category?.name || "").toLowerCase()}`}
            />
          </form>

          <button
            className="category-cart-button"
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart size={20} />
            <span>Cart</span>
            <b>{cart.totalItems}</b>
          </button>
        </div>

        <nav className="category-shortcuts">
          {categories.slice(0, 7).map((item) => (
            <button
              key={item._id}
              className={item.slug === slug ? "active" : ""}
              onClick={() => navigate(`/category/${item.slug}`)}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {category && (
          <section className="category-intro">
            <div className="category-intro-copy">
              <button className="category-breadcrumb" onClick={() => navigate("/")}>
                Home <ChevronRight size={14} /> {category.name}
              </button>
              <p className="category-kicker">MARKETFIND / CURATED MARKETPLACE</p>
              <h1>{category.name}</h1>
              <p>Explore products in {category.name.toLowerCase()}.</p>
              <div className="category-intro-meta">
                Prices shown in Nigerian naira <span>•</span> New finds added
                daily
              </div>
            </div>

            {category.image && (
              <div className="category-intro-image">
                <img src={category.image} alt={`${category.name} collection`} />
                <div>
                  <span>Made for real life</span>
                  <strong>Selected {category.name.toLowerCase()} finds</strong>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="category-content">
          <div className="category-toolbar">
            <div>
              <p className="category-kicker">SHOP THE EDIT</p>
              <h2>{category?.name}</h2>
              <span>{visibleProducts.length} products selected for you</span>
            </div>

            <div className="category-toolbar-actions">
              <button
                className="filter-button"
                onClick={() => showNotice("Filters are ready")}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>

              <label className="sort-select">
                <span>Sort:</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                </select>
                <ChevronDown size={15} />
              </label>
            </div>
          </div>

          {loading && <p>Loading products…</p>}
          {loadError && <p className="signin-form-message">{loadError}</p>}

          {!loading && visibleProducts.length === 0 && (
            <p>No products in this category yet.</p>
          )}

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="market-product-card" key={product._id}>
                <div
                  className="market-product-image"
                  onClick={() => navigate(`/product/${product._id}`)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") navigate(`/product/${product._id}`);
                  }}
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
                    <ChevronRight size={16} />
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

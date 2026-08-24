import { useMemo, useState } from "react";
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
import {
  categoryNames,
  formatNaira,
  getCategoryData,
  slugifyCategory,
} from "./categoryData";
import "./category.css";

export default function CategoryPage({ category, onBack, onCategorySelect }) {
  const data = getCategoryData(category);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [notice, setNotice] = useState("");

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  const products = useMemo(() => {
    const filtered = data.products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase()),
    );

    if (sort === "low") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }

    if (sort === "high") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [data.products, query, sort]);

  return (
    <div className="category-page-shell">
      <header className="category-page-header">
        <div className="category-header-inner">
          <button className="category-back-button" onClick={onBack}>
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
              placeholder={`Search ${category.toLowerCase()}`}
            />
          </form>

          <button
            className="category-cart-button"
            onClick={() => showNotice("Your cart is empty")}
          >
            <ShoppingCart size={20} />
            <span>Cart</span>
            <b>0</b>
          </button>
        </div>

        <nav className="category-shortcuts">
          {categoryNames.slice(0, 7).map((item) => (
            <button
              key={item}
              className={item === category ? "active" : ""}
              onClick={() => onCategorySelect(slugifyCategory(item))}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <section className="category-intro">
          <div className="category-intro-copy">
            <button className="category-breadcrumb" onClick={onBack}>
              Home <ChevronRight size={14} /> {category}
            </button>
            <p className="category-kicker">MARKETFIND / CURATED MARKETPLACE</p>
            <h1>{data.headline}</h1>
            <p>{data.description}</p>
            <div className="category-intro-meta">
              Prices shown in Nigerian naira <span>•</span> New finds added
              daily
            </div>
          </div>

          <div className="category-intro-image">
            <img src={data.heroImage} alt={`${category} collection`} />
            <div>
              <span>Made for real life</span>
              <strong>Selected {category.toLowerCase()} finds</strong>
            </div>
          </div>
        </section>

        <section className="category-content">
          <div className="category-toolbar">
            <div>
              <p className="category-kicker">SHOP THE EDIT</p>
              <h2>{category}</h2>
              <span>{products.length} products selected for you</span>
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

          <div className="product-grid">
            {products.map((product) => (
              <article className="market-product-card" key={product.id}>
                <div className="market-product-image">
                  <img src={product.image} alt={product.name} />
                  <span className="product-tag">{product.tag}</span>
                  <button
                    className="product-wishlist"
                    onClick={() => showNotice(`${product.name} saved`)}
                  >
                    <Heart size={17} />
                  </button>
                </div>

                <div className="market-product-copy">
                  <div className="product-rating">
                    <Star size={14} fill="currentColor" />
                    4.8 <em>(120+)</em>
                  </div>
                  <h3>{product.name}</h3>
                  <div className="product-price-row">
                    <strong>{formatNaira(product.price)}</strong>
                    <del>{formatNaira(product.oldPrice)}</del>
                  </div>
                  <p>{product.shipping}</p>
                  <button
                    className="product-shop-button"
                    onClick={() => showNotice(`${product.name} added to cart`)}
                  >
                    Add to cart
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

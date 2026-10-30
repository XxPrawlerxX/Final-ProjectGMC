import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight, SlidersHorizontal } from "lucide-react";
import { findCategoryBySlug, getCategoryData } from "./categoryData";
import { getProductsByCategory } from "./catalog";
import { useCart } from "./useCart";
import ShopHeader from "./ShopHeader";
import ProductCard from "./ProductCard";
import NotFound from "./NotFound";
import "./category.css";
import "./shop.css";

export default function CategoryPage() {
  const { slug } = useParams();
  const category = findCategoryBySlug(slug);

  if (!category) {
    return (
      <NotFound
        title="Category not found"
        message="We couldn't find that category. Try one from the menu."
      />
    );
  }

  // key resets the search/sort state when moving between categories
  return <CategoryContent key={category} category={category} />;
}

function CategoryContent({ category }) {
  const data = getCategoryData(category);
  const { addToCart } = useCart();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [notice, setNotice] = useState("");

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function handleAdd(product) {
    addToCart(product);
    showNotice(`${product.name} added to cart`);
  }

  const products = useMemo(() => {
    const filtered = getProductsByCategory(category).filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase()),
    );

    if (sort === "low") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [category, query, sort]);

  return (
    <div className="category-page-shell">
      <ShopHeader
        activeCategory={category}
        search={{
          value: query,
          onChange: setQuery,
          placeholder: `Search ${category.toLowerCase()}`,
        }}
      />

      <main>
        <section className="category-intro">
          <div className="category-intro-copy">
            <Link className="category-breadcrumb shop-link" to="/">
              Home <ChevronRight size={14} /> {category}
            </Link>
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
              <ProductCard
                key={product.id}
                product={product}
                onAdd={handleAdd}
                onSave={(item) => showNotice(`${item.name} saved`)}
              />
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

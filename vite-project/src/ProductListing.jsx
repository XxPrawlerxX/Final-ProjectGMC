import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { withQuery } from "./lib/api";
import { useApi } from "./useApi";
import ProductCard from "./ProductCard";
import "./cards.css";
import "./listing.css";

const PAGE_SIZE = 12;

const TYPE_TABS = [
  ["", "All"],
  ["retail", "Retail"],
  ["bulk", "Wholesale"],
  ["secondhand", "Pre-loved"],
];

const SORT_OPTIONS = [
  ["featured", "Featured"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["rating", "Top rated"],
  ["newest", "Newest"],
];

// Compact page list: 1 … 4 5 6 … 12
function pageNumbers(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap-" + p);
    out.push(p);
  });
  return out;
}

// Product grid with sorting, price/stock filters and pagination.
// Everything lives in the URL (?sort=&min=&max=&inStock=1&page=) so links and
// the back button work. `baseParams` is the fixed part, e.g. { category: "shoes" }.
export default function ProductListing({ baseParams, emptyTitle = "No products found", emptyText }) {
  const [params, setParams] = useSearchParams();
  const sort = params.get("sort") || "featured";
  const min = params.get("min") || "";
  const max = params.get("max") || "";
  const inStock = params.get("inStock") === "1";
  const fixedListing = Boolean(baseParams.listing); // wholesale / pre-loved pages are already one type
  const type = fixedListing ? "" : params.get("type") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [filtersOpen, setFiltersOpen] = useState(Boolean(min || max || inStock));
  const topRef = useRef(null);

  const url = withQuery("/api/products", {
    ...baseParams,
    listing: baseParams.listing ?? type,
    sort: sort === "featured" ? "" : sort,
    min,
    max,
    inStock: inStock ? "1" : "",
    page: page > 1 ? page : "",
    limit: PAGE_SIZE,
  });
  const { data, error, loading, reload } = useApi(url);

  function update(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === "" || value === false || value === null) next.delete(key);
      else next.set(key, value === true ? "1" : String(value));
    }
    if (!("page" in changes)) next.delete("page"); // new filters start from page 1
    setParams(next);
  }

  function goToPage(next) {
    update({ page: next > 1 ? next : "" });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function applyPrice(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const clean = (v) => (/^\d+$/.test(String(v).trim()) ? String(v).trim() : "");
    update({ min: clean(form.get("min")), max: clean(form.get("max")) });
  }

  const filtersActive = Boolean(min || max || inStock);

  return (
    <section ref={topRef} className="listing" aria-live="polite">
      {!fixedListing && (
        <div className="type-tabs" role="group" aria-label="Listing type">
          {TYPE_TABS.map(([value, label]) => (
            <button key={label} className={type === value ? "active" : ""} onClick={() => update({ type: value })} aria-pressed={type === value}>
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="listing-toolbar">
        <p className="listing-count">
          {data ? `${data.total} ${data.total === 1 ? "product" : "products"}` : "\u00A0"}
        </p>

        <button
          className={`listing-filter-toggle ${filtersActive ? "active" : ""}`}
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal size={16} /> Filters{filtersActive ? " •" : ""}
        </button>

        <label className="listing-sort">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(event) => update({ sort: event.target.value === "featured" ? "" : event.target.value })}>
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtersOpen && (
        <form className="listing-filters" onSubmit={applyPrice}>
          <fieldset key={`${min}-${max}`}>
            <legend>Price (₦)</legend>
            <div className="listing-price-inputs">
              <input
                inputMode="numeric"
                name="min"
                placeholder="Min"
                aria-label="Minimum price"
                defaultValue={min}
              />
              <span>to</span>
              <input
                inputMode="numeric"
                name="max"
                placeholder="Max"
                aria-label="Maximum price"
                defaultValue={max}
              />
              <button type="submit">Apply</button>
            </div>
          </fieldset>

          <label className="listing-check">
            <input type="checkbox" checked={inStock} onChange={(event) => update({ inStock: event.target.checked })} />
            In stock only
          </label>

          {filtersActive && (
            <button type="button" className="listing-clear" onClick={() => update({ min: "", max: "", inStock: false })}>
              Clear filters
            </button>
          )}
        </form>
      )}

      {error && (
        <div className="listing-message">
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={reload}>Try again</button>
        </div>
      )}

      {loading && (
        <div className="pgrid" role="status" aria-label="Loading products">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="listing-message">
          <h2>{emptyTitle}</h2>
          <p>{filtersActive ? "Try removing some filters." : emptyText}</p>
          {filtersActive && (
            <button onClick={() => update({ min: "", max: "", inStock: false })}>Clear filters</button>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="pgrid">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {data.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
                <ChevronLeft size={18} />
              </button>
              {pageNumbers(page, data.pages).map((p) =>
                typeof p === "string" ? (
                  <span key={p} aria-hidden="true">…</span>
                ) : (
                  <button
                    key={p}
                    className={p === page ? "current" : ""}
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </button>
                ),
              )}
              <button onClick={() => goToPage(page + 1)} disabled={page >= data.pages} aria-label="Next page">
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

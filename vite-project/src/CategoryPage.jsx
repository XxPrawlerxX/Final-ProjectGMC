import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useApi } from "./useApi";
import Layout from "./Layout";
import NotFound from "./NotFound";
import ProductListing from "./ProductListing";
import "./listing.css";

export default function CategoryPage() {
  const { slug } = useParams();
  const { data, error, loading } = useApi(`/api/categories/${encodeURIComponent(slug)}`);

  if (error?.status === 404) {
    return <NotFound title="Category not found" message="We couldn't find that category. Try one from the menu." />;
  }

  const category = data?.category;

  return (
    <Layout activeCategory={slug}>
      <div className="site-container">
        <div className="page-head">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <ChevronRight size={13} />
            <span aria-current="page">{category?.name || "…"}</span>
          </nav>

          {category && (
            <div className="category-banner">
              <div className="category-banner-copy">
                <p className="page-kicker">Marketfind</p>
                <h1 className="page-title">{category.name}</h1>
                <p className="page-sub">
                  {category.headline}. {category.description}
                </p>
              </div>
              <img src={category.heroImage} alt="" />
            </div>
          )}
          {loading && <div className="skeleton" style={{ height: 150 }} />}
          {error && !loading && <p role="alert">{error.message}</p>}
        </div>

        {/* key: start fresh (page, filters) when switching category */}
        {category && (
          <ProductListing
            key={slug}
            baseParams={{ category: slug }}
            emptyTitle="Nothing here yet"
            emptyText="New products are added every day. Check back soon."
          />
        )}
      </div>
    </Layout>
  );
}

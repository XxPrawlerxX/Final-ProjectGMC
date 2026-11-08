import { Link, useSearchParams } from "react-router-dom";
import Layout from "./Layout";
import ProductListing from "./ProductListing";
import "./listing.css";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim();

  return (
    <Layout>
      <div className="site-container">
        <div className="page-head">
          <p className="page-kicker">Search</p>
          <h1 className="page-title">{query ? `Results for “${query}”` : "Search Marketfind"}</h1>
        </div>

        {query ? (
          <ProductListing
            key={query}
            baseParams={{ q: query }}
            emptyTitle="No products found"
            emptyText="Try a different spelling or a more general word."
          />
        ) : (
          <div className="listing-message">
            <h2>What are you looking for?</h2>
            <p>Type a product name in the search box above, or <Link to="/" style={{ textDecoration: "underline" }}>browse the store</Link>.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

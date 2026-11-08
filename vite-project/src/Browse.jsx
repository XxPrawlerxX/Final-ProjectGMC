import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useAuth } from "./auth/authContext";
import Layout from "./Layout";
import ProductListing from "./ProductListing";
import "./listing.css";

// Two marketplaces in one site: wholesale/B2B and pre-loved/P2P.
const PAGES = {
  wholesale: {
    listing: "bulk",
    kicker: "Wholesale & B2B",
    title: "Buy in bulk, pay less per unit",
    text: "Minimum orders, price breaks and quotes from suppliers. Open to businesses and, on most listings, individuals too.",
    emptyTitle: "No wholesale listings yet",
    emptyText: "Suppliers are joining all the time. Check back soon.",
  },
  preloved: {
    listing: "secondhand",
    kicker: "Pre-loved",
    title: "Pre-loved marketplace",
    text: "Second-hand and one-off items from individual sellers. Chat to agree a price, then pay securely or arrange pickup.",
    emptyTitle: "No pre-loved items yet",
    emptyText: "Have something you no longer need? List it in a minute.",
  },
};

export default function Browse({ kind }) {
  const page = PAGES[kind];
  const { user } = useAuth();
  const showBusinessCta = kind === "wholesale" && user?.buyer?.kind !== "business";

  return (
    <Layout>
      <div className="site-container">
        <div className="page-head">
          <div className={`browse-banner ${kind}`}>
            <p className="page-kicker">{page.kicker}</p>
            <h1 className="page-title">{page.title}</h1>
            <p className="page-sub">{page.text}</p>
            <div className="browse-actions">
              {showBusinessCta && (
                <Link className="browse-cta" to={user ? "/account?tab=profile" : "/register?as=buyer-business"}>
                  <Building2 size={16} /> {user ? "Switch to a business account" : "Register your business"}
                </Link>
              )}
              <Link className="browse-cta secondary" to={kind === "wholesale" ? "/register?as=seller-wholesale" : "/register?as=seller-individual"}>
                {kind === "wholesale" ? "Become a supplier" : "Sell your items"}
              </Link>
            </div>
          </div>
        </div>
        <ProductListing key={kind} baseParams={{ listing: page.listing }} emptyTitle={page.emptyTitle} emptyText={page.emptyText} />
      </div>
    </Layout>
  );
}

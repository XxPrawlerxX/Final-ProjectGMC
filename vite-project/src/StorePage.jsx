import { useParams } from "react-router-dom";
import { BadgeCheck, Building2, MapPin, User } from "lucide-react";
import { SELLER_TYPE_LABEL } from "./lib/labels";
import { useApi } from "./useApi";
import Layout from "./Layout";
import NotFound from "./NotFound";
import ProductListing from "./ProductListing";
import "./listing.css";
import "./seller.css";

export default function StorePage() {
  const { slug } = useParams();
  const { data, error } = useApi(`/api/sellers/${encodeURIComponent(slug)}`);

  if (error?.status === 404) return <NotFound title="Store not found" message="This store doesn't exist or is no longer active." />;
  const store = data?.store;

  return (
    <Layout>
      <div className="site-container">
        <div className="page-head">
          {store ? (
            <div className="store-banner">
              <p className="page-kicker">Store</p>
              <h1 className="page-title">
                {store.name}
                {store.verified && <BadgeCheck size={24} className="verified-icon" aria-label="Verified business" />}
              </h1>
              <p className="store-kind">
                {store.sellerType === "individual" ? <User size={15} /> : <Building2 size={15} />}
                {SELLER_TYPE_LABEL[store.sellerType]}
                {store.businessName && ` · ${store.businessName}`}
              </p>
              <p className="store-meta">
                <MapPin size={15} /> {store.city}, {store.state} · Selling since {new Date(store.since).getFullYear()} · {store.productCount} {store.productCount === 1 ? "product" : "products"}
              </p>
              {store.description && <p className="page-sub">{store.description}</p>}
            </div>
          ) : (
            <div className="skeleton" style={{ height: 120 }} />
          )}
        </div>
        {store && <ProductListing key={slug} baseParams={{ seller: slug }} emptyTitle="Nothing for sale yet" emptyText="This store hasn't listed any products yet." />}
      </div>
    </Layout>
  );
}

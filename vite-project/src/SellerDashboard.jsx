import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BadgeCheck, Eye, EyeOff, MessageCircle, Package, Pencil, Plus, Store, Tag, Truck } from "lucide-react";
import { api } from "./lib/api";
import { formatNaira } from "./lib/format";
import { CONDITION_LABEL, SELLER_TYPE_LABEL, plural } from "./lib/labels";
import { NIGERIAN_STATES } from "./lib/nigeria";
import { useApi } from "./useApi";
import { useAuth } from "./auth/authContext";
import { useToast } from "./toast/toastContext";
import Layout from "./Layout";
import "./seller.css";

// Each kind of seller gets its own dashboard wording, numbers and tools.
const KINDS = {
  retail: {
    add: "Add product",
    tabs: { products: "Products", orders: "Orders", store: "Store" },
    stats: [["live", "Live products"], ["orders", "Orders"], ["soldOut", "Out of stock"], ["unread", "Unread messages"]],
    emptyTitle: "No products yet",
    emptyText: "Upload your first product and it goes live in the shop straight away.",
    ordersEmpty: "When a shopper pays for one of your products, the order and delivery details appear here.",
    intro: "Sell new products to shoppers.",
  },
  wholesale: {
    add: "Add bulk listing",
    tabs: { products: "Bulk listings", orders: "Bulk orders", store: "Store" },
    stats: [["live", "Live listings"], ["orders", "Bulk orders"], ["soldOut", "Out of stock"], ["unread", "Quote requests & messages"]],
    emptyTitle: "No bulk listings yet",
    emptyText: "Add a listing with a minimum order and price breaks. Businesses and individuals can order it right away.",
    ordersEmpty: "Bulk orders appear here with the buyer's business name and delivery details.",
    intro: "Sell in bulk to businesses and individuals.",
  },
  individual: {
    add: "List an item",
    tabs: { products: "My listings", orders: "Sales", store: "Profile" },
    stats: [["live", "Active listings"], ["soldOut", "Sold / unavailable"], ["orders", "Sales"], ["unread", "Messages"]],
    emptyTitle: "You haven't listed anything yet",
    emptyText: "Got something you no longer need? List it in a minute: add pictures, a price and the condition.",
    ordersEmpty: "When someone buys one of your items, you'll see their delivery details here.",
    intro: "Sell used items and one-off things. No business needed.",
  },
};

function Products({ kind, sellerType }) {
  const toast = useToast();
  const { data, error, loading, reload } = useApi("/api/seller/products");

  async function update(product, changes, message) {
    try {
      await api.patch(`/api/seller/products/${product.id}`, changes);
      toast(message);
      reload();
    } catch (err) {
      toast(err.message, { type: "error" });
    }
  }

  if (loading) return <p className="seller-note" role="status">Loading…</p>;
  if (error) return <p className="seller-note" role="alert">{error.message}</p>;
  if (data.items.length === 0) {
    return (
      <div className="seller-empty">
        <Package size={42} />
        <h2>{kind.emptyTitle}</h2>
        <p>{kind.emptyText}</p>
        <Link className="seller-button" to="/sell/products/new">{kind.add}</Link>
      </div>
    );
  }

  return (
    <ul className="seller-products">
      {data.items.map((p) => (
        <li key={p.id} className={p.active ? "" : "hidden"}>
          <img src={p.image} alt="" />
          <div className="seller-product-info">
            <Link to={`/product/${p.id}`}>{p.name}</Link>
            <span>
              {p.category}
              {sellerType === "wholesale" && ` · min. ${p.minOrderQty} ${plural(p.unit, p.minOrderQty)}${p.priceTiers.length ? ` · ${p.priceTiers.length + 1} price levels` : ""}`}
              {sellerType === "individual" && p.condition && ` · ${CONDITION_LABEL[p.condition]}`}
            </span>
          </div>
          <strong>
            {formatNaira(p.price)}
            {sellerType === "wholesale" && <small> / {p.unit}</small>}
          </strong>
          <span className={`seller-stock ${p.stock === 0 ? "out" : sellerType === "retail" && p.stock <= 5 ? "low" : ""}`}>
            {sellerType === "individual" ? (p.stock === 0 ? "Sold" : "Available") : p.stock === 0 ? "Out of stock" : `${p.stock.toLocaleString("en-NG")} in stock`}
          </span>
          <span className={`seller-status ${p.active ? "live" : "off"}`}>{p.active ? "Live" : "Hidden"}</span>
          <div className="seller-product-actions">
            {sellerType === "individual" && (
              <button
                className="seller-button secondary small"
                onClick={() => update(p, { stock: p.stock === 0 ? 1 : 0 }, p.stock === 0 ? "Relisted" : "Marked as sold")}
              >
                <Tag size={14} /> {p.stock === 0 ? "Relist" : "Mark sold"}
              </button>
            )}
            <Link className="icon-button" to={`/sell/products/${p.id}/edit`} aria-label={`Edit ${p.name}`}><Pencil size={16} /></Link>
            <button className="icon-button" onClick={() => update(p, { active: !p.active }, p.active ? "Hidden from the shop" : "Live in the shop again")} aria-label={p.active ? `Hide ${p.name}` : `Show ${p.name}`}>
              {p.active ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Orders({ kind }) {
  const { data, error, loading } = useApi("/api/seller/orders");
  if (loading) return <p className="seller-note" role="status">Loading…</p>;
  if (error) return <p className="seller-note" role="alert">{error.message}</p>;
  if (data.items.length === 0) {
    return (
      <div className="seller-empty">
        <Truck size={42} />
        <h2>No orders yet</h2>
        <p>{kind.ordersEmpty}</p>
      </div>
    );
  }
  return (
    <ul className="seller-orders">
      {data.items.map((order) => (
        <li key={order.id}>
          <div className="seller-order-head">
            <strong>{new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</strong>
            <span>Ref {order.reference}</span>
          </div>
          {order.customer.businessName && <p className="seller-order-biz">Business buyer: <b>{order.customer.businessName}</b></p>}
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                <span>{item.name} × {item.quantity}{item.unit !== "piece" ? ` ${plural(item.unit, item.quantity)}` : ""} @ {formatNaira(item.price)}</span>
                <b>{formatNaira(item.price * item.quantity)}</b>
              </li>
            ))}
          </ul>
          <p className="seller-order-total">Your total: <b>{formatNaira(order.total)}</b></p>
          <address>
            <b>Deliver to:</b> {order.customer.fullName}, {order.customer.address}, {order.customer.city}, {order.customer.state}<br />
            <b>Phone:</b> <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
          </address>
        </li>
      ))}
    </ul>
  );
}

function StoreSettings() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const s = user.seller;
  const [form, setForm] = useState({ description: s.description || "", phone: s.phone || "", city: s.city || "", state: s.state || "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((c) => ({ ...c, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api.patch("/api/sellers/me", form);
      setUser(data.user);
      toast("Saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="seller-form flush" onSubmit={submit}>
      <p className="seller-note">
        Your public page: <Link className="seller-link" to={`/store/${s.storeSlug}`}>/store/{s.storeSlug}</Link>.
        {s.businessName && <> Registered business: <b>{s.businessName}</b>{s.rcNumber && <> ({s.rcNumber})</>}.</>}
        {s.verified ? " Your business is verified." : s.sellerType !== "individual" ? " Verification: pending. Contact support with your CAC documents." : ""}
      </p>
      <div className="seller-field">
        <label htmlFor="ss-description">About</label>
        <textarea id="ss-description" rows={3} maxLength={500} value={form.description} onChange={set("description")} />
      </div>
      <div className="seller-field">
        <label htmlFor="ss-phone">Phone</label>
        <input id="ss-phone" type="tel" value={form.phone} onChange={set("phone")} />
      </div>
      <div className="seller-row">
        <div className="seller-field">
          <label htmlFor="ss-city">City</label>
          <input id="ss-city" value={form.city} onChange={set("city")} />
        </div>
        <div className="seller-field">
          <label htmlFor="ss-state">State</label>
          <select id="ss-state" value={form.state} onChange={set("state")}>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="seller-form-error" role="alert">{error}</p>}
      <div className="seller-form-actions">
        <button className="seller-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  );
}

const TAB_ICONS = { products: Package, orders: Truck, store: Store };

export default function SellerDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const stats = useApi(user.seller ? "/api/seller/stats" : null);

  if (!user.seller) {
    return (
      <Layout>
        <div className="site-container seller-page narrow">
          <div className="seller-empty">
            <Store size={46} />
            <h1>Sell on Marketfind</h1>
            <p>Sell used items as an individual, run a retail shop, or supply wholesale to other businesses, all in one place.</p>
            <Link className="seller-button" to="/sell/register">Start selling</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const sellerType = user.seller.sellerType;
  const kind = KINDS[sellerType];
  const tab = Object.keys(kind.tabs).includes(params.get("tab")) ? params.get("tab") : "products";

  return (
    <Layout>
      <div className={`site-container seller-page dash-${sellerType}`}>
        <div className="seller-head">
          <div>
            <p className="page-kicker">{SELLER_TYPE_LABEL[sellerType]} dashboard</p>
            <h1 className="page-title">
              {user.seller.storeName}
              {user.seller.verified && <BadgeCheck size={24} className="verified-icon" aria-label="Verified" />}
            </h1>
            <p className="seller-intro">{kind.intro}</p>
          </div>
          <div className="seller-head-actions">
            <Link className="seller-button secondary" to="/messages"><MessageCircle size={17} /> Messages</Link>
            <Link className="seller-button" to="/sell/products/new"><Plus size={17} /> {kind.add}</Link>
          </div>
        </div>

        {user.seller.status !== "active" && (
          <p className="seller-form-error" role="alert">Your store is suspended, so your listings are hidden. Please contact support.</p>
        )}

        <ul className="seller-stats" aria-label="At a glance">
          {kind.stats.map(([key, label]) => (
            <li key={key}>
              <strong>{stats.data ? stats.data[key].toLocaleString("en-NG") : "–"}</strong>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <nav className="seller-tabs" aria-label="Dashboard sections">
          {Object.entries(kind.tabs).map(([id, label]) => {
            const Icon = TAB_ICONS[id];
            return (
              <button key={id} className={id === tab ? "active" : ""} onClick={() => setParams({ tab: id })} aria-current={id === tab ? "page" : undefined}>
                <Icon size={17} /> {label}
              </button>
            );
          })}
        </nav>

        <section className="seller-panel" aria-live="polite">
          {tab === "products" && <Products kind={kind} sellerType={sellerType} />}
          {tab === "orders" && <Orders kind={kind} />}
          {tab === "store" && <StoreSettings />}
        </section>
      </div>
    </Layout>
  );
}

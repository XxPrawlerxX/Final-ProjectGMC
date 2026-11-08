import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Heart, Lock, Package, Sparkles, UserRound } from "lucide-react";
import { api } from "./lib/api";
import { formatNaira } from "./lib/format";
import { NIGERIAN_STATES } from "./lib/nigeria";
import { useApi } from "./useApi";
import { useAuth } from "./auth/authContext";
import { useToast } from "./toast/toastContext";
import { useWishlist } from "./wishlist/wishlistContext";
import Layout from "./Layout";
import ProductCard from "./ProductCard";
import RecommendationSections from "./RecommendationSections";
import "./cards.css";
import "./account.css";

const TABS = [
  ["foryou", "For you", Sparkles],
  ["orders", "Orders", Package],
  ["wishlist", "Wishlist", Heart],
  ["profile", "Profile", UserRound],
  ["security", "Security", Lock],
];

const STATUS_LABEL = { paid: "Paid", review: "Processing" };

const MODES = [
  ["retail", "Retail & pre-loved"],
  ["bulk", "Wholesale (B2B)"],
  ["both", "Both"],
];
const INDUSTRIES = ["Retail & e-commerce", "Restaurants & hospitality", "Construction", "Manufacturing", "Agriculture & food", "Healthcare", "Education", "Offices & services", "Other"];

// The shopper's own dashboard: picks that follow their choice of retail or B2B
function ForYou() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useApi("/api/recommendations?limit=8");
  const business = user.buyer.kind === "business";

  async function chooseMode(mode) {
    try {
      const result = await api.patch("/api/auth/buyer", { buyingMode: mode });
      setUser(result.user);
      reload();
    } catch (err) {
      toast(err.message, { type: "error" });
    }
  }

  return (
    <div className="foryou">
      <div className="foryou-head">
        <div>
          <h2>{business ? `Business dashboard${user.buyer.businessName ? ` · ${user.buyer.businessName}` : ""}` : "Picks for you"}</h2>
          <p>{business ? "Wholesale deals, suppliers and quotes for your business." : "Products and pre-loved finds chosen for how you shop."}</p>
        </div>
        <div className="mode-switch" role="group" aria-label="What to show">
          {MODES.map(([value, label]) => (
            <button key={value} className={user.buyer.mode === value ? "active" : ""} onClick={() => chooseMode(value)} aria-pressed={user.buyer.mode === value}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="account-note" role="status">Finding picks for you…</p>}
      {error && <p className="account-note" role="alert">{error.message}</p>}
      {data && data.sections.length === 0 && (
        <div className="account-empty">
          <Sparkles size={40} />
          <h2>Nothing to show yet</h2>
          <p>{user.buyer.mode === "bulk" ? "No wholesale listings have been added yet. Check back soon." : "New listings are added every day."}</p>
          <Link className="shop-primary-link" to="/">Browse the shop</Link>
        </div>
      )}
      {data && <RecommendationSections sections={data.sections} />}
    </div>
  );
}

// Switch between an individual and a business account, and change what you're shown
function BuyingPreferences() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const b = user.buyer;
  const [form, setForm] = useState({ buyerKind: b.kind, buyingMode: b.mode, businessName: b.businessName, rcNumber: b.rcNumber, industry: b.industry });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((c) => ({ ...c, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api.patch("/api/auth/buyer", form);
      setUser(data.user);
      toast("Preferences saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="account-form prefs" onSubmit={submit}>
      <h2><Building2 size={20} /> Shopping preferences</h2>
      <label>
        Account type
        <select value={form.buyerKind} onChange={set("buyerKind")}>
          <option value="individual">Individual</option>
          <option value="business">Business</option>
        </select>
      </label>
      {form.buyerKind === "business" && (
        <>
          <label>
            Registered business name
            <input value={form.businessName} onChange={set("businessName")} maxLength={100} autoComplete="organization" />
          </label>
          <div className="account-row">
            <label>
              CAC / RC number (optional)
              <input value={form.rcNumber} onChange={set("rcNumber")} maxLength={30} />
            </label>
            <label>
              Industry
              <select value={form.industry} onChange={set("industry")}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
          </div>
          <p className="account-note">Business accounts can order business-only wholesale listings and add a business name to invoices.</p>
        </>
      )}
      <label>
        What should we recommend?
        <select value={form.buyingMode} onChange={set("buyingMode")}>
          {MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button className="account-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save preferences"}</button>
    </form>
  );
}

function Orders() {
  const { data, error, loading } = useApi("/api/orders");
  if (loading) return <p className="account-note" role="status">Loading your orders…</p>;
  if (error) return <p className="account-note" role="alert">{error.message}</p>;
  if (data.items.length === 0) {
    return (
      <div className="account-empty">
        <Package size={40} />
        <h2>No orders yet</h2>
        <p>When you place an order, it will show up here.</p>
        <Link className="shop-primary-link" to="/">Start shopping</Link>
      </div>
    );
  }
  return (
    <ul className="order-list">
      {data.items.map((order) => (
        <li key={order.id} className="order-item">
          <div className="order-item-head">
            <div>
              <strong>{new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" })}</strong>
              <span>Ref {order.reference}</span>
            </div>
            <span className={`order-status ${order.status}`}>{STATUS_LABEL[order.status] || order.status}</span>
          </div>
          <ul className="order-item-lines">
            {order.items.map((item) => (
              <li key={item.id}>
                <img src={item.image} alt="" />
                <Link to={`/product/${item.id}`}>{item.name}</Link>
                <span>× {item.quantity}</span>
                <strong>{formatNaira(item.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>
          <div className="order-item-total">
            <span>Delivery {formatNaira(order.deliveryFee)}</span>
            <strong>Total {formatNaira(order.total)}</strong>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Wishlist() {
  const { data, error, loading } = useApi("/api/wishlist");
  const wishlist = useWishlist();
  if (loading) return <p className="account-note" role="status">Loading your wishlist…</p>;
  if (error) return <p className="account-note" role="alert">{error.message}</p>;
  // Hide items as soon as they're un-hearted
  const items = data.items.filter((product) => wishlist.has(product.id));
  if (items.length === 0) {
    return (
      <div className="account-empty">
        <Heart size={40} />
        <h2>Your wishlist is empty</h2>
        <p>Tap the heart on any product to save it for later.</p>
        <Link className="shop-primary-link" to="/">Browse products</Link>
      </div>
    );
  }
  return (
    <div className="pgrid account-grid">
      {items.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name, phone: user.phone, address: user.address, city: user.city, state: user.state,
    notifyByEmail: user.notifyByEmail !== false,
  });
  const [error, setError] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setFieldName("");
    try {
      const data = await api.patch("/api/auth/me", form);
      setUser(data.user);
      toast("Profile saved");
    } catch (err) {
      setError(err.message);
      setFieldName(err.field || "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <p className="account-note">These details are used to pre-fill checkout.</p>
      <label>
        Full name
        <input value={form.name} onChange={set("name")} autoComplete="name" required maxLength={80} aria-invalid={fieldName === "name"} />
      </label>
      <label>
        Email
        <input value={user.email} disabled />
      </label>
      <label>
        Phone
        <input value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="0803 123 4567" aria-invalid={fieldName === "phone"} />
      </label>
      <label>
        Delivery address
        <textarea value={form.address} onChange={set("address")} rows={3} autoComplete="street-address" maxLength={300} />
      </label>
      <div className="account-row">
        <label>
          City
          <input value={form.city} onChange={set("city")} autoComplete="address-level2" maxLength={80} />
        </label>
        <label>
          State
          <select value={form.state} onChange={set("state")}>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>
      <label className="account-check">
        <input
          type="checkbox"
          checked={form.notifyByEmail}
          onChange={(event) => setForm((current) => ({ ...current, notifyByEmail: event.target.checked }))}
        />
        Email me when a seller or buyer replies in chat
      </label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <button className="account-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

function Security() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.newPassword !== form.confirm) {
      setError("The new passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast("Password changed. Other devices were signed out.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-security">
      <form className="account-form" onSubmit={submit}>
        <h2>Change password</h2>
        <label>
          Current password
          <input type="password" value={form.currentPassword} onChange={set("currentPassword")} autoComplete="current-password" required />
        </label>
        <label>
          New password
          <input type="password" value={form.newPassword} onChange={set("newPassword")} autoComplete="new-password" required minLength={8} />
        </label>
        <label>
          Confirm new password
          <input type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" required />
        </label>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="account-button" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>

      <div className="account-signout">
        <h2>Sign out</h2>
        <p>Sign out of Marketfind on this device.</p>
        <button
          className="account-button secondary"
          onClick={async () => {
            await logout();
            navigate("/");
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([id]) => id === params.get("tab")) ? params.get("tab") : "foryou";

  return (
    <Layout>
      <div className="site-container account-page">
        <div className="page-head account-head">
          <p className="page-kicker">{user.buyer.kind === "business" ? "Business account" : "My account"}</p>
          <h1 className="page-title">Hi, {user.name.split(" ")[0]}</h1>
        </div>

        <div className="account-layout">
          <nav className="account-tabs" aria-label="Account sections">
            {TABS.map(([id, label, Icon]) => (
              <button
                key={id}
                className={id === tab ? "active" : ""}
                onClick={() => setParams({ tab: id })}
                aria-current={id === tab ? "page" : undefined}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </nav>

          <section className="account-panel" aria-live="polite">
            {tab === "foryou" && <ForYou />}
            {tab === "orders" && <Orders />}
            {tab === "wishlist" && <Wishlist />}
            {tab === "profile" && (
              <>
                <Profile />
                <BuyingPreferences />
              </>
            )}
            {tab === "security" && <Security />}
          </section>
        </div>
      </div>
    </Layout>
  );
}

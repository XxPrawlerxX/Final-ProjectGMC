import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Package, ShoppingBag, Store, Truck, User } from "lucide-react";
import { api } from "./lib/api";
import { NIGERIAN_STATES } from "./lib/nigeria";
import { useAuth } from "./auth/authContext";
import { useToast } from "./toast/toastContext";
import Layout from "./Layout";
import "./seller.css";

// The five ways to join. "Buyer" types shop; "seller" types also get a store and dashboard.
const OPTIONS = {
  buy: [
    { id: "buyer-individual", icon: User, title: "Individual", text: "Shop for yourself: retail products and pre-loved items from people near you." },
    { id: "buyer-business", icon: Building2, title: "Business", text: "Buy in bulk for your company: wholesale prices, quotes and B2B deals." },
  ],
  sell: [
    { id: "seller-individual", icon: Package, title: "Individual seller", text: "Sell used items or single things you no longer need. No business registration required." },
    { id: "seller-retail", icon: Store, title: "Retail business", text: "Sell new products to shoppers, one or a few at a time." },
    { id: "seller-wholesale", icon: Truck, title: "Wholesale / bulk business", text: "Sell in bulk to businesses and individuals, with minimum orders and price breaks." },
  ],
};
const ALL = [...OPTIONS.buy, ...OPTIONS.sell];
const TITLE = Object.fromEntries(ALL.map((o) => [o.id, o.title]));

const INDUSTRIES = ["Retail & e-commerce", "Restaurants & hospitality", "Construction", "Manufacturing", "Agriculture & food", "Healthcare", "Education", "Offices & services", "Other"];
const MODES = [
  ["retail", "Retail & pre-loved", "Everyday products for yourself"],
  ["bulk", "Wholesale & bulk (B2B)", "Bulk deals, suppliers and quotes"],
  ["both", "Both", "A mix of retail and wholesale"],
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s\-()]{5,}$/;

export default function Register({ initialRole = "buy" }) {
  const { user, ready, register, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const as = params.get("as") || "";
  const preset = ALL.some((o) => o.id === as) ? as : "";
  const startRole = initialRole === "sell" || as.startsWith("seller") ? "sell" : "buy";

  const [role, setRole] = useState(startRole);
  const [choice, setChoice] = useState(preset);
  const [step, setStep] = useState(preset ? 2 : 1);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirm: "",
    businessName: "", rcNumber: "", industry: "", buyingMode: preset === "buyer-business" ? "bulk" : "retail",
    storeName: "", city: "", state: "", description: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  if (ready && user?.seller) return <Navigate to="/sell" replace />;
  // Signed-in shoppers only come here to open a store
  if (ready && user && startRole !== "sell") return <Navigate to="/account" replace />;

  const needsAccount = !user;
  const isSeller = choice.startsWith("seller");
  const isBusiness = choice === "buyer-business" || choice === "seller-retail" || choice === "seller-wholesale";
  const options = OPTIONS[role];

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  };

  function choose(id) {
    setChoice(id);
    setForm((current) => ({ ...current, buyingMode: id === "buyer-business" ? "bulk" : id === "buyer-individual" ? "retail" : current.buyingMode }));
  }

  function validate() {
    const found = {};
    if (needsAccount) {
      if (form.name.trim().length < 2) found.name = "Enter your full name.";
      if (!EMAIL.test(form.email.trim())) found.email = "Enter a valid email address.";
      if (form.password.length < 8) found.password = "Use at least 8 characters.";
      else if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) found.password = "Use a mix of letters and numbers.";
      if (form.confirm !== form.password) found.confirm = "Passwords don't match.";
    }
    if (isBusiness && form.businessName.trim().length < 2) found.businessName = "Enter your business name.";
    if (isSeller) {
      if (form.storeName.trim().length < 3) found.storeName = "Choose a name (at least 3 characters).";
      if (!PHONE.test(form.phone.trim())) found.phone = "Enter a phone number buyers can reach you on.";
      if (!form.city.trim()) found.city = "Enter your city.";
      if (!form.state) found.state = "Select your state.";
    } else if (form.phone.trim() && !PHONE.test(form.phone.trim())) {
      found.phone = "Enter a valid phone number or leave it blank.";
    }
    return found;
  }

  async function submit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      if (needsAccount) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          buyerKind: isBusiness ? "business" : "individual",
          // sellers see mixed picks by default; wholesalers lean to bulk
          buyingMode: isSeller ? (choice === "seller-wholesale" ? "bulk" : choice === "seller-retail" ? "both" : "retail") : form.buyingMode,
          businessName: isBusiness ? form.businessName.trim() : "",
          rcNumber: isBusiness ? form.rcNumber.trim() : "",
          industry: choice === "buyer-business" ? form.industry : "",
        });
      }
      if (isSeller) {
        const data = await api.post("/api/sellers", {
          sellerType: choice.replace("seller-", ""),
          storeName: form.storeName.trim(),
          description: form.description.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          state: form.state,
          businessName: isBusiness ? form.businessName.trim() : "",
          rcNumber: isBusiness ? form.rcNumber.trim() : "",
        });
        setUser(data.user);
        toast("Your seller account is ready! Add your first listing.");
        navigate("/sell/products/new", { replace: true });
      } else {
        toast("Welcome to Marketfind!");
        navigate("/account", { replace: true });
      }
    } catch (err) {
      const fields = ["name", "email", "phone", "password", "businessName", "rcNumber", "storeName", "city", "state", "sellerType"];
      if (err.field && fields.includes(err.field)) setErrors({ [err.field]: err.message });
      else setFormError(err.message);
      setBusy(false);
    }
  }

  const input = (key, label, props = {}) => (
    <div className="seller-field">
      <label htmlFor={`rg-${key}`}>{label}</label>
      <input id={`rg-${key}`} value={form[key]} onChange={set(key)} disabled={busy} aria-invalid={Boolean(errors[key])} {...props} />
      {errors[key] && <span className="seller-error">{errors[key]}</span>}
    </div>
  );

  return (
    <Layout>
      <div className="site-container seller-page narrow wizard">
        <p className="page-kicker">Join Marketfind</p>
        <h1 className="page-title">
          {step === 1 ? "How will you use Marketfind?" : needsAccount ? "Create your account" : "Open your store"}
        </h1>
        <p className="page-sub">
          {needsAccount
            ? <>Already registered? <Link className="seller-link" to="/signin" state={{ from: "/sell/register" }}>Sign in</Link>.</>
            : <>You&apos;re signed in as {user.email}.</>}
        </p>

        {step === 1 && (
          <div className="wizard-step">
            {needsAccount && (
              <div className="wizard-tabs" role="tablist" aria-label="Buy or sell">
                {[["buy", "I want to buy", ShoppingBag], ["sell", "I want to sell", Store]].map(([id, label, Icon]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={role === id}
                    className={role === id ? "active" : ""}
                    onClick={() => { setRole(id); setChoice(""); }}
                  >
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </div>
            )}

            <div className="type-cards" role="radiogroup" aria-label="Account type">
              {options.map(({ id, icon: Icon, title, text }) => (
                <label key={id} className={`type-card ${choice === id ? "selected" : ""}`}>
                  <input type="radio" name="account-type" value={id} checked={choice === id} onChange={() => choose(id)} />
                  <Icon size={26} />
                  <strong>{title}</strong>
                  <span>{text}</span>
                </label>
              ))}
            </div>

            <div className="seller-form-actions">
              <button className="seller-button" disabled={!choice} onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form className="seller-form" onSubmit={submit} noValidate>
            <p className="wizard-summary">
              Joining as: <b>{TITLE[choice]}</b>{" "}
              <button type="button" className="seller-link plain" onClick={() => setStep(1)}>Change</button>
            </p>

            {needsAccount && (
              <fieldset>
                <legend>Your account</legend>
                {input("name", "Full name", { autoComplete: "name", maxLength: 80 })}
                {input("email", "Email", { type: "email", autoComplete: "email" })}
                {!isSeller && input("phone", "Phone (optional)", { type: "tel", autoComplete: "tel", placeholder: "0803 123 4567" })}
                <div className="seller-row">
                  {input("password", "Password", { type: "password", autoComplete: "new-password", placeholder: "8+ characters" })}
                  {input("confirm", "Confirm password", { type: "password", autoComplete: "new-password" })}
                </div>
              </fieldset>
            )}

            {isBusiness && (
              <fieldset>
                <legend>Business details</legend>
                {input("businessName", "Registered business name", { maxLength: 100, autoComplete: "organization" })}
                <div className="seller-row">
                  {input("rcNumber", "CAC / RC number (optional)", { maxLength: 30, placeholder: "RC-1234567" })}
                  {choice === "buyer-business" && (
                    <div className="seller-field">
                      <label htmlFor="rg-industry">Industry</label>
                      <select id="rg-industry" value={form.industry} onChange={set("industry")} disabled={busy}>
                        <option value="">Select industry</option>
                        {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <span className="seller-hint">Adding your RC number lets us verify your business and show a Verified badge.</span>
              </fieldset>
            )}

            {isSeller && (
              <fieldset>
                <legend>{choice === "seller-individual" ? "Your seller profile" : "Your store"}</legend>
                {input("storeName", choice === "seller-individual" ? "Name buyers will see" : "Store name", { maxLength: 60, placeholder: choice === "seller-individual" ? "e.g. Ada's Closet" : "e.g. Ada's Gadgets" })}
                {input("phone", "Phone number", { type: "tel", autoComplete: "tel", placeholder: "0803 123 4567" })}
                <div className="seller-row">
                  {input("city", "City", { autoComplete: "address-level2", maxLength: 80 })}
                  <div className="seller-field">
                    <label htmlFor="rg-state">State</label>
                    <select id="rg-state" value={form.state} onChange={set("state")} disabled={busy} aria-invalid={Boolean(errors.state)}>
                      <option value="">Select state</option>
                      {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <span className="seller-error">{errors.state}</span>}
                  </div>
                </div>
                <div className="seller-field">
                  <label htmlFor="rg-description">About {choice === "seller-individual" ? "you" : "your store"} (optional)</label>
                  <textarea id="rg-description" rows={3} maxLength={500} value={form.description} onChange={set("description")} disabled={busy} />
                </div>
              </fieldset>
            )}

            {!isSeller && (
              <fieldset>
                <legend>What would you like to see?</legend>
                <div className="mode-options">
                  {MODES.map(([value, label, text]) => (
                    <label key={value} className={form.buyingMode === value ? "selected" : ""}>
                      <input type="radio" name="mode" value={value} checked={form.buyingMode === value} onChange={set("buyingMode")} />
                      <strong>{label}</strong>
                      <span>{text}</span>
                    </label>
                  ))}
                </div>
                <span className="seller-hint">Your dashboard and home page recommendations follow this. You can change it any time.</span>
              </fieldset>
            )}

            {formError && <p className="seller-form-error" role="alert">{formError}</p>}

            <div className="seller-form-actions">
              <button className="seller-button" type="submit" disabled={busy}>
                {busy ? "Creating…" : isSeller ? (needsAccount ? "Create account and start selling" : "Open my store") : "Create account"}
              </button>
              <button type="button" className="seller-link plain" onClick={() => setStep(1)} disabled={busy}>Back</button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}

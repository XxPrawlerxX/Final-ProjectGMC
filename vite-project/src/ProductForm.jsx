import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { api } from "./lib/api";
import { CONDITION_LABEL } from "./lib/labels";
import { BULK_UNITS, MAX_TIERS } from "./lib/pricing";
import { useApi } from "./useApi";
import { useAuth } from "./auth/authContext";
import { useToast } from "./toast/toastContext";
import Layout from "./Layout";
import ImagePicker from "./ImagePicker";
import NotFound from "./NotFound";
import "./seller.css";

const toNumber = (text) => String(text).replace(/[,\s₦]/g, "");
const isWhole = (text) => /^\d+$/.test(toNumber(text));

// One upload page, three versions: what you can enter depends on the kind of seller.
//  retail     - normal products with stock
//  wholesale  - bulk listings: unit, minimum order, price breaks, lead time
//  individual - second-hand / single items: condition, negotiable
const COPY = {
  retail: { add: "Add a product", edit: "Edit product", priceLabel: "Price (₦)", button: "Publish product", published: "Product published. It's now live in the shop." },
  wholesale: { add: "Add a bulk listing", edit: "Edit bulk listing", priceLabel: "Price per unit (₦) at the minimum order", button: "Publish bulk listing", published: "Bulk listing published. Buyers can order it now." },
  individual: { add: "List an item for sale", edit: "Edit listing", priceLabel: "Asking price (₦)", button: "Publish listing", published: "Your item is listed." },
};

function Form({ product, categories, sellerType }) {
  const navigate = useNavigate();
  const toast = useToast();
  const editing = Boolean(product);
  const wholesale = sellerType === "wholesale";
  const individual = sellerType === "individual";
  const copy = COPY[sellerType];

  const [form, setForm] = useState({
    name: product?.name ?? "",
    categorySlug: product?.categorySlug ?? "",
    price: product ? String(product.price) : "",
    oldPrice: product && product.oldPrice > product.price ? String(product.oldPrice) : "",
    stock: product ? String(product.stock) : wholesale ? "100" : "1",
    shipping: product?.shipping ?? "",
    description: product?.description ?? "",
    // bulk
    unit: product?.unit ?? "piece",
    minOrderQty: product ? String(product.minOrderQty) : "10",
    leadTimeDays: product ? String(product.leadTimeDays) : "0",
    audience: product?.audience ?? "everyone",
    // second-hand
    condition: product?.condition ?? "",
    negotiable: product?.negotiable ?? false,
  });
  const [tiers, setTiers] = useState((product?.priceTiers ?? []).map((t) => ({ minQty: String(t.minQty), price: String(t.price) })));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  };
  const setTier = (index, key, value) => {
    setTiers((current) => current.map((t, i) => (i === index ? { ...t, [key]: value } : t)));
    if (errors.priceTiers) setErrors((current) => ({ ...current, priceTiers: "" }));
  };

  function validate() {
    const found = {};
    if (form.name.trim().length < 3) found.name = "Give it a name (at least 3 characters).";
    if (!form.categorySlug) found.categorySlug = "Choose the category shoppers should find it in.";
    if (!isWhole(form.price) || Number(toNumber(form.price)) < 1) found.price = "Enter the price in naira, e.g. 15000.";
    if (form.oldPrice && Number(toNumber(form.oldPrice)) <= Number(toNumber(form.price))) {
      found.oldPrice = "This must be higher than the price.";
    }
    if (!editing && files.length === 0) found.images = "Add at least one picture.";
    if (individual && !form.condition) found.condition = "Tell buyers what condition it's in.";
    if (!individual && !isWhole(form.stock)) found.stock = "Enter how many you have in stock (0 or more).";
    if (wholesale) {
      const moq = Number(toNumber(form.minOrderQty));
      if (!isWhole(form.minOrderQty) || moq < 1) found.minOrderQty = "Enter the smallest order you'll accept.";
      if (isWhole(form.stock) && moq >= 1 && Number(toNumber(form.stock)) > 0 && Number(toNumber(form.stock)) < moq) {
        found.stock = `Stock should be at least the minimum order (${moq}), or 0.`;
      }
      if (!isWhole(form.leadTimeDays)) found.leadTimeDays = "Enter a number of days (0 or more).";
      let previousQty = moq;
      let previousPrice = Number(toNumber(form.price));
      for (const tier of tiers) {
        const q = Number(toNumber(tier.minQty));
        const p = Number(toNumber(tier.price));
        if (!isWhole(tier.minQty) || !isWhole(tier.price)) { found.priceTiers = "Fill in every price break with whole numbers."; break; }
        if (q <= previousQty) { found.priceTiers = `Each price break must start above ${previousQty} units.`; break; }
        if (p < 1 || p >= previousPrice) { found.priceTiers = "Each price break must be cheaper than the one before it."; break; }
        previousQty = q;
        previousPrice = p;
      }
    }
    return found;
  }

  async function submit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) {
      document.querySelector(`[data-field="${Object.keys(found)[0]}"]`)?.scrollIntoView({ block: "center" });
      return;
    }

    const data = new FormData();
    data.set("name", form.name.trim());
    data.set("categorySlug", form.categorySlug);
    data.set("price", toNumber(form.price));
    data.set("oldPrice", toNumber(form.oldPrice));
    data.set("shipping", form.shipping.trim());
    data.set("description", form.description.trim());
    if (!individual) data.set("stock", toNumber(form.stock));
    if (wholesale) {
      data.set("unit", form.unit);
      data.set("minOrderQty", toNumber(form.minOrderQty));
      data.set("leadTimeDays", toNumber(form.leadTimeDays));
      data.set("audience", form.audience);
      data.set("priceTiers", JSON.stringify(tiers.map((t) => ({ minQty: Number(toNumber(t.minQty)), price: Number(toNumber(t.price)) }))));
    }
    if (individual) {
      data.set("condition", form.condition);
      data.set("negotiable", String(form.negotiable));
    }
    files.forEach((file) => data.append("images", file));

    setBusy(true);
    try {
      if (editing) await api.patchForm(`/api/seller/products/${product.id}`, data);
      else await api.postForm("/api/seller/products", data);
      toast(editing ? "Saved" : copy.published);
      navigate("/sell");
    } catch (err) {
      const fields = ["name", "categorySlug", "price", "oldPrice", "stock", "images", "condition", "minOrderQty", "leadTimeDays", "priceTiers", "unit", "audience"];
      if (err.field && fields.includes(err.field)) setErrors({ [err.field]: err.message });
      else setFormError(err.message);
      setBusy(false);
    }
  }

  const error = (key) => errors[key] && <span className="seller-error" id={`err-${key}`}>{errors[key]}</span>;

  return (
    <form className="seller-form" onSubmit={submit} noValidate>
      <div className="seller-field" data-field="images">
        <label>Pictures</label>
        <ImagePicker
          files={files}
          onChange={(next) => {
            setFiles(next);
            if (errors.images) setErrors((current) => ({ ...current, images: "" }));
          }}
          existing={product?.images ?? []}
        />
        {individual && <span className="seller-hint">Show the item clearly, including any marks or damage. Honest photos sell faster.</span>}
        {error("images")}
      </div>

      <div className="seller-field" data-field="name">
        <label htmlFor="pf-name">{individual ? "What are you selling?" : "Product name"}</label>
        <input id="pf-name" value={form.name} onChange={set("name")} maxLength={120} placeholder={individual ? "e.g. iPhone 11, 64GB, black" : wholesale ? "e.g. Premium parboiled rice, 50kg bag" : "e.g. Samsung Galaxy A15, 128GB"} aria-invalid={Boolean(errors.name)} />
        {error("name")}
      </div>

      <div className="seller-field" data-field="categorySlug">
        <label htmlFor="pf-category">Category</label>
        <select id="pf-category" value={form.categorySlug} onChange={set("categorySlug")} aria-invalid={Boolean(errors.categorySlug)}>
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <span className="seller-hint">It appears on this category&apos;s page, with the pictures you upload.</span>
        {error("categorySlug")}
      </div>

      {individual && (
        <div className="seller-field" data-field="condition">
          <label htmlFor="pf-condition">Condition</label>
          <select id="pf-condition" value={form.condition} onChange={set("condition")} aria-invalid={Boolean(errors.condition)}>
            <option value="">Select condition</option>
            {Object.entries(CONDITION_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {error("condition")}
        </div>
      )}

      {wholesale && (
        <fieldset className="seller-subform">
          <legend>Bulk selling</legend>
          <div className="seller-row">
            <div className="seller-field">
              <label htmlFor="pf-unit">Sold by the</label>
              <select id="pf-unit" value={form.unit} onChange={set("unit")}>
                {BULK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="seller-field" data-field="minOrderQty">
              <label htmlFor="pf-moq">Minimum order (units)</label>
              <input id="pf-moq" inputMode="numeric" value={form.minOrderQty} onChange={set("minOrderQty")} aria-invalid={Boolean(errors.minOrderQty)} />
              {error("minOrderQty")}
            </div>
            <div className="seller-field" data-field="stock">
              <label htmlFor="pf-stock">Units in stock</label>
              <input id="pf-stock" inputMode="numeric" value={form.stock} onChange={set("stock")} aria-invalid={Boolean(errors.stock)} />
              {error("stock")}
            </div>
          </div>
        </fieldset>
      )}

      <div className="seller-row">
        <div className="seller-field" data-field="price">
          <label htmlFor="pf-price">{copy.priceLabel}</label>
          <input id="pf-price" inputMode="numeric" value={form.price} onChange={set("price")} placeholder="15000" aria-invalid={Boolean(errors.price)} />
          {error("price")}
        </div>
        {!wholesale && (
          <div className="seller-field" data-field="oldPrice">
            <label htmlFor="pf-old">{individual ? "Original price (₦), optional" : "“Was” price (₦), optional"}</label>
            <input id="pf-old" inputMode="numeric" value={form.oldPrice} onChange={set("oldPrice")} placeholder="20000" aria-invalid={Boolean(errors.oldPrice)} />
            <span className="seller-hint">Shows a discount badge.</span>
            {error("oldPrice")}
          </div>
        )}
        {!wholesale && !individual && (
          <div className="seller-field" data-field="stock">
            <label htmlFor="pf-stock">In stock</label>
            <input id="pf-stock" inputMode="numeric" value={form.stock} onChange={set("stock")} aria-invalid={Boolean(errors.stock)} />
            {error("stock")}
          </div>
        )}
      </div>

      {wholesale && (
        <div className="seller-field" data-field="priceTiers">
          <label>Price breaks (optional)</label>
          <span className="seller-hint">Lower the unit price when buyers order more. Each break must start above the one before and be cheaper.</span>
          <ul className="tier-editor">
            {tiers.map((tier, index) => (
              <li key={index}>
                <span>From</span>
                <input inputMode="numeric" value={tier.minQty} onChange={(e) => setTier(index, "minQty", e.target.value)} aria-label={`Price break ${index + 1} starts at`} placeholder="100" />
                <span>{form.unit}s at ₦</span>
                <input inputMode="numeric" value={tier.price} onChange={(e) => setTier(index, "price", e.target.value)} aria-label={`Price break ${index + 1} unit price`} placeholder="900" />
                <button type="button" className="icon-button" onClick={() => setTiers((c) => c.filter((_, i) => i !== index))} aria-label={`Remove price break ${index + 1}`}>
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
          {tiers.length < MAX_TIERS && (
            <button type="button" className="seller-button secondary small" onClick={() => setTiers((c) => [...c, { minQty: "", price: "" }])}>
              <Plus size={15} /> Add a price break
            </button>
          )}
          {error("priceTiers")}
        </div>
      )}

      {wholesale && (
        <div className="seller-row">
          <div className="seller-field" data-field="leadTimeDays">
            <label htmlFor="pf-lead">Ready to ship in (days)</label>
            <input id="pf-lead" inputMode="numeric" value={form.leadTimeDays} onChange={set("leadTimeDays")} aria-invalid={Boolean(errors.leadTimeDays)} />
            {error("leadTimeDays")}
          </div>
          <div className="seller-field">
            <label htmlFor="pf-audience">Who can buy this?</label>
            <select id="pf-audience" value={form.audience} onChange={set("audience")}>
              <option value="everyone">Businesses and individuals</option>
              <option value="business">Businesses only</option>
            </select>
          </div>
        </div>
      )}

      {individual && (
        <label className="seller-check">
          <input type="checkbox" checked={form.negotiable} onChange={set("negotiable")} />
          I&apos;m open to offers (price negotiable)
        </label>
      )}

      <div className="seller-field">
        <label htmlFor="pf-shipping">{individual ? "Pickup / delivery" : "Delivery note, optional"}</label>
        <input id="pf-shipping" value={form.shipping} onChange={set("shipping")} maxLength={80} placeholder={individual ? "e.g. Pickup in Lekki, or delivery by arrangement" : "e.g. Delivery within Lagos in 2 days"} />
      </div>

      <div className="seller-field">
        <label htmlFor="pf-description">Description</label>
        <textarea id="pf-description" rows={6} value={form.description} onChange={set("description")} maxLength={4000} placeholder={individual ? "How old is it, how was it used, any faults, what's included…" : wholesale ? "Specifications, packaging, brand, certifications…" : "Condition, size, colour, what's in the box…"} />
      </div>

      {formError && <p className="seller-form-error" role="alert">{formError}</p>}

      <div className="seller-form-actions">
        <button className="seller-button" type="submit" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save changes" : copy.button}
        </button>
        <Link className="seller-link" to="/sell">Cancel</Link>
      </div>
    </form>
  );
}

export default function ProductForm() {
  const { slug } = useParams();
  const { user } = useAuth();
  const categories = useApi("/api/categories");
  const mine = useApi(slug ? "/api/seller/products" : null);

  const sellerType = user.seller?.sellerType;
  const product = slug ? mine.data?.items.find((p) => p.id === slug) : null;
  const ready = categories.data && (!slug || mine.data);

  if (!sellerType) {
    return <NotFound title="Open a store first" message="Register as a seller to add products." />;
  }
  if (slug && mine.data && !product) return <NotFound title="Listing not found" message="You can only edit your own listings." />;

  const copy = COPY[sellerType];
  return (
    <Layout>
      <div className="site-container seller-page narrow">
        <Link className="seller-back" to="/sell"><ChevronLeft size={16} /> Back to dashboard</Link>
        <h1 className="page-title">{slug ? copy.edit : copy.add}</h1>
        {!ready && <div className="skeleton" style={{ height: 320, marginTop: 20 }} role="status" aria-label="Loading" />}
        {(categories.error || mine.error) && <p role="alert">{(categories.error || mine.error).message}</p>}
        {ready && <Form key={product?.id ?? "new"} product={product} categories={categories.data.items} sellerType={sellerType} />}
      </div>
    </Layout>
  );
}

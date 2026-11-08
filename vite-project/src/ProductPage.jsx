import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, Building2, ChevronRight, Clock, Heart, MapPin, MessageCircle, Minus, Plus, RotateCcw, ShieldCheck, Star, Truck, User } from "lucide-react";
import { api } from "./lib/api";
import { discountPercent, formatNaira } from "./lib/format";
import { CONDITION_LABEL, SELLER_TYPE_LABEL, plural } from "./lib/labels";
import { unitPriceFor } from "./lib/pricing";
import { useApi } from "./useApi";
import { useAuth } from "./auth/authContext";
import { useCart } from "./useCart";
import { useToast } from "./toast/toastContext";
import { useWishlist } from "./wishlist/wishlistContext";
import Layout from "./Layout";
import NotFound from "./NotFound";
import ChatPanel from "./ChatPanel";
import ProductCard from "./ProductCard";
import "./cards.css";
import "./listing.css";
import "./shop.css";

function Stars({ value, size = 16 }) {
  return (
    <span className="stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(value) ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

function Reviews({ productId, onChanged }) {
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const { data, loading, reload } = useApi(`/api/products/${productId}/reviews`);
  const [form, setForm] = useState(null); // null until the shopper starts writing
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mine = data?.mine;
  const draft = form ?? { rating: mine?.rating ?? 5, title: mine?.title ?? "", body: mine?.body ?? "" };

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/products/${productId}/reviews`, draft);
      setForm(null);
      reload();
      onChanged();
      toast("Thanks for your review!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api.delete(`/api/products/${productId}/reviews/mine`);
      setForm(null);
      reload();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="reviews" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading">Customer reviews</h2>

      {user ? (
        <form className="review-form" onSubmit={submit}>
          <h3>{mine ? "Update your review" : "Write a review"}</h3>
          <fieldset className="review-rating">
            <legend className="sr-only">Your rating</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className={n <= draft.rating ? "on" : ""}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={draft.rating === n}
                  onChange={() => setForm({ ...draft, rating: n })}
                />
                <Star size={26} fill={n <= draft.rating ? "currentColor" : "none"} />
                <span className="sr-only">{n} stars</span>
              </label>
            ))}
          </fieldset>
          <input
            placeholder="Headline (optional)"
            maxLength={100}
            value={draft.title}
            onChange={(event) => setForm({ ...draft, title: event.target.value })}
            aria-label="Review headline"
          />
          <textarea
            rows={3}
            placeholder="What did you like or dislike?"
            maxLength={2000}
            value={draft.body}
            onChange={(event) => setForm({ ...draft, body: event.target.value })}
            aria-label="Review text"
          />
          {error && <p className="review-error" role="alert">{error}</p>}
          <div className="review-actions">
            <button type="submit" disabled={saving}>{saving ? "Saving…" : mine ? "Update review" : "Post review"}</button>
            {mine && <button type="button" className="link" onClick={remove}>Delete my review</button>}
          </div>
        </form>
      ) : (
        <p className="reviews-signin">
          <Link to="/signin" state={{ from: location.pathname }}>Sign in</Link> to write a review.
        </p>
      )}

      {loading && <p className="reviews-empty">Loading reviews…</p>}
      {data && data.items.length === 0 && <p className="reviews-empty">No reviews yet. Be the first!</p>}
      <ul className="review-list">
        {data?.items.map((review) => (
          <li key={review.id}>
            <div className="review-head">
              <Stars value={review.rating} size={15} />
              <strong>{review.userName}</strong>
              <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</time>
            </div>
            {review.title && <h4>{review.title}</h4>}
            {review.body && <p>{review.body}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProductPage() {
  const { productId } = useParams();
  const { data, error, loading, reload } = useApi(`/api/products/${encodeURIComponent(productId)}`);

  if (error?.status === 404) {
    return <NotFound title="Product not found" message="This product may have been removed or the link is incorrect." />;
  }

  return (
    <Layout activeCategory={data?.product.categorySlug}>
      <div className="site-container product-page">
        {loading && <div className="skeleton product-skeleton" role="status" aria-label="Loading product" />}
        {error && !loading && (
          <div className="listing-message">
            <h2>We couldn&apos;t load this product</h2>
            <p>{error.message}</p>
            <button onClick={reload}>Try again</button>
          </div>
        )}
        {data && <ProductDetail key={data.product.id} product={data.product} related={data.related} onReviewChange={reload} />}
      </div>
    </Layout>
  );
}

function ProductDetail({ product, related, onReviewChange }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const toast = useToast();
  const wishlist = useWishlist();
  const { user } = useAuth();

  const bulk = product.listingType === "bulk";
  const preloved = product.listingType === "secondhand";
  const min = product.minOrderQty;
  const maxQty = bulk ? Math.max(min, product.stock) : Math.max(1, Math.min(20, product.stock));

  const [quantity, setQuantity] = useState(min);
  const [active, setActive] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [prefill, setPrefill] = useState({ key: 0, text: "" });

  const images = product.images?.length ? product.images : [product.image];
  const isOwnProduct = Boolean(product.seller && user?.seller?.storeSlug === product.seller.slug);
  const businessOnly = product.audience === "business";
  const canBuy = !businessOnly || user?.buyer?.kind === "business";

  const unitPrice = unitPriceFor(product, quantity);
  const discount = bulk ? 0 : discountPercent(product.price, product.oldPrice);
  const soldOut = product.stock < min;
  const saved = wishlist.has(product.id);

  const setQty = (value) => {
    const n = Number.parseInt(value, 10);
    if (Number.isInteger(n)) setQuantity(Math.min(Math.max(n, min), maxQty));
  };

  function handleAdd() {
    addToCart(product, quantity);
    toast(`${product.name} added to cart`, { to: "/cart", label: "View cart" });
  }

  function handleBuyNow() {
    addToCart(product, quantity);
    navigate("/checkout");
  }

  function openChat(text) {
    setPrefill((current) => ({ key: current.key + 1, text }));
    setChatOpen(true);
  }

  const quoteText = `Hello, I'd like a quote for ${quantity} ${plural(product.unit, quantity)} of ${product.name}. Please share your best price and delivery time.`;
  const offerText = `Hi, I'm interested in ${product.name}. Would you accept ₦ for it?`;

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} />
        {bulk && (<><Link to="/wholesale">Wholesale</Link><ChevronRight size={13} /></>)}
        {preloved && (<><Link to="/preloved">Pre-loved</Link><ChevronRight size={13} /></>)}
        <Link to={`/category/${product.categorySlug}`}>{product.category}</Link>
        <ChevronRight size={13} />
        <span aria-current="page">{product.name}</span>
      </nav>

      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-detail-image">
            <img src={images[active] ?? images[0]} alt={product.name} />
          </div>
          {images.length > 1 && (
            <ul className="product-thumbs" aria-label="Product pictures">
              {images.map((url, index) => (
                <li key={url}>
                  <button className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`Show picture ${index + 1}`} aria-current={index === active}>
                    <img src={url} alt="" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="product-detail-info">
          <Link className="shop-kicker" to={`/category/${product.categorySlug}`}>{product.category}</Link>
          <h1>{product.name}</h1>

          <div className="product-chips">
            {bulk && <span className="chip bulk">Wholesale · Bulk</span>}
            {preloved && <span className="chip preloved">Pre-loved · {CONDITION_LABEL[product.condition] || "Used"}</span>}
            {preloved && product.negotiable && <span className="chip">Price negotiable</span>}
            {businessOnly && <span className="chip">Business accounts only</span>}
          </div>

          <p className="product-sold-by">
            Sold by{" "}
            {product.seller ? <Link to={`/store/${product.seller.slug}`}>{product.seller.name}</Link> : <b>Marketfind</b>}
            {product.seller && (
              <span className="seller-kind">
                {product.seller.type === "individual" ? <User size={13} /> : <Building2 size={13} />}
                {SELLER_TYPE_LABEL[product.seller.type]}
                {product.seller.verified && <BadgeCheck size={14} className="verified-icon" aria-label="Verified" />}
              </span>
            )}
          </p>
          {product.location && (
            <p className="product-location"><MapPin size={14} /> {product.location.city}, {product.location.state}</p>
          )}

          {product.reviewCount > 0 && (
            <a className="product-detail-rating" href="#reviews-heading" aria-label={`Rated ${product.rating} out of 5 from ${product.reviewCount} reviews`}>
              <Stars value={product.rating} />
              {product.rating.toFixed(1)} <em>({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})</em>
            </a>
          )}

          <div className="product-detail-price">
            <strong>{formatNaira(unitPrice)}</strong>
            {bulk && <span className="product-unit">per {product.unit}</span>}
            {discount > 0 && <del>{formatNaira(product.oldPrice)}</del>}
            {discount > 0 && <span className="product-detail-saving">-{discount}%</span>}
          </div>

          {bulk && (
            <div className="bulk-box">
              <p>
                <b>Minimum order:</b> {min} {plural(product.unit, min)}
                {product.leadTimeDays > 0 && <> · <Clock size={13} /> Ready in about {product.leadTimeDays} {product.leadTimeDays === 1 ? "day" : "days"}</>}
              </p>
              {product.priceTiers.length > 0 && (
                <table className="tier-table">
                  <caption className="sr-only">Price breaks</caption>
                  <thead><tr><th>Quantity</th><th>Price per {product.unit}</th></tr></thead>
                  <tbody>
                    {[{ minQty: min, price: product.price }, ...product.priceTiers].map((tier, index, all) => {
                      const next = all[index + 1];
                      const label = next ? `${tier.minQty} – ${next.minQty - 1}` : `${tier.minQty}+`;
                      const current = unitPrice === tier.price && quantity >= tier.minQty && (!next || quantity < next.minQty);
                      return (
                        <tr key={tier.minQty} className={current ? "current" : ""}>
                          <td>{label}</td>
                          <td>{formatNaira(tier.price)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <p className={`product-detail-stock ${soldOut ? "out" : !bulk && !preloved && product.stock <= 5 ? "low" : ""}`}>
            {soldOut
              ? preloved ? "This item has been sold" : "Out of stock"
              : bulk ? `${product.stock.toLocaleString("en-NG")} ${plural(product.unit, product.stock)} available`
              : preloved ? "1 available"
              : product.stock <= 5 ? `Only ${product.stock} left in stock` : `In stock · ${product.shipping}`}
          </p>

          <p className="product-detail-description">
            {product.description || `${product.name} from our ${product.category.toLowerCase()} collection, chosen for everyday value.`}
          </p>
          {(bulk || preloved) && <p className="product-delivery-note"><Truck size={15} /> {product.shipping}</p>}

          {canBuy ? (
            <div className="product-detail-actions">
              {!soldOut && !preloved && (
                <div className="qty-stepper">
                  <button onClick={() => setQty(quantity - 1)} disabled={quantity <= min} aria-label="Decrease quantity">
                    <Minus size={16} />
                  </button>
                  {bulk ? (
                    <input
                      key={quantity}
                      className="qty-input"
                      type="number"
                      inputMode="numeric"
                      min={min}
                      max={maxQty}
                      defaultValue={quantity}
                      onBlur={(event) => setQty(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && event.target.blur()}
                      aria-label="Quantity"
                    />
                  ) : (
                    <span aria-live="polite">{quantity}</span>
                  )}
                  <button onClick={() => setQty(quantity + 1)} disabled={quantity >= maxQty} aria-label="Increase quantity">
                    <Plus size={16} />
                  </button>
                </div>
              )}
              <button className="product-add-button" onClick={handleAdd} disabled={soldOut}>
                {soldOut ? "Sold out" : bulk ? `Add ${quantity} to cart · ${formatNaira(unitPrice * quantity)}` : "Add to cart"}
              </button>
              {!soldOut && <button className="product-buy-button" onClick={handleBuyNow}>Buy now</button>}
              <button
                className={`product-save-button ${saved ? "saved" : ""}`}
                onClick={async () => {
                  if (await wishlist.toggle(product.id)) toast("Saved to your wishlist", { to: "/account?tab=wishlist", label: "View" });
                }}
                aria-pressed={saved}
                aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart size={20} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>
          ) : (
            <div className="business-only-note" role="note">
              <Building2 size={20} />
              <div>
                <strong>This is a wholesale listing for businesses.</strong>
                <p>
                  {user ? "Your account is set up as an individual shopper." : "Sign in with a business account to order."}{" "}
                  {user
                    ? <Link to="/account?tab=profile">Switch to a business account</Link>
                    : <><Link to="/signin" state={{ from: `/product/${product.id}` }}>Sign in</Link> or <Link to="/register?as=buyer-business">register your business</Link></>}
                </p>
              </div>
            </div>
          )}

          {product.seller && !isOwnProduct && (
            <>
              {bulk && canBuy && !soldOut && (
                <button className="product-chat-button" onClick={() => openChat(quoteText)}>
                  <MessageCircle size={18} /> Request a quote for {quantity} {plural(product.unit, quantity)}
                </button>
              )}
              <button className="product-chat-button" onClick={() => (chatOpen ? setChatOpen(false) : openChat(preloved ? offerText : ""))} aria-expanded={chatOpen}>
                <MessageCircle size={18} /> {chatOpen ? "Hide chat" : preloved ? "Chat / make an offer" : "Chat with seller"}
              </button>
              {chatOpen && <ChatPanel key={prefill.key} product={product} prefill={prefill.text} />}
            </>
          )}

          <ul className="product-perks">
            <li><Truck size={20} /><strong>Delivery</strong>{preloved ? "Pickup or delivery, agreed with the seller" : "Delivered to your door"}</li>
            <li><ShieldCheck size={20} /><strong>Secure payment</strong>Card, transfer or USSD via Paystack</li>
            <li><RotateCcw size={20} /><strong>Easy returns</strong>Contact us if something&apos;s wrong</li>
          </ul>
        </div>
      </section>

      <Reviews productId={product.id} onChanged={onReviewChange} />

      {related.length > 0 && (
        <section className="related-section">
          <p className="shop-kicker">Keep browsing</p>
          <h2>More in {product.category}</h2>
          <div className="pgrid">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </>
  );
}

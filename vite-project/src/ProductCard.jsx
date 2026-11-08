import { Link } from "react-router-dom";
import { BadgeCheck, Heart, Star } from "lucide-react";
import { discountPercent, formatNaira } from "./lib/format";
import { CONDITION_LABEL, plural } from "./lib/labels";
import { bestPrice } from "./lib/pricing";
import { useCart } from "./useCart";
import { useToast } from "./toast/toastContext";
import { useWishlist } from "./wishlist/wishlistContext";
import "./cards.css";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const toast = useToast();
  const wishlist = useWishlist();

  const href = `/product/${product.id}`;
  const saved = wishlist.has(product.id);
  const bulk = product.listingType === "bulk";
  const preloved = product.listingType === "secondhand";
  const discount = bulk ? 0 : discountPercent(product.price, product.oldPrice);
  const best = bestPrice(product);
  const soldOut = product.stock < product.minOrderQty;

  function handleAdd() {
    addToCart(product, product.minOrderQty);
    toast(`${product.name} added to cart`, { to: "/cart", label: "View cart" });
  }

  async function handleSave() {
    const nowSaved = await wishlist.toggle(product.id);
    if (nowSaved) toast("Saved to your wishlist", { to: "/account?tab=wishlist", label: "View" });
  }

  let note = product.shipping;
  if (bulk) note = `Min. order ${product.minOrderQty} ${plural(product.unit, product.minOrderQty)}`;
  if (preloved) note = [CONDITION_LABEL[product.condition], product.location?.city].filter(Boolean).join(" · ");

  return (
    <article className="pcard">
      <div className="pcard-image">
        <Link to={href} aria-label={`View ${product.name}`}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </Link>
        {bulk && <span className="pcard-badge bulk">Bulk</span>}
        {preloved && <span className="pcard-badge preloved">Pre-loved</span>}
        {discount > 0 && <span className="pcard-badge">-{discount}%</span>}
        <button
          className={`pcard-heart ${saved ? "saved" : ""}`}
          onClick={handleSave}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="pcard-body">
        <h3>
          <Link to={href}>{product.name}</Link>
        </h3>

        <div className="pcard-rating" aria-label={product.reviewCount > 0 ? `Rated ${product.rating} out of 5` : undefined}>
          {product.reviewCount > 0 && (
            <>
              <Star size={13} fill="currentColor" /> {product.rating.toFixed(1)}
              <span>({product.reviewCount})</span>
            </>
          )}
        </div>

        <div className="pcard-price">
          <strong>{formatNaira(product.price)}</strong>
          {bulk && <span className="pcard-unit">/ {product.unit}</span>}
          {discount > 0 && <del>{formatNaira(product.oldPrice)}</del>}
        </div>
        {bulk && best < product.price && <p className="pcard-tier">Down to {formatNaira(best)} / {product.unit}</p>}

        {soldOut ? (
          <p className="pcard-stock out">{preloved ? "Sold" : "Out of stock"}</p>
        ) : !bulk && product.stock <= 5 && !preloved ? (
          <p className="pcard-stock low">Only {product.stock} left</p>
        ) : (
          <p className="pcard-stock">
            {product.seller?.verified && <BadgeCheck size={13} className="verified-icon" aria-label="Verified seller" />} {note}
          </p>
        )}

        <button className="pcard-add" onClick={handleAdd} disabled={soldOut}>
          {soldOut ? (preloved ? "Sold" : "Sold out") : bulk ? `Add ${product.minOrderQty} to cart` : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

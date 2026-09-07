import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart, Minus, Plus, ShoppingCart, Star, Store } from "lucide-react";
import { formatNaira } from "../categoryUtils";
import { getProductById } from "../api/productApi";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductReviews from "../components/ProductReviews";
// Fixes a pre-existing gap: this page uses .market-product-image,
// .product-tag, .product-shop-button, and .product-rating, all defined
// here — but never actually imported this stylesheet itself. It only
// "worked" before if the user had already visited a category/search
// page in the same session (which does import it) first.
import "./category.css";

// No product detail page existed in the original design — products were
// only ever added to the cart directly from a card. This page reuses
// the site's existing card/button classes (market-product-card,
// product-shop-button, cart-back-button, etc.) so it looks like it
// belongs, rather than introducing a new visual style.
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getProductById(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate("/signin", { state: { from: `/product/${id}` } });
      return;
    }

    setAdding(true);
    const result = await addItem(product._id, quantity);
    setAdding(false);

    showNotice(result.ok ? `${product.name} added to cart` : result.message);
  }

  async function handleToggleWishlist() {
    if (!isAuthenticated) {
      navigate("/signin", { state: { from: `/product/${id}` } });
      return;
    }

    const wasWishlisted = isWishlisted(product._id);
    const result = await toggleWishlist(product._id);

    showNotice(
      result.ok
        ? wasWishlisted
          ? "Removed from wishlist"
          : "Saved to wishlist"
        : result.message,
    );
  }

  if (error) {
    return (
      <div className="product-detail-page">
        <button className="cart-back-button" onClick={() => navigate("/")}>
          <ChevronLeft size={18} />
          Continue shopping
        </button>
        <p className="signin-form-message">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-page">
        <p>Loading product…</p>
      </div>
    );
  }

  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const outOfStock = product.stock === 0;

  return (
    <div className="product-detail-page">
      <button className="cart-back-button" onClick={() => navigate(-1)}>
        <ChevronLeft size={18} />
        Back
      </button>

      <div className="product-detail-layout">
        <div className="market-product-image product-detail-image">
          <img src={product.image} alt={product.name} />
          {product.tag && <span className="product-tag">{product.tag}</span>}
        </div>

        <div className="product-detail-info">
          {product.category?.name && (
            <p className="category-kicker">{product.category.name.toUpperCase()}</p>
          )}

          <h1>{product.name}</h1>

          <div className="product-rating product-detail-rating">
            <Star size={14} fill="currentColor" />
            {product.numReviews > 0 ? (
              <>
                {product.averageRating.toFixed(1)} <em>({product.numReviews} review{product.numReviews === 1 ? "" : "s"})</em>
              </>
            ) : (
              <span>No reviews yet</span>
            )}
          </div>

          {product.vendor?.storeName && (
            <p className="product-detail-vendor">
              <Store size={15} />
              Sold by {product.vendor.storeName}
            </p>
          )}

          <div className="product-price-row product-detail-price">
            <strong>{formatNaira(product.price)}</strong>
            {hasDiscount && <del>{formatNaira(product.oldPrice)}</del>}
          </div>

          <p className="product-detail-description">{product.description}</p>

          <p className="product-detail-stock">
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
            {product.shipping && ` • ${product.shipping}`}
          </p>

          {!outOfStock && (
            <div className="quantity-controls product-detail-quantity">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>

              <span>{quantity}</span>

              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          <div className="product-detail-actions">
            <button
              className="product-shop-button product-detail-add-button"
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
            >
              <ShoppingCart size={16} />
              {outOfStock ? "Out of stock" : adding ? "Adding…" : "Add to cart"}
            </button>

            <button
              className={`product-detail-wishlist-button${isWishlisted(product._id) ? " active" : ""}`}
              onClick={handleToggleWishlist}
              aria-label={isWishlisted(product._id) ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart size={18} fill={isWishlisted(product._id) ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <ProductReviews productId={product._id} />

      {notice && (
        <button className="category-toast" onClick={() => setNotice("")}>
          {notice}
          <span>×</span>
        </button>
      )}
    </div>
  );
}

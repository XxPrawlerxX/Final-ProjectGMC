import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, ShoppingCart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { formatNaira } from "../categoryUtils";
// Reused here for .product-shop-button and .category-toast.
import "./category.css";

// No wishlist page existed before — reuses the same card/button classes
// as the cart page (cart-item, cart-back-button) rather than inventing
// a new visual style.
export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, loading, removeItem } = useWishlist();
  const { addItem: addToCart } = useCart();
  const [notice, setNotice] = useState("");

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function handleAddToCart(product) {
    const result = await addToCart(product._id, 1);
    showNotice(result.ok ? `${product.name} added to cart` : result.message);
  }

  async function handleRemove(product) {
    await removeItem(product._id);
  }

  const products = wishlist.products;

  if (loading && products.length === 0) {
    return (
      <div className="cart-page">
        <button className="cart-back-button" onClick={() => navigate("/")}>
          <ChevronLeft size={18} />
          Continue shopping
        </button>
        <p>Loading your wishlist…</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="cart-page">
        <button className="cart-back-button" onClick={() => navigate("/")}>
          <ChevronLeft size={18} />
          Continue shopping
        </button>

        <div className="empty-cart">
          <Heart size={55} />
          <h1>Your wishlist is empty</h1>
          <p>Save products you like and they'll appear here.</p>
          <button onClick={() => navigate("/")}>Start browsing</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <button className="cart-back-button" onClick={() => navigate("/")}>
        <ChevronLeft size={18} />
        Continue shopping
      </button>

      <h1>My Wishlist</h1>

      <div className="cart-items">
        {products.map((product) => (
          <article className="cart-item" key={product._id}>
            <img
              src={product.image}
              alt={product.name}
              onClick={() => navigate(`/product/${product._id}`)}
              style={{ cursor: "pointer" }}
            />

            <div className="cart-item-info">
              <h2
                onClick={() => navigate(`/product/${product._id}`)}
                style={{ cursor: "pointer" }}
              >
                {product.name}
              </h2>
              <strong>{formatNaira(product.price)}</strong>
              <span>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
            </div>

            <div className="cart-item-right">
              <button
                className="product-shop-button wishlist-add-to-cart-button"
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
              >
                <ShoppingCart size={15} />
                Add to cart
              </button>

              <button
                className="remove-cart-item"
                onClick={() => handleRemove(product)}
                aria-label={`Remove ${product.name} from wishlist`}
              >
                <Heart size={18} fill="currentColor" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {notice && (
        <button className="category-toast" onClick={() => setNotice("")}>
          {notice}
          <span>×</span>
        </button>
      )}
    </div>
  );
}

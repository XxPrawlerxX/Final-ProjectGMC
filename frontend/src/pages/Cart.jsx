import { ChevronLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatNaira } from "../categoryUtils";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const navigate = useNavigate();
  const { cart, loading, error, updateItem, removeItem } = useCart();

  const items = cart.items;
  const subtotal = cart.subtotal;

  if (loading && items.length === 0) {
    return (
      <div className="cart-page">
        <button className="cart-back-button" onClick={() => navigate("/")}>
          <ChevronLeft size={18} />
          Continue shopping
        </button>

        <p>Loading your cart…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <button className="cart-back-button" onClick={() => navigate("/")}>
          <ChevronLeft size={18} />
          Continue shopping
        </button>

        <div className="empty-cart">
          <ShoppingCart size={55} />

          <h1>Your cart is empty</h1>

          <p>Add some products to your cart and they will appear here.</p>

          <button onClick={() => navigate("/")}>Start shopping</button>
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

      <h1>Shopping Cart</h1>

      {error && <p className="signin-form-message">{error}</p>}

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <article className="cart-item" key={item.product._id}>
              <img src={item.product.image} alt={item.product.name} />

              <div className="cart-item-info">
                <h2>{item.product.name}</h2>

                <strong>{formatNaira(item.product.price)}</strong>

                <div className="quantity-controls">
                  <button
                    onClick={() =>
                      updateItem(item.product._id, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateItem(item.product._id, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.product.stock}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {item.quantity >= item.product.stock && (
                  <small>Only {item.product.stock} in stock</small>
                )}
              </div>

              <div className="cart-item-right">
                <strong>{formatNaira(item.lineTotal)}</strong>

                <button
                  className="remove-cart-item"
                  onClick={() => removeItem(item.product._id)}
                  aria-label={`Remove ${item.product.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatNaira(subtotal)}</strong>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>

          <hr />

          <div className="summary-total">
            <span>Total</span>
            <strong>{formatNaira(subtotal)}</strong>
          </div>

          <button
            className="checkout-button"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}

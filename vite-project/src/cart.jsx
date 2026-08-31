import { ChevronLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { formatNaira } from "./categoryData";

export default function Cart({
  cart,
  onBack,
  removeFromCart,
  updateQuantity,
  onCheckout,
}) {
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <button className="cart-back-button" onClick={onBack}>
          <ChevronLeft size={18} />
          Continue shopping
        </button>

        <div className="empty-cart">
          <ShoppingCart size={55} />

          <h1>Your cart is empty</h1>

          <p>Add some products to your cart and they will appear here.</p>

          <button onClick={onBack}>Start shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <button className="cart-back-button" onClick={onBack}>
        <ChevronLeft size={18} />
        Continue shopping
      </button>

      <h1>Shopping Cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => (
            <article className="cart-item" key={item.name}>
              <img src={item.image} alt={item.name} />

              <div className="cart-item-info">
                <h2>{item.name}</h2>

                <strong>{formatNaira(item.price)}</strong>

                <div className="quantity-controls">
                  <button
                    onClick={() => updateQuantity(item.name, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.name, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="cart-item-right">
                <strong>{formatNaira(item.price * item.quantity)}</strong>

                <button
                  className="remove-cart-item"
                  onClick={() => removeFromCart(item.name)}
                  aria-label={`Remove ${item.name}`}
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

          <button className="checkout-button" onClick={onCheckout}>
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}

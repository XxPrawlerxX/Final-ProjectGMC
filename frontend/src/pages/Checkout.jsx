import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { formatNaira } from "../categoryUtils";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../api/orderApi";
import { initializePayment } from "../api/paymentApi";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, refresh } = useCart();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const items = cart.items;
  const subtotal = cart.subtotal;
  // The backend currently always charges 0 shipping — shown honestly
  // here rather than the placeholder fee the original design used,
  // since this is the amount that will actually be charged at Paystack.
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const { fullName, phone, address, city, state } = formData;

    if (!fullName || !formData.email || !phone || !address || !city || !state) {
      setError("Please fill in all delivery information.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      // The backend reads shippingAddress from exactly these 5 fields —
      // it builds the order from the customer's real server-side cart,
      // so nothing about price/vendor/total is sent from here.
      const order = await createOrder({ fullName, phone, address, city, state });

      const { data } = await initializePayment(order._id);

      // The cart was just cleared server-side by order creation — refresh
      // so the header's cart badge is correct if the user comes back.
      await refresh();

      // Hand off to Paystack's hosted checkout. Whether this payment
      // actually succeeds is decided entirely by the backend later, when
      // the callback page calls /api/payments/verify/:reference.
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout-page">
      <button className="checkout-back-button" onClick={() => navigate("/cart")}>
        <ChevronLeft size={18} />
        Back to Cart
      </button>

      <h1>Checkout</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Delivery Information</h2>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Delivery Address</label>
            <textarea
              id="address"
              name="address"
              placeholder="Enter your delivery address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                type="text"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>

          <p className="checkout-reservation-note">
            Placing your order reserves these items for 30 minutes while you
            complete payment.
          </p>

          {error && <p className="signin-form-message">{error}</p>}

          <button className="place-order-button" type="submit" disabled={submitting}>
            {submitting ? "Placing order…" : "Place Order"}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>Your Order</h2>

          {items.map((item) => (
            <div className="checkout-item" key={item.product._id}>
              <div>
                <strong>{item.product.name}</strong>
                <p>Qty: {item.quantity}</p>
              </div>

              <strong>{formatNaira(item.lineTotal)}</strong>
            </div>
          ))}

          <hr />

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatNaira(subtotal)}</strong>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <strong>Free</strong>
          </div>

          <hr />

          <div className="summary-total">
            <span>Total</span>
            <strong>{formatNaira(total)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}

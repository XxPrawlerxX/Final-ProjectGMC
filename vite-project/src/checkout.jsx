import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { formatNaira } from "./categoryData";

export default function Checkout({ cart, onBack, onPlaceOrder }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const deliveryFee = 2500;
  const total = subtotal + deliveryFee;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const { fullName, email, phone, address, city, state } = formData;

    if (!fullName || !email || !phone || !address || !city || !state) {
      window.alert("Please fill in all delivery information.");
      return;
    }

    onPlaceOrder(formData);
  }

  return (
    <div className="checkout-page">
      <button className="checkout-back-button" onClick={onBack}>
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

          <button className="place-order-button" type="submit">
            Place Order
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>Your Order</h2>

          {cart.map((item) => (
            <div className="checkout-item" key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <p>Qty: {item.quantity}</p>
              </div>

              <strong>{formatNaira(item.price * item.quantity)}</strong>
            </div>
          ))}

          <hr />

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatNaira(subtotal)}</strong>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <strong>{formatNaira(deliveryFee)}</strong>
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

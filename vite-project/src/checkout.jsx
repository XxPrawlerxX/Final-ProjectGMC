import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PaystackPop from "@paystack/inline-js";
import { ChevronLeft, Lock, ShoppingCart } from "lucide-react";
import { formatNaira } from "./categoryData";
import { DELIVERY_FEE } from "./catalog";
import { initializePayment, verifyPayment } from "./api";
import { useCart } from "./useCart";
import "./checkout.css";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
};

function validate(form) {
  const errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address.";
  // 0803..., +234803..., 234803...
  if (!/^(\+?234|0)\d{10}$/.test(form.phone.replace(/[\s-]/g, "")))
    errors.phone = "Enter a valid Nigerian phone number, e.g. 0803 123 4567.";
  if (form.address.trim().length < 5)
    errors.address = "Enter your delivery address.";
  if (!form.city.trim()) errors.city = "Enter your city.";
  if (!form.state) errors.state = "Select your state.";
  return errors;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, subtotal, clearCart } = useCart();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  // idle | starting | paying | verifying
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  // Set when the customer paid but we couldn't confirm it yet
  const [unconfirmedRef, setUnconfirmedRef] = useState("");

  const total = subtotal + DELIVERY_FEE;
  const busy = status !== "idle";

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function confirmPayment(reference) {
    setStatus("verifying");
    setError("");
    try {
      const result = await verifyPayment(reference);
      if (result.status !== "paid") {
        setStatus("idle");
        setError("Your payment wasn't completed. You haven't been charged.");
        return;
      }
      sessionStorage.setItem("marketfind-last-order", JSON.stringify(result.order));
      navigate("/order-confirmation", {
        replace: true,
        state: { order: result.order },
      });
      clearCart();
    } catch (err) {
      setStatus("idle");
      setUnconfirmedRef(reference);
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    setError("");
    setUnconfirmedRef("");
    setStatus("starting");

    try {
      const { access_code: accessCode, reference } = await initializePayment({
        items: cart.map(({ id, quantity }) => ({ id, quantity })),
        customer: { ...form },
      });

      setStatus("paying");
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: (transaction) =>
          confirmPayment(transaction.reference || reference),
        onCancel: () => {
          setStatus("idle");
          setError("Payment cancelled. Your cart is still saved.");
        },
        onError: (paystackError) => {
          setStatus("idle");
          setError(
            paystackError?.message ||
              "The payment window couldn't load. Please try again.",
          );
        },
      });
    } catch (err) {
      setStatus("idle");
      setError(err.message);
    }
  }

  if (cart.length === 0 && status === "idle") {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <ShoppingCart size={52} />
          <h1>Your cart is empty</h1>
          <p>Add something to your cart before checking out.</p>
          <Link to="/">Start shopping</Link>
        </div>
      </div>
    );
  }

  const buttonLabel = {
    idle: `Pay ${formatNaira(total)}`,
    starting: "Preparing secure payment…",
    paying: "Complete payment in the pop-up…",
    verifying: "Confirming your payment…",
  }[status];

  function field(name, label, { as: Tag = "input", children, ...inputProps }) {
    return (
      <div className={`form-group ${errors[name] ? "has-error" : ""}`}>
        <label htmlFor={name}>{label}</label>
        <Tag
          id={name}
          name={name}
          value={form[name]}
          onChange={handleChange}
          disabled={busy}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          {...inputProps}
        >
          {children}
        </Tag>
        {errors[name] && (
          <span className="field-error" id={`${name}-error`}>
            {errors[name]}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <button
        className="checkout-back-button"
        onClick={() => navigate("/cart")}
        disabled={busy}
      >
        <ChevronLeft size={18} />
        Back to Cart
      </button>

      <h1>Checkout</h1>

      <ol className="checkout-steps" aria-label="Checkout progress">
        <li className="done">Cart</li>
        <li className="current">Delivery &amp; payment</li>
        <li>Confirmation</li>
      </ol>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <section>
            <h2>
              <span>1</span> Contact details
            </h2>
            {field("fullName", "Full name", {
              type: "text",
              placeholder: "e.g. Adaeze Okafor",
              autoComplete: "name",
            })}
            <div className="form-row">
              {field("email", "Email address", {
                type: "email",
                placeholder: "you@example.com",
                autoComplete: "email",
              })}
              {field("phone", "Phone number", {
                type: "tel",
                placeholder: "0803 123 4567",
                autoComplete: "tel",
              })}
            </div>
          </section>

          <section>
            <h2>
              <span>2</span> Delivery address
            </h2>
            {field("address", "Street address", {
              as: "textarea",
              rows: 3,
              placeholder: "House number, street, area",
              autoComplete: "street-address",
            })}
            <div className="form-row">
              {field("city", "City", {
                type: "text",
                placeholder: "City",
                autoComplete: "address-level2",
              })}
              {field("state", "State", {
                as: "select",
                autoComplete: "address-level1",
                children: [
                  <option key="" value="">
                    Select state
                  </option>,
                  ...NIGERIAN_STATES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  )),
                ],
              })}
            </div>
          </section>

          <section>
            <h2>
              <span>3</span> Payment
            </h2>
            <div className="payment-box">
              <Lock size={18} />
              <div>
                <strong>Pay securely with Paystack</strong>
                <p>
                  Choose card, bank transfer or USSD in the next step. We never
                  see or store your card details.
                </p>
              </div>
            </div>
          </section>

          {error && (
            <div className="checkout-error" role="alert">
              <p>{error}</p>
              {unconfirmedRef && (
                <>
                  <p>
                    If money left your account, don&apos;t pay again. Your
                    payment reference is <b>{unconfirmedRef}</b>.
                  </p>
                  <button
                    type="button"
                    onClick={() => confirmPayment(unconfirmedRef)}
                    disabled={busy}
                  >
                    Try confirming again
                  </button>
                </>
              )}
            </div>
          )}

          <button className="place-order-button" type="submit" disabled={busy}>
            {buttonLabel}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>Your order</h2>

          {cart.map((item) => (
            <div className="checkout-item" key={item.id}>
              <div className="checkout-item-thumb">
                <img src={item.image} alt="" />
                <b>{item.quantity}</b>
              </div>
              <strong className="checkout-item-name">{item.name}</strong>
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
            <strong>{formatNaira(DELIVERY_FEE)}</strong>
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

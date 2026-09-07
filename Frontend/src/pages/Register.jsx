import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// No new page existed for registration in the original design, so this
// reuses SignIn's exact stylesheet/classes rather than inventing a new
// visual language.
import "./sign-in.css";

const EMPTY_VENDOR_FIELDS = {
  storeName: "",
  storeDescription: "",
  phone: "",
  address: "",
};

export default function Register() {
  const navigate = useNavigate();
  const { registerCustomer, registerVendor } = useAuth();

  const [accountType, setAccountType] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendorFields, setVendorFields] = useState(EMPTY_VENDOR_FIELDS);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateVendorField(field, value) {
    setVendorFields((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();

    if (!name || !email || !password) {
      setMessage("Enter your name, email and password to continue.");
      return;
    }

    setMessage("");
    setSubmitting(true);

    try {
      if (accountType === "vendor") {
        const { storeName, storeDescription, phone, address } = vendorFields;

        if (!storeName || !phone || !address) {
          setMessage("Store name, phone and address are required for a vendor account.");
          setSubmitting(false);
          return;
        }

        await registerVendor({ name, email, password, storeName, storeDescription, phone, address });
        navigate("/", { replace: true });
        return;
      }

      await registerCustomer({ name, email, password });
      navigate("/", { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="orange-signin-page">
      <section className="orange-signin-form-panel">
        <div className="orange-signin-form-content">
          <button
            className="signin-wordmark"
            type="button"
            onClick={() => navigate("/")}
            aria-label="Return to marketplace"
          >
            <small>E-commerce</small>
            <strong>
              market<span>find</span>
            </strong>
          </button>

          <div className="signin-introduction">
            <p className="signin-kicker">JOIN MARKETFIND</p>
            <h1>
              Create your
              <br />
              account
            </h1>
            <p>Shop the marketplace, or start selling your own products.</p>
          </div>

          <form className="orange-signin-form" onSubmit={submit}>
            <label htmlFor="account-type">I want to</label>
            <select
              id="account-type"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value)}
            >
              <option value="customer">Shop as a customer</option>
              <option value="vendor">Sell as a vendor</option>
            </select>

            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
            />

            <label htmlFor="register-password">Password</label>
            <div className="signin-password-field">
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password (min. 6 characters)"
                autoComplete="new-password"
              />
            </div>

            {accountType === "vendor" && (
              <>
                <label htmlFor="store-name">Store Name</label>
                <input
                  id="store-name"
                  type="text"
                  value={vendorFields.storeName}
                  onChange={(event) => updateVendorField("storeName", event.target.value)}
                  placeholder="Store name"
                />

                <label htmlFor="store-description">Store Description</label>
                <input
                  id="store-description"
                  type="text"
                  value={vendorFields.storeDescription}
                  onChange={(event) => updateVendorField("storeDescription", event.target.value)}
                  placeholder="What do you sell?"
                />

                <label htmlFor="store-phone">Phone Number</label>
                <input
                  id="store-phone"
                  type="tel"
                  value={vendorFields.phone}
                  onChange={(event) => updateVendorField("phone", event.target.value)}
                  placeholder="Phone number"
                />

                <label htmlFor="store-address">Business Address</label>
                <input
                  id="store-address"
                  type="text"
                  value={vendorFields.address}
                  onChange={(event) => updateVendorField("address", event.target.value)}
                  placeholder="Business address"
                />

                <p className="signin-form-message">
                  Vendor accounts require admin approval before you can list
                  products.
                </p>
              </>
            )}

            <div className="orange-signin-actions">
              <button
                className="orange-signin-button"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Creating account…" : "Create Account"}
                <span>→</span>
              </button>
              <button
                className="orange-register-button"
                type="button"
                onClick={() => navigate("/signin")}
              >
                Sign In Instead
              </button>
            </div>

            {message && <p className="signin-form-message">{message}</p>}
          </form>

          <button
            className="return-home-button"
            type="button"
            onClick={() => navigate("/")}
          >
            ← Return to marketplace
          </button>
        </div>
      </section>

      <aside className="orange-signin-story-panel">
        <div className="signin-story-image"></div>
        <div className="signin-story-wash"></div>
        <div className="signin-story-content">
          <p className="signin-story-kicker">MARKETFIND FOR BUSINESS</p>
          <h2>A trusted place to grow your next idea.</h2>
          <p>
            Bring your products to more people with a marketplace built for
            confident selling and everyday discovery.
          </p>
        </div>
        <div className="signin-story-dots" aria-label="Story slides">
          <b></b>
          <i></i>
          <i></i>
        </div>
      </aside>
    </main>
  );
}

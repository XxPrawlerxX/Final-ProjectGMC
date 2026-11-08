import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { api } from "./lib/api";
import { useCategories } from "./useCategories";
import "./site.css";

export default function SiteFooter() {
  const categories = useCategories();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  async function subscribe(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    try {
      await api.post("/api/newsletter", { email });
      setStatus({ type: "ok", message: "Thanks! You're on the list." });
      setEmail("");
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  }

  return (
    <footer className="site-footer">
      <div className="site-container site-footer-grid">
        <section className="site-footer-brand">
          <h2>Fresh finds, sent your way.</h2>
          <p>Get new arrivals and deals in your inbox. No spam.</p>
          <form onSubmit={subscribe}>
            <label className="sr-only" htmlFor="footer-email">Email address</label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <button type="submit">Subscribe</button>
          </form>
          {status.message && (
            <p className={`site-footer-status ${status.type}`} role="status">{status.message}</p>
          )}
        </section>

        <nav aria-label="Shop">
          <h3>Shop</h3>
          <ul>
            <li><Link to="/wholesale">Wholesale (B2B)</Link></li>
            <li><Link to="/preloved">Pre-loved</Link></li>
            {categories.slice(0, 4).map((category) => (
              <li key={category.slug}>
                <Link to={`/category/${category.slug}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account">
          <h3>Account</h3>
          <ul>
            <li><Link to="/signin">Sign in</Link></li>
            <li><Link to="/register">Create account</Link></li>
            <li><Link to="/account?tab=orders">My orders</Link></li>
            <li><Link to="/account?tab=wishlist">Wishlist</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/sell">Sell on Marketfind</Link></li>
          </ul>
        </nav>

        <section aria-label="Contact">
          <h3>Contact</h3>
          <ul className="site-footer-contact">
            <li><MapPin size={16} /> 4 Alhaji Ganiyu, Lekki, Lagos, Nigeria</li>
            <li><Phone size={16} /> <a href="tel:+23416313124">+23416313124</a></li>
            <li>
              <MessageCircle size={16} />{" "}
              <a href="https://wa.me/2347057095939" target="_blank" rel="noreferrer">
                WhatsApp +2347057095939
              </a>
            </li>
          </ul>
        </section>
      </div>

      <div className="site-footer-base site-container">
        <span>© {new Date().getFullYear()} Marketfind. All rights reserved.</span>
        <span>Secure payments by Paystack</span>
      </div>
    </footer>
  );
}

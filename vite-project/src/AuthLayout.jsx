import { Link } from "react-router-dom";
import "./sign-in.css";

// Two-panel frame shared by the sign-in and registration pages.
export default function AuthLayout({ kicker, title, intro, children }) {
  return (
    <main className="orange-signin-page">
      <section className="orange-signin-form-panel">
        <div className="orange-signin-form-content">
          <Link className="auth-logo" to="/" aria-label="Back to Marketfind">
            <img src="/marketfind-logo.png" alt="Marketfind" width="130" height="72" />
          </Link>

          <div className="signin-introduction">
            <p className="signin-kicker">{kicker}</p>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>

          {children}

          <Link className="return-home-button" to="/">
            ← Return to marketplace
          </Link>
        </div>
      </section>

      <aside className="orange-signin-story-panel" aria-hidden="true">
        <div className="signin-story-image"></div>
        <div className="signin-story-wash"></div>
        <div className="signin-story-content">
          <p className="signin-story-kicker">FIND MORE. SHOP SMART.</p>
          <h2>Everything you need, delivered across Nigeria.</h2>
          <p>
            Save your favourites, track your orders and check out faster with a free Marketfind account.
          </p>
        </div>
      </aside>
    </main>
  );
}

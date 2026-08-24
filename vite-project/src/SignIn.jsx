import { useState } from "react";
import "./sign-in.css";

export default function SignIn({ onBack, onRegister }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function submit(event) {
    event.preventDefault();

    if (!email || !password) {
      setMessage("Enter your email and password to continue.");
      return;
    }

    setMessage("Your sign-in form is ready to connect to authentication.");
  }

  return (
    <main className="orange-signin-page">
      <section className="orange-signin-form-panel">
        <div className="orange-signin-form-content">
          <button
            className="signin-wordmark"
            type="button"
            onClick={onBack}
            aria-label="Return to marketplace"
          >
            <small>E-commerce</small>
            <strong>
              market<span>find</span>
            </strong>
          </button>

          <div className="signin-introduction">
            <p className="signin-kicker">SELL WITH CONFIDENCE</p>
            <h1>
              Welcome to
              <br />
              your selling center
            </h1>
            <p>Enter your details below to continue.</p>
          </div>

          <form className="orange-signin-form" onSubmit={submit}>
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
            />

            <label htmlFor="signin-password">Password</label>
            <div className="signin-password-field">
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              className="signin-forgot-link"
              type="button"
              onClick={() =>
                setMessage("Password recovery is ready to connect.")
              }
            >
              Forgot Password
            </button>

            <div className="orange-signin-actions">
              <button className="orange-signin-button" type="submit">
                Sign In
                <span>→</span>
              </button>
              <button
                className="orange-register-button"
                type="button"
                onClick={onRegister}
              >
                Register
              </button>
            </div>

            {message && <p className="signin-form-message">{message}</p>}
          </form>

          <button className="return-home-button" type="button" onClick={onBack}>
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

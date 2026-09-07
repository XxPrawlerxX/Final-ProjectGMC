import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
// Reuses SignIn's exact stylesheet/classes — no new page design existed
// for this before.
import "./sign-in.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devResetToken, setDevResetToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!email) {
      setMessage("Enter your email address to continue.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setDevResetToken("");

    try {
      const data = await forgotPassword(email);
      setMessage(data.message);

      // See the backend comment in authController.js: there's no email
      // service in this project yet, so in development the reset token
      // comes back here instead of being emailed. This never happens
      // in production (the backend gates it off).
      if (data.devResetToken) {
        setDevResetToken(data.devResetToken);
      }
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
            <p className="signin-kicker">ACCOUNT RECOVERY</p>
            <h1>
              Forgot your
              <br />
              password?
            </h1>
            <p>Enter your email and we'll send you a reset link.</p>
          </div>

          <form className="orange-signin-form" onSubmit={submit}>
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
            />

            <div className="orange-signin-actions">
              <button className="orange-signin-button" type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send Reset Link"}
                <span>→</span>
              </button>
            </div>

            {message && <p className="signin-form-message">{message}</p>}

            {devResetToken && (
              <div className="dev-reset-token-box">
                <p>
                  <strong>Development mode:</strong> no email service is
                  configured yet, so here's your reset link directly.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/reset-password?token=${devResetToken}`)}
                >
                  Continue to reset password →
                </button>
              </div>
            )}
          </form>

          <button className="return-home-button" type="button" onClick={() => navigate("/signin")}>
            ← Back to sign in
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

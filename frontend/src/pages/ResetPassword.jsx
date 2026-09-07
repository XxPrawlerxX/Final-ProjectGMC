import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import "./sign-in.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!token) {
      setMessage("This reset link is missing its token. Request a new one.");
      return;
    }

    if (!password || password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const data = await resetPassword(token, password);
      setMessage(data.message);
      setSuccess(true);
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
              Choose a new
              <br />
              password
            </h1>
            <p>Reset links expire after 30 minutes and can only be used once.</p>
          </div>

          {success ? (
            <div className="orange-signin-form">
              <p className="signin-form-message">{message}</p>
              <button className="orange-signin-button" onClick={() => navigate("/signin")}>
                Go to Sign In
                <span>→</span>
              </button>
            </div>
          ) : (
            <form className="orange-signin-form" onSubmit={submit}>
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password (min. 6 characters)"
                autoComplete="new-password"
              />

              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />

              <div className="orange-signin-actions">
                <button className="orange-signin-button" type="submit" disabled={submitting}>
                  {submitting ? "Resetting…" : "Reset Password"}
                  <span>→</span>
                </button>
              </div>

              {message && <p className="signin-form-message">{message}</p>}
            </form>
          )}

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

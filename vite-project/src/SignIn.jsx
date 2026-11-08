import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/authContext";
import AuthLayout from "./AuthLayout";

export default function SignIn() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to={from} replace />;

  async function submit(event) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      kicker="WELCOME BACK"
      title={<>Sign in to<br />your account</>}
      intro={location.state?.reason === "wishlist" ? "Sign in to save items to your wishlist." : "Enter your details below to continue."}
    >
      <form className="orange-signin-form" onSubmit={submit} noValidate>
        <label htmlFor="signin-email">Email</label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={busy}
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
            disabled={busy}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {error && <p className="signin-form-message error" role="alert">{error}</p>}

        <div className="orange-signin-actions">
          <button className="orange-signin-button" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
            {!busy && <span>→</span>}
          </button>
          <Link className="orange-register-button" to="/register" state={location.state}>
            Create account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

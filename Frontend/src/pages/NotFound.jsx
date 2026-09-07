import { useNavigate } from "react-router-dom";

// No 404 page existed before — unmatched routes silently redirected
// home, which is confusing (did my link work or not?). Uses the same
// card style as the payment callback / error boundary screens.
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="payment-callback-page">
      <div className="payment-callback-card">
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or may have moved.</p>
        <button onClick={() => navigate("/")}>Return to marketplace</button>
      </div>
    </div>
  );
}

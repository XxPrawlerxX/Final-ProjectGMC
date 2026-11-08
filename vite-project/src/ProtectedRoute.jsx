import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth/authContext";

// Wrap a page so only signed-in shoppers can see it.
export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="page-loading" role="status">Loading…</div>;
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

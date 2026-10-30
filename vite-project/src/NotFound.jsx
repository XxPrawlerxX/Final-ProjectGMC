import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import ShopHeader from "./ShopHeader";

export default function NotFound({ title = "Page not found", message }) {
  return (
    <div className="shop-page">
      <ShopHeader />
      <main className="shop-main">
        <div className="shop-empty">
          <SearchX size={54} />
          <h1>{title}</h1>
          <p>
            {message ||
              "The page you're looking for doesn't exist or may have moved."}
          </p>
          <Link className="shop-primary-link" to="/">
            Back to Marketfind
          </Link>
        </div>
      </main>
    </div>
  );
}

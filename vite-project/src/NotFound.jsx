import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import Layout from "./Layout";
import "./shop.css";

export default function NotFound({ title = "Page not found", message }) {
  return (
    <Layout>
      <div className="shop-empty site-container">
        <SearchX size={54} />
        <h1>{title}</h1>
        <p>{message || "The page you're looking for doesn't exist or may have moved."}</p>
        <Link className="shop-primary-link" to="/">
          Back to Marketfind
        </Link>
      </div>
    </Layout>
  );
}

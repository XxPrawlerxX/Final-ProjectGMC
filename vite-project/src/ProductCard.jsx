import { Link } from "react-router-dom";
import { ChevronRight, Heart, Star } from "lucide-react";
import { formatNaira } from "./categoryData";
import { productPath } from "./catalog";

// Uses the card styles from category.css. Image and title open the product page.
export default function ProductCard({ product, onAdd, onSave }) {
  return (
    <article className="market-product-card">
      <div className="market-product-image">
        <Link
          className="market-product-link"
          to={productPath(product.id)}
          aria-label={`View ${product.name}`}
        >
          <img src={product.image} alt={product.name} loading="lazy" />
        </Link>
        {product.tag && <span className="product-tag">{product.tag}</span>}
        {onSave && (
          <button
            className="product-wishlist"
            onClick={() => onSave(product)}
            aria-label={`Save ${product.name}`}
          >
            <Heart size={17} />
          </button>
        )}
      </div>

      <div className="market-product-copy">
        <div className="product-rating">
          <Star size={14} fill="currentColor" />
          4.8 <em>(120+)</em>
        </div>
        <h3>
          <Link className="market-product-title" to={productPath(product.id)}>
            {product.name}
          </Link>
        </h3>
        <div className="product-price-row">
          <strong>{formatNaira(product.price)}</strong>
          <del>{formatNaira(product.oldPrice)}</del>
        </div>
        <p>{product.shipping}</p>
        <button className="product-shop-button" onClick={() => onAdd(product)}>
          Add to cart
          <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
}

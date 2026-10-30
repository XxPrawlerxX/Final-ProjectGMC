import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { formatNaira } from "./categoryData";
import { categoryPath, getProduct, getRelatedProducts } from "./catalog";
import { useCart } from "./useCart";
import ShopHeader from "./ShopHeader";
import ProductCard from "./ProductCard";
import NotFound from "./NotFound";
import "./category.css";
import "./shop.css";

export default function ProductPage() {
  const { productId } = useParams();
  const product = getProduct(productId);

  if (!product) {
    return (
      <NotFound
        title="Product not found"
        message="This product may have been removed or the link is incorrect."
      />
    );
  }

  // key resets quantity/toast when moving from one product to another
  return <ProductContent key={product.id} product={product} />;
}

function ProductContent({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState(false);

  const related = getRelatedProducts(product);
  const saving = Math.round((1 - product.price / product.oldPrice) * 100);

  function handleAdd() {
    addToCart(product, quantity);
    setNotice(true);
    window.setTimeout(() => setNotice(false), 3000);
  }

  function handleBuyNow() {
    addToCart(product, quantity);
    navigate("/checkout");
  }

  return (
    <div className="shop-page">
      <ShopHeader activeCategory={product.category} />

      <main className="shop-main">
        <nav className="shop-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={13} />
          <Link to={categoryPath(product.category)}>{product.category}</Link>
          <ChevronRight size={13} />
          <span aria-current="page">{product.name}</span>
        </nav>

        <section className="product-detail">
          <div className="product-detail-image">
            <img src={product.image} alt={product.name} />
            {product.tag && <span className="product-tag">{product.tag}</span>}
          </div>

          <div className="product-detail-info">
            <Link
              className="shop-kicker shop-link"
              to={categoryPath(product.category)}
            >
              {product.category}
            </Link>
            <h1>{product.name}</h1>

            <div className="product-detail-rating">
              <Star size={16} fill="currentColor" />
              4.8 <em>(120+ reviews)</em>
            </div>

            <div className="product-detail-price">
              <strong>{formatNaira(product.price)}</strong>
              <del>{formatNaira(product.oldPrice)}</del>
              {saving > 0 && (
                <span className="product-detail-saving">-{saving}%</span>
              )}
            </div>
            <p className="product-detail-shipping">{product.shipping}</p>

            <p className="product-detail-description">
              {product.description ||
                `${product.name} from our ${product.category.toLowerCase()} collection, chosen for everyday value.`}
            </p>

            <div className="product-detail-actions">
              <div className="qty-stepper">
                <button
                  onClick={() => setQuantity((q) => q - 1)}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span aria-live="polite">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(q + 1, 20))}
                  disabled={quantity >= 20}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button className="product-add-button" onClick={handleAdd}>
                Add to cart
              </button>
              <button className="product-buy-button" onClick={handleBuyNow}>
                Buy now
              </button>
            </div>

            <ul className="product-perks">
              <li>
                <Truck size={20} />
                <strong>Delivery</strong>
                Delivered to your door
              </li>
              <li>
                <ShieldCheck size={20} />
                <strong>Secure payment</strong>
                Card, transfer or USSD via Paystack
              </li>
              <li>
                <RotateCcw size={20} />
                <strong>Easy returns</strong>
                Contact us if something's wrong
              </li>
            </ul>
          </div>
        </section>

        {related.length > 0 && (
          <section className="related-section">
            <p className="shop-kicker">KEEP BROWSING</p>
            <h2>More in {product.category}</h2>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onAdd={(p) => addToCart(p)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {notice && (
        <div className="shop-toast" role="status">
          {product.name} added to cart
          <Link to="/cart">View cart</Link>
        </div>
      )}
    </div>
  );
}

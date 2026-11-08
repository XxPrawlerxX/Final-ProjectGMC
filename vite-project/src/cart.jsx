import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { withQuery } from "./lib/api";
import { formatNaira } from "./lib/format";
import { plural } from "./lib/labels";
import { unitPriceFor } from "./lib/pricing";
import { useApi } from "./useApi";
import { useCart } from "./useCart";
import { useToast } from "./toast/toastContext";
import Layout from "./Layout";
import "./cart.css";

// Compare the cart with what's in the store right now (prices change, stock runs out)
function reconcile(cart, fresh) {
  const bySlug = new Map(fresh.map((product) => [product.id, product]));
  const notes = [];
  const next = [];

  for (const item of cart) {
    const product = bySlug.get(item.id);
    const min = product?.minOrderQty || 1;
    if (!product || product.stock < min) {
      notes.push(`${item.name} is no longer available and was removed.`);
      continue;
    }
    const updated = {
      ...item,
      name: product.name,
      image: product.image,
      oldPrice: product.oldPrice,
      stock: product.stock,
      unit: product.unit,
      minOrderQty: min,
      priceTiers: product.priceTiers,
      listingType: product.listingType,
    };
    if (product.price !== item.price) {
      notes.push(`The price of ${item.name} changed to ${formatNaira(product.price)}.`);
      updated.price = product.price;
    }
    if (item.quantity > product.stock) {
      notes.push(`Only ${product.stock} of ${item.name} left, so we lowered the quantity.`);
      updated.quantity = product.stock;
    }
    if (updated.quantity < min) {
      notes.push(`The minimum order for ${item.name} is ${min}, so we raised the quantity.`);
      updated.quantity = min;
    }
    next.push(updated);
  }
  return { next, notes };
}

// Bulk quantities can be big, so they get a box you can type in
function QuantityBox({ item, onChange }) {
  const commit = (event) => {
    const value = Number.parseInt(event.target.value, 10);
    if (Number.isInteger(value) && value !== item.quantity) onChange(value);
    else event.target.value = item.quantity;
  };
  return (
    <input
      key={item.quantity}
      className="quantity-box"
      type="number"
      inputMode="numeric"
      min={item.minOrderQty}
      max={item.stock || undefined}
      defaultValue={item.quantity}
      onBlur={commit}
      onKeyDown={(event) => event.key === "Enter" && event.target.blur()}
      aria-label={`Quantity of ${item.name}`}
    />
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const toast = useToast();
  const { cart, removeFromCart, updateQuantity, replaceCart, subtotal } = useCart();

  const ids = cart.slice(0, 48).map((item) => item.id).join(",");
  const { data } = useApi(ids ? withQuery("/api/products", { ids, limit: 48 }) : null);

  useEffect(() => {
    if (!data) return;
    const { next, notes } = reconcile(cart, data.items);
    if (notes.length > 0) {
      replaceCart(next);
      toast(notes[0] + (notes.length > 1 ? ` (+${notes.length - 1} more updates)` : ""), { type: "error" });
    }
  }, [data, cart, replaceCart, toast]);

  if (cart.length === 0) {
    return (
      <Layout>
        <div className="cart-page">
          <div className="empty-cart">
            <ShoppingCart size={55} />
            <h1>Your cart is empty</h1>
            <p>Add some products to your cart and they will appear here.</p>
            <button onClick={() => navigate("/")}>Start shopping</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="cart-page">
        <button className="cart-back-button" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
          Continue shopping
        </button>

        <h1>Shopping Cart</h1>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => {
              const unitPrice = unitPriceFor(item, item.quantity);
              const bulk = item.listingType === "bulk";
              return (
                <article className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.name} />

                  <div className="cart-item-info">
                    <h2>
                      <Link to={`/product/${item.id}`} className="cart-item-link">
                        {item.name}
                      </Link>
                    </h2>

                    <strong>
                      {formatNaira(unitPrice)}
                      {bulk && <small> / {item.unit}</small>}
                    </strong>
                    {bulk && (
                      <p className="cart-bulk-note">
                        Min. order {item.minOrderQty} {plural(item.unit, item.minOrderQty)}
                        {unitPrice < item.price && " · bulk price applied"}
                      </p>
                    )}

                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= item.minOrderQty}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus size={16} />
                      </button>
                      {bulk ? (
                        <QuantityBox item={item} onChange={(q) => updateQuantity(item.id, q)} />
                      ) : (
                        <span>{item.quantity}</span>
                      )}
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.stock > 0 && item.quantity >= item.stock}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-right">
                    <strong>{formatNaira(unitPrice * item.quantity)}</strong>
                    <button className="remove-cart-item" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatNaira(subtotal)}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>

            <hr />

            <div className="summary-total">
              <span>Total</span>
              <strong>{formatNaira(subtotal)}</strong>
            </div>

            <button className="checkout-button" onClick={() => navigate("/checkout")}>
              Proceed to Checkout
            </button>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

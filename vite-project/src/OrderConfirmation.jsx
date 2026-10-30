import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { formatNaira } from "./categoryData";
import ShopHeader from "./ShopHeader";
import NotFound from "./NotFound";
import "./shop.css";

function loadOrder(location) {
  if (location.state?.order) return location.state.order;
  try {
    return JSON.parse(sessionStorage.getItem("marketfind-last-order"));
  } catch {
    return null;
  }
}

export default function OrderConfirmation() {
  const location = useLocation();
  const order = loadOrder(location);

  if (!order) {
    return (
      <NotFound
        title="No order to show"
        message="We couldn't find a recent order in this browser."
      />
    );
  }

  const { customer } = order;

  return (
    <div className="shop-page">
      <ShopHeader />
      <main className="shop-main">
        <div className="order-card">
          <div className="order-card-header">
            <CheckCircle2 size={56} />
            <h1>Thank you, {customer.fullName.split(" ")[0]}!</h1>
            <p>
              Your payment was successful. We&apos;ve sent the details to{" "}
              {customer.email}.
            </p>
            <span className="order-reference">Order ref: {order.reference}</span>
          </div>

          <ul className="order-lines">
            {order.items.map((item) => (
              <li key={item.id}>
                <div>
                  {item.name} <span>× {item.quantity}</span>
                </div>
                <strong>{formatNaira(item.price * item.quantity)}</strong>
              </li>
            ))}
            <li>
              <span>Delivery</span>
              <strong>{formatNaira(order.deliveryFee)}</strong>
            </li>
          </ul>

          <div className="order-totals">
            <span>Total paid</span>
            <span>{formatNaira(order.total)}</span>
          </div>

          <div className="order-delivery">
            <strong>Delivering to</strong>
            {customer.fullName}, {customer.address}, {customer.city},{" "}
            {customer.state}
            <br />
            {customer.phone}
          </div>

          <Link className="shop-primary-link" to="/">
            Continue shopping
          </Link>
        </div>
      </main>
    </div>
  );
}

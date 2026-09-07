import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { getOrderById, cancelMyOrder } from "../api/orderApi";
import { initializePayment } from "../api/paymentApi";
import { formatNaira } from "../categoryUtils";

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getOrderById(id)
      .then(setOrder)
      .catch((err) => setError(err.message));
  }, [id]);

  async function handlePayNow() {
    setPaying(true);
    setPayError("");

    try {
      const { data } = await initializePayment(order._id);
      window.location.href = data.authorization_url;
    } catch (err) {
      setPayError(err.message);
      setPaying(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this order? This cannot be undone.")) {
      return;
    }

    setCancelling(true);
    setCancelError("");

    try {
      const updated = await cancelMyOrder(order._id);
      setOrder(updated);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (error) {
    return (
      <div className="orders-page">
        <button className="cart-back-button" onClick={() => navigate("/orders")}>
          <ChevronLeft size={18} />
          Back to orders
        </button>
        <p className="signin-form-message">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="orders-page">
        <p>Loading order…</p>
      </div>
    );
  }

  // Only offer to pay/retry while the reservation is still live — once
  // it's expired or the order is cancelled, the backend will reject
  // this anyway (and release stock at that point if it hasn't already).
  const canPayNow =
    order.paymentStatus === "pending" &&
    order.orderStatus !== "cancelled" &&
    (!order.paymentExpiresAt || new Date(order.paymentExpiresAt) > new Date());

  const isExpired =
    order.paymentStatus !== "paid" &&
    order.paymentExpiresAt &&
    new Date(order.paymentExpiresAt) <= new Date();

  // Broader than canPayNow on purpose — cancelling a reservation that's
  // technically expired but not yet swept is still a valid, harmless
  // action (same end state either way), unlike paying for one.
  const canCancel = order.paymentStatus === "pending" && order.orderStatus !== "cancelled";

  return (
    <div className="orders-page">
      <button className="cart-back-button" onClick={() => navigate("/orders")}>
        <ChevronLeft size={18} />
        Back to orders
      </button>

      <h1>Order {order.orderNumber}</h1>

      <div className="order-detail-status">
        <span className={`order-badge order-badge-${order.orderStatus}`}>
          Fulfillment: {order.orderStatus}
        </span>
        <span className={`order-badge order-badge-payment-${order.paymentStatus}`}>
          Payment: {order.paymentStatus}
        </span>
      </div>

      {canPayNow && (
        <div className="order-pay-now">
          <p>
            Complete payment before{" "}
            <strong>{new Date(order.paymentExpiresAt).toLocaleString()}</strong> to
            keep your items reserved.
          </p>
          <div className="order-pay-now-actions">
            <button className="place-order-button" onClick={handlePayNow} disabled={paying}>
              {paying ? "Redirecting to Paystack…" : "Pay Now"}
            </button>
            <button
              className="order-cancel-button"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Cancel Order"}
            </button>
          </div>
          {payError && <p className="signin-form-message">{payError}</p>}
          {cancelError && <p className="signin-form-message">{cancelError}</p>}
        </div>
      )}

      {!canPayNow && canCancel && (
        <div className="order-pay-now">
          <p>This order's payment window has expired, but it hasn't been fully released yet.</p>
          <button
            className="order-cancel-button"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling…" : "Cancel Order"}
          </button>
          {cancelError && <p className="signin-form-message">{cancelError}</p>}
        </div>
      )}

      {isExpired && order.paymentStatus !== "paid" && (
        <p className="signin-form-message">
          This order's payment window expired and its items were released back
          to stock.
        </p>
      )}

      <div className="checkout-layout">
        <div className="cart-items">
          {order.items.map((item) => (
            <article className="cart-item" key={item._id}>
              <img src={item.image} alt={item.productName} />

              <div className="cart-item-info">
                <h2>{item.productName}</h2>
                <strong>{formatNaira(item.price)}</strong>
                <span>Qty: {item.quantity}</span>
              </div>

              <div className="cart-item-right">
                <strong>{formatNaira(item.price * item.quantity)}</strong>
              </div>
            </article>
          ))}
        </div>

        <aside className="checkout-summary">
          <h2>Delivery Information</h2>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.phone}</p>
          <p>{order.shippingAddress.address}</p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>

          <hr />

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatNaira(order.subtotal)}</strong>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <strong>{formatNaira(order.shippingFee)}</strong>
          </div>

          <hr />

          <div className="summary-total">
            <span>Total</span>
            <strong>{formatNaira(order.totalAmount)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}

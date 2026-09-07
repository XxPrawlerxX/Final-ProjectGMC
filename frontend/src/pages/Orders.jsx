import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { getMyOrders } from "../api/orderApi";
import { formatNaira } from "../categoryUtils";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="orders-page">
      <button className="cart-back-button" onClick={() => navigate("/")}>
        <ChevronLeft size={18} />
        Continue shopping
      </button>

      <h1>My Orders</h1>

      {loading && <p>Loading your orders…</p>}
      {error && <p className="signin-form-message">{error}</p>}

      {!loading && orders.length === 0 && !error && (
        <div className="orders-empty">
          <p>You haven't placed any orders yet.</p>
          <button onClick={() => navigate("/")}>Start shopping</button>
        </div>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <button
            className="order-card"
            key={order._id}
            onClick={() => navigate(`/orders/${order._id}`)}
          >
            <div className="order-card-top">
              <strong>{order.orderNumber}</strong>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="order-card-bottom">
              <span className={`order-badge order-badge-${order.orderStatus}`}>
                {order.orderStatus}
              </span>
              <span className={`order-badge order-badge-payment-${order.paymentStatus}`}>
                {order.paymentStatus}
              </span>
              <strong>{formatNaira(order.totalAmount)}</strong>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

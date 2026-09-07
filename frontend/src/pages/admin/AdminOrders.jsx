import { useEffect, useState } from "react";
import { getAllOrdersAdmin, cancelOrderAdmin } from "../../api/orderApi";
import { formatNaira } from "../../categoryUtils";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  function load() {
    setLoading(true);
    getAllOrdersAdmin()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(order) {
    if (!window.confirm(`Cancel order ${order.orderNumber}? This cannot be undone.`)) return;

    setActingId(order._id);
    setError("");

    try {
      // The backend only allows cancelling here (not skipping the order
      // forward) — forward progress is per-vendor-item, by design.
      await cancelOrderAdmin(order._id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="vendor-panel">
      <div className="vendor-panel-header">
        <h2>All Orders</h2>
      </div>

      {loading && <p>Loading orders…</p>}
      {error && <p className="signin-form-message">{error}</p>}
      {!loading && orders.length === 0 && <p>No orders yet.</p>}

      <div className="admin-table">
        {orders.map((order) => (
          <div className="admin-table-row" key={order._id}>
            <div className="admin-table-main">
              <strong>{order.orderNumber}</strong>
              <span>
                {order.user?.name} • {order.user?.email}
              </span>
              <span>
                {order.items.length} item(s) • {formatNaira(order.totalAmount)}
              </span>
            </div>

            <span className={`order-badge order-badge-${order.orderStatus}`}>
              {order.orderStatus}
            </span>
            <span className={`order-badge order-badge-payment-${order.paymentStatus}`}>
              {order.paymentStatus}
            </span>

            {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
              <div className="admin-table-actions">
                <button onClick={() => handleCancel(order)} disabled={actingId === order._id}>
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getVendorOrders, updateOrderItemStatus } from "../../api/orderApi";
import { formatNaira } from "../../categoryUtils";

const ITEM_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState(null);

  function loadOrders() {
    setLoading(true);
    getVendorOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleStatusChange(orderId, itemId, itemStatus) {
    setUpdatingItemId(itemId);
    setError("");

    try {
      // The backend validates the transition (e.g. rejects skipping
      // steps or moving a delivered/cancelled item) — we just surface
      // whatever it decides rather than duplicating that logic here.
      await updateOrderItemStatus(orderId, itemId, itemStatus);
      loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingItemId(null);
    }
  }

  return (
    <div className="vendor-panel">
      <div className="vendor-panel-header">
        <h2>My Orders</h2>
      </div>

      {loading && <p>Loading your orders…</p>}
      {error && <p className="signin-form-message">{error}</p>}

      {!loading && orders.length === 0 && (
        <p>No orders containing your products yet.</p>
      )}

      <div className="vendor-order-list">
        {orders.map((order) => (
          <div className="vendor-order-card" key={order._id}>
            <div className="vendor-order-card-top">
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              <span className={`order-badge order-badge-payment-${order.paymentStatus}`}>
                Payment: {order.paymentStatus}
              </span>
            </div>

            <p className="vendor-order-address">
              Ship to: {order.shippingAddress.fullName}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.state}
            </p>

            {order.items.map((item) => (
              <div className="vendor-order-item" key={item._id}>
                <img src={item.image} alt={item.productName} />

                <div className="vendor-order-item-info">
                  <strong>{item.productName}</strong>
                  <span>
                    Qty: {item.quantity} • {formatNaira(item.price * item.quantity)}
                  </span>
                </div>

                <select
                  value={item.itemStatus}
                  disabled={updatingItemId === item._id}
                  onChange={(e) => handleStatusChange(order._id, item._id, e.target.value)}
                >
                  {ITEM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div className="vendor-order-card-bottom">
              <span>Your total for this order</span>
              <strong>{formatNaira(order.vendorSubtotal)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

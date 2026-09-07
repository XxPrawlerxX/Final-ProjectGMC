import { useEffect, useState } from "react";
import { getMyEarnings } from "../../api/payoutApi";
import { formatNaira } from "../../categoryUtils";

// This app does NOT move real money — an admin sends payouts manually
// outside the app (bank transfer, etc.) and records it, which is what
// moves an item from "pending" to the paid-out total/history below.
export default function VendorEarnings() {
  const [earnings, setEarnings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyEarnings()
      .then(setEarnings)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="vendor-panel">
        <p className="signin-form-message">{error}</p>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="vendor-panel">
        <p>Loading earnings…</p>
      </div>
    );
  }

  return (
    <div className="vendor-panel">
      <div className="vendor-earnings-summary">
        <div className="vendor-earnings-card">
          <span>Pending payout</span>
          <strong>{formatNaira(earnings.pendingAmount)}</strong>
        </div>
        <div className="vendor-earnings-card">
          <span>Total paid out</span>
          <strong>{formatNaira(earnings.paidAmount)}</strong>
        </div>
      </div>

      <p className="vendor-earnings-note">
        Earnings reflect a 10% platform commission and only count items
        that have been paid for AND delivered. Payouts are sent manually
        by an admin — this page reflects what's been recorded, not a
        live bank balance.
      </p>

      <h2>Pending Items</h2>
      {earnings.pendingItems.length === 0 && <p>Nothing pending payout right now.</p>}

      <div className="vendor-product-list">
        {earnings.pendingItems.map((item) => (
          <div className="vendor-product-row" key={item.orderItemId}>
            <div className="vendor-product-row-info">
              <strong>{item.productName}</strong>
              <span>
                Order {item.orderNumber} • Qty {item.quantity}
              </span>
            </div>
            <strong>{formatNaira(item.vendorShare)}</strong>
          </div>
        ))}
      </div>

      <h2>Payout History</h2>
      {earnings.history.length === 0 && <p>No payouts recorded yet.</p>}

      <div className="vendor-product-list">
        {earnings.history.map((payout) => (
          <div className="vendor-product-row" key={payout._id}>
            <div className="vendor-product-row-info">
              <strong>{formatNaira(payout.amount)}</strong>
              <span>{new Date(payout.createdAt).toLocaleDateString()}</span>
            </div>
            <span className="order-badge order-badge-delivered">Paid</span>
          </div>
        ))}
      </div>
    </div>
  );
}

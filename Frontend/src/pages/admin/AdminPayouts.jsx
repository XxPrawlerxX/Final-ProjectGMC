import { useEffect, useState } from "react";
import { getAdminPayoutSummary, payoutVendor, getAllPayoutHistory } from "../../api/payoutApi";
import { formatNaira } from "../../categoryUtils";

// Recording a payout here does NOT send real money — it's a ledger
// entry confirming the admin already sent the vendor their share
// manually (bank transfer, etc.) outside the app.
export default function AdminPayouts() {
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);

  function load() {
    setLoading(true);

    Promise.all([getAdminPayoutSummary(), getAllPayoutHistory()])
      .then(([summaryData, historyData]) => {
        setSummary(summaryData);
        setHistory(historyData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePayout(vendorEntry) {
    if (
      !window.confirm(
        `Confirm you have ALREADY sent ${vendorEntry.vendor.storeName} ${formatNaira(
          vendorEntry.pendingAmount,
        )} manually. This only records that payout — it does not send money.`,
      )
    ) {
      return;
    }

    setPayingId(vendorEntry.vendor._id);
    setError("");

    try {
      await payoutVendor(vendorEntry.vendor._id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="vendor-panel">
      <div className="vendor-panel-header">
        <h2>Vendor Payouts</h2>
      </div>

      <p className="vendor-earnings-note">
        This app does not move real money. Send the vendor their share
        manually first, then record it here so their earnings ledger
        stays accurate.
      </p>

      {loading && <p>Loading payout summary…</p>}
      {error && <p className="signin-form-message">{error}</p>}

      <div className="admin-table">
        {summary.map((entry) => (
          <div className="admin-table-row" key={entry.vendor._id}>
            <div className="admin-table-main">
              <strong>{entry.vendor.storeName}</strong>
              <span>
                Pending: {formatNaira(entry.pendingAmount)} • Paid out so far:{" "}
                {formatNaira(entry.paidAmount)}
              </span>
            </div>

            {entry.pendingAmount > 0 && (
              <div className="admin-table-actions">
                <button
                  className="vendor-primary-button"
                  onClick={() => handlePayout(entry)}
                  disabled={payingId === entry.vendor._id}
                >
                  {payingId === entry.vendor._id
                    ? "Recording…"
                    : `Mark ${formatNaira(entry.pendingAmount)} Paid`}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2>Payout History</h2>
      {!loading && history.length === 0 && <p>No payouts recorded yet.</p>}

      <div className="admin-table">
        {history.map((payout) => (
          <div className="admin-table-row" key={payout._id}>
            <div className="admin-table-main">
              <strong>{payout.vendor?.storeName}</strong>
              <span>
                {formatNaira(payout.amount)} • recorded by {payout.paidBy?.name} on{" "}
                {new Date(payout.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

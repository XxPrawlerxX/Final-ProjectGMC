import { useEffect, useState } from "react";
import {
  getVendorApplications,
  approveVendor,
  rejectVendor,
} from "../../api/vendorApi";

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  function load() {
    setLoading(true);
    getVendorApplications()
      .then(setVendors)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(vendor) {
    setActingId(vendor._id);
    setError("");

    try {
      await approveVendor(vendor._id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(vendor) {
    const reason = window.prompt(
      `Reason for rejecting "${vendor.storeName}"?`,
      "The submitted information could not be verified.",
    );

    if (reason === null) return;

    setActingId(vendor._id);
    setError("");

    try {
      await rejectVendor(vendor._id, reason);
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
        <h2>Vendor Applications</h2>
      </div>

      {loading && <p>Loading applications…</p>}
      {error && <p className="signin-form-message">{error}</p>}
      {!loading && vendors.length === 0 && <p>No vendor applications yet.</p>}

      <div className="admin-table">
        {vendors.map((vendor) => (
          <div className="admin-table-row" key={vendor._id}>
            <div className="admin-table-main">
              <strong>{vendor.storeName}</strong>
              <span>
                {vendor.user?.name} • {vendor.user?.email}
              </span>
              <span>
                {vendor.phone} • {vendor.address}
              </span>
              {vendor.status === "rejected" && vendor.rejectionReason && (
                <span className="admin-rejection-note">"{vendor.rejectionReason}"</span>
              )}
            </div>

            <span className={`order-badge order-badge-${vendor.status === "approved" ? "delivered" : vendor.status === "rejected" ? "cancelled" : "pending"}`}>
              {vendor.status}
            </span>

            {vendor.status === "pending" && (
              <div className="admin-table-actions">
                <button
                  className="vendor-primary-button"
                  onClick={() => handleApprove(vendor)}
                  disabled={actingId === vendor._id}
                >
                  Approve
                </button>
                <button onClick={() => handleReject(vendor)} disabled={actingId === vendor._id}>
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

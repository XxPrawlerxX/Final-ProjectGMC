import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyVendorProfile } from "../../api/vendorApi";
import VendorProducts from "./VendorProducts";
import VendorOrders from "./VendorOrders";
import VendorEarnings from "./VendorEarnings";
import VendorSettings from "./VendorSettings";
import "./vendor.css";

// No vendor UI existed at all before this. Built with the same
// color/font tokens as the rest of the site (--orange, --ink, --muted,
// "DM Sans"/"Manrope") rather than a new visual language, since there
// was no existing vendor design to preserve.
export default function VendorDashboard() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("products");

  useEffect(() => {
    getMyVendorProfile()
      .then(setVendor)
      .catch((err) => {
        if (err.status === 404) {
          setNotFound(true);
        } else {
          setError(err.message);
        }
      });
  }, []);

  if (error) {
    return (
      <div className="vendor-dashboard">
        <p className="signin-form-message">{error}</p>
      </div>
    );
  }

  // No vendor application exists yet for this account.
  if (notFound) {
    return (
      <div className="vendor-dashboard">
        <div className="vendor-status-card">
          <h1>Become a Marketfind Vendor</h1>
          <p>
            You don't have a vendor application yet. Register a vendor
            account to start selling on Marketfind.
          </p>
          <button onClick={() => navigate("/register")}>
            Apply to become a vendor
          </button>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="vendor-dashboard">
        <p>Loading your vendor profile…</p>
      </div>
    );
  }

  if (vendor.status === "pending") {
    return (
      <div className="vendor-dashboard">
        <div className="vendor-status-card">
          <h1>Application under review</h1>
          <p>
            Thanks for applying, <strong>{vendor.storeName}</strong>. An
            admin needs to approve your application before you can list
            products. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  if (vendor.status === "rejected") {
    return (
      <div className="vendor-dashboard">
        <div className="vendor-status-card vendor-status-rejected">
          <h1>Application not approved</h1>
          <p>
            Your application for <strong>{vendor.storeName}</strong> was not
            approved.
          </p>
          {vendor.rejectionReason && (
            <p className="vendor-rejection-reason">"{vendor.rejectionReason}"</p>
          )}
        </div>
      </div>
    );
  }

  // status === "approved"
  return (
    <div className="vendor-dashboard">
      <div className="vendor-dashboard-header">
        <div>
          <p className="category-kicker">VENDOR DASHBOARD</p>
          <h1>{vendor.storeName}</h1>
        </div>

        <div className="vendor-tabs">
          <button
            className={tab === "products" ? "active" : ""}
            onClick={() => setTab("products")}
          >
            My Products
          </button>
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
          >
            My Orders
          </button>
          <button
            className={tab === "earnings" ? "active" : ""}
            onClick={() => setTab("earnings")}
          >
            Earnings
          </button>
          <button
            className={tab === "settings" ? "active" : ""}
            onClick={() => setTab("settings")}
          >
            Store Settings
          </button>
        </div>
      </div>

      {tab === "products" && <VendorProducts />}
      {tab === "orders" && <VendorOrders />}
      {tab === "earnings" && <VendorEarnings />}
      {tab === "settings" && <VendorSettings vendor={vendor} onUpdated={setVendor} />}
    </div>
  );
}

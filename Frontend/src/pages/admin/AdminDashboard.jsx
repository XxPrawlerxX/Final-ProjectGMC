import { useState } from "react";
import AdminVendors from "./AdminVendors";
import AdminCategories from "./AdminCategories";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminPayouts from "./AdminPayouts";
import "../vendor/vendor.css";
import "./admin.css";

const TABS = [
  { key: "vendors", label: "Vendor Applications" },
  { key: "categories", label: "Categories" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "payouts", label: "Payouts" },
];

// No admin UI existed before this — built with the same tokens as the
// rest of the site, reusing the vendor dashboard's panel/table styling
// since the two share the same "management console" visual language.
export default function AdminDashboard() {
  const [tab, setTab] = useState("vendors");

  return (
    <div className="vendor-dashboard">
      <div className="vendor-dashboard-header">
        <div>
          <p className="category-kicker">ADMIN DASHBOARD</p>
          <h1>Marketfind Administration</h1>
        </div>

        <div className="vendor-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? "active" : ""}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "vendors" && <AdminVendors />}
      {tab === "categories" && <AdminCategories />}
      {tab === "products" && <AdminProducts />}
      {tab === "orders" && <AdminOrders />}
      {tab === "payouts" && <AdminPayouts />}
    </div>
  );
}

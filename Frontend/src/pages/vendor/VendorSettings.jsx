import { useState } from "react";
import { updateMyVendorProfile } from "../../api/vendorApi";
// Reused here for .account-form-group/.account-save-button/
// .account-success-message rather than duplicating the same styles.
import "../account.css";

export default function VendorSettings({ vendor, onUpdated }) {
  const [storeName, setStoreName] = useState(vendor.storeName || "");
  const [storeDescription, setStoreDescription] = useState(vendor.storeDescription || "");
  const [phone, setPhone] = useState(vendor.phone || "");
  const [address, setAddress] = useState(vendor.address || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!storeName || !phone || !address) {
      setError(true);
      setMessage("Store name, phone and address are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const data = await updateMyVendorProfile({
        storeName,
        storeDescription,
        phone,
        address,
      });
      setError(false);
      setMessage("Store profile updated successfully.");
      onUpdated(data.vendor);
    } catch (err) {
      setError(true);
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="account-card vendor-settings-card" onSubmit={submit}>
      <h2>Store Profile</h2>

      <div className="account-form-group">
        <label htmlFor="vendor-store-name">Store Name</label>
        <input
          id="vendor-store-name"
          type="text"
          value={storeName}
          onChange={(event) => setStoreName(event.target.value)}
          placeholder="Your store name"
        />
      </div>

      <div className="account-form-group">
        <label htmlFor="vendor-store-description">Store Description</label>
        <textarea
          id="vendor-store-description"
          value={storeDescription}
          onChange={(event) => setStoreDescription(event.target.value)}
          placeholder="Tell shoppers what your store sells"
        />
      </div>

      <div className="account-form-group">
        <label htmlFor="vendor-phone">Phone Number</label>
        <input
          id="vendor-phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Contact phone number"
        />
      </div>

      <div className="account-form-group">
        <label htmlFor="vendor-address">Address</label>
        <input
          id="vendor-address"
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Store address"
        />
      </div>

      {message && (
        <p className={error ? "signin-form-message" : "account-success-message"}>
          {message}
        </p>
      )}

      <button className="account-save-button" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Store Profile"}
      </button>
    </form>
  );
}

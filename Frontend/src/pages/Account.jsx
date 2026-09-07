import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../api/authApi";
// Reused here for .signin-form-message (error text styling).
import "./sign-in.css";
import "./account.css";

export default function Account() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function submitProfile(event) {
    event.preventDefault();

    if (!name || !email) {
      setProfileError(true);
      setProfileMessage("Name and email are required.");
      return;
    }

    setSavingProfile(true);
    setProfileMessage("");

    try {
      await updateProfile({ name, email });
      setProfileError(false);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(true);
      setProfileMessage(error.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPassword(event) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(true);
      setPasswordMessage("Fill in all three password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(true);
      setPasswordMessage("New password and confirmation don't match.");
      return;
    }

    setSavingPassword(true);
    setPasswordMessage("");

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setPasswordError(false);
      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(true);
      setPasswordMessage(error.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="account-page">
      <button className="account-back-button" onClick={() => navigate("/")}>
        <ChevronLeft size={18} />
        Continue shopping
      </button>

      <h1>Account Settings</h1>

      <div className="account-layout">
        <form className="account-card" onSubmit={submitProfile}>
          <h2>Profile Information</h2>

          <div className="account-form-group">
            <label htmlFor="account-name">Full Name</label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="account-form-group">
            <label htmlFor="account-email">Email Address</label>
            <input
              id="account-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email address"
            />
          </div>

          {profileMessage && (
            <p className={profileError ? "signin-form-message" : "account-success-message"}>
              {profileMessage}
            </p>
          )}

          <button className="account-save-button" type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </form>

        <form className="account-card" onSubmit={submitPassword}>
          <h2>Change Password</h2>

          <div className="account-form-group">
            <label htmlFor="account-current-password">Current Password</label>
            <input
              id="account-current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
            />
          </div>

          <div className="account-form-group">
            <label htmlFor="account-new-password">New Password</label>
            <input
              id="account-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="New password"
              autoComplete="new-password"
            />
          </div>

          <div className="account-form-group">
            <label htmlFor="account-confirm-password">Confirm New Password</label>
            <input
              id="account-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </div>

          {passwordMessage && (
            <p className={passwordError ? "signin-form-message" : "account-success-message"}>
              {passwordMessage}
            </p>
          )}

          <button className="account-save-button" type="submit" disabled={savingPassword}>
            {savingPassword ? "Saving…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

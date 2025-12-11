import { useState } from "react";
import "../../index.css";
import "./dashboard-pages.css";

function Security() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    alert("Password change endpoint not wired yet.");
  };

  return (
    <section className="ogc-dashboard-page">
      <div className="ogc-dashboard-page-header">
        <h1 className="ogc-dashboard-page-title">Security</h1>
        <p className="ogc-dashboard-page-subtitle">
          Manage your account security settings and password.
        </p>
      </div>

      <div className="ogc-dashboard-card">
        <h2 className="ogc-dashboard-card-title">Change Password</h2>
        <form onSubmit={handleSubmit} className="ogc-profile-form">
          <div className="ogc-form-group">
            <label htmlFor="currentPassword" className="ogc-form-label">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              className="ogc-form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
            />
          </div>

          <div className="ogc-form-group">
            <label htmlFor="newPassword" className="ogc-form-label">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              className="ogc-form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
            />
          </div>

          <div className="ogc-form-group">
            <label htmlFor="confirmPassword" className="ogc-form-label">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="ogc-form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />
          </div>

          <button type="submit" className="ogc-form-submit-btn">
            Change Password
          </button>
        </form>
      </div>

      <div className="ogc-dashboard-card" style={{ marginTop: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Additional Security</h2>
        <p className="ogc-dashboard-card-text" style={{ opacity: 0.8 }}>
          Two-factor authentication (2FA) and login activity tracking will be available soon.
        </p>
      </div>
    </section>
  );
}

export default Security;


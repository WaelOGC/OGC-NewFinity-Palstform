import { useState, useEffect } from "react";
import { api } from "../../utils/apiClient.js";
import "./admin-user-detail-panel.css";

function AdminUserDetailPanel({ userData, onClose, onUserUpdated }) {
  const [user, setUser] = useState(userData?.user || null);
  const [activities, setActivities] = useState(userData?.recentActivity || []);
  const [devices, setDevices] = useState(userData?.devices || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [role, setRole] = useState(user?.role || "");
  const [accountStatus, setAccountStatus] = useState(user?.accountStatus || "ACTIVE");
  const [featureFlags, setFeatureFlags] = useState(user?.featureFlags || {});

  useEffect(() => {
    if (userData) {
      setUser(userData.user);
      setActivities(userData.recentActivity || []);
      setDevices(userData.devices || []);
      setRole(userData.user?.role || "");
      setAccountStatus(userData.user?.accountStatus || "ACTIVE");
      setFeatureFlags(userData.user?.featureFlags || {});
    }
  }, [userData]);

  const handleSaveRole = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await api.put(`/admin/users/${user.id}/role`, { role });
      
      if (response.status === "OK") {
        setSuccess("Role updated successfully");
        setUser({ ...user, role: response.data.user.role });
        if (onUserUpdated) onUserUpdated();
      } else {
        setError("Failed to update role");
      }
    } catch (err) {
      console.error("Error updating role:", err);
      setError(err.backendMessage || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await api.put(`/admin/users/${user.id}/status`, { accountStatus });
      
      if (response.status === "OK") {
        setSuccess("Account status updated successfully");
        setUser({ ...user, accountStatus: response.data.user.accountStatus });
        if (onUserUpdated) onUserUpdated();
      } else {
        setError("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.backendMessage || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatureFlag = async (flagName, value) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updatedFlags = { ...featureFlags, [flagName]: value };
      setFeatureFlags(updatedFlags);

      const response = await api.put(`/admin/users/${user.id}/feature-flags`, {
        featureFlags: { [flagName]: value },
      });
      
      if (response.status === "OK") {
        setSuccess("Feature flag updated successfully");
        setFeatureFlags(response.data.user.featureFlags);
        if (onUserUpdated) onUserUpdated();
      } else {
        // Revert on error
        setFeatureFlags(featureFlags);
        setError("Failed to update feature flag");
      }
    } catch (err) {
      console.error("Error updating feature flag:", err);
      // Revert on error
      setFeatureFlags(featureFlags);
      setError(err.backendMessage || "Failed to update feature flag");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  // Known feature flags from defaultFeatureFlags.json
  const knownFeatureFlags = [
    { key: "walletV2", label: "Wallet V2" },
    { key: "amyAgentBeta", label: "Amy Agent Beta" },
    { key: "challengeProgramDashboard", label: "Challenge Program Dashboard" },
    { key: "newCreatorTools", label: "New Creator Tools" },
    { key: "advancedAnalytics", label: "Advanced Analytics" },
    { key: "socialTrading", label: "Social Trading" },
    { key: "experimentalUI", label: "Experimental UI" },
    { key: "apiV2Access", label: "API V2 Access" },
  ];

  return (
    <div className="admin-detail-overlay" onClick={onClose}>
      <div className="admin-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-detail-header">
          <h2>User Details</h2>
          <button onClick={onClose} className="admin-detail-close">×</button>
        </div>

        <div className="admin-detail-content">
          {error && (
            <div className="admin-detail-message admin-detail-error">
              {error}
            </div>
          )}
          {success && (
            <div className="admin-detail-message admin-detail-success">
              {success}
            </div>
          )}

          {/* Basic Info */}
          <section className="admin-detail-section">
            <h3>Basic Information</h3>
            <div className="admin-detail-info-grid">
              <div>
                <label>Name</label>
                <div>{user.fullName || "No name"}</div>
              </div>
              <div>
                <label>Email</label>
                <div>{user.email}</div>
              </div>
              <div>
                <label>Username</label>
                <div>{user.username || "Not set"}</div>
              </div>
              <div>
                <label>Country</label>
                <div>{user.country || "Not set"}</div>
              </div>
              <div>
                <label>Bio</label>
                <div>{user.bio || "No bio"}</div>
              </div>
            </div>
          </section>

          {/* Role & Status */}
          <section className="admin-detail-section">
            <h3>Role & Status</h3>
            <div className="admin-detail-form-group">
              <label>Role</label>
              <div className="admin-detail-form-row">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="admin-detail-select"
                >
                  <option value="FOUNDER">Founder</option>
                  <option value="CORE_TEAM">Core Team</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="CREATOR">Creator</option>
                  <option value="STANDARD_USER">Standard User</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                </select>
                <button
                  onClick={handleSaveRole}
                  disabled={loading || role === user.role}
                  className="admin-detail-save-btn"
                >
                  {loading ? "Saving..." : "Save Role"}
                </button>
              </div>
            </div>
            <div className="admin-detail-form-group">
              <label>Account Status</label>
              <div className="admin-detail-form-row">
                <select
                  value={accountStatus}
                  onChange={(e) => setAccountStatus(e.target.value)}
                  disabled={loading}
                  className="admin-detail-select"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                </select>
                <button
                  onClick={handleSaveStatus}
                  disabled={loading || accountStatus === (user.accountStatus || "ACTIVE")}
                  className="admin-detail-save-btn"
                >
                  {loading ? "Saving..." : "Save Status"}
                </button>
              </div>
            </div>
          </section>

          {/* Feature Flags */}
          <section className="admin-detail-section">
            <h3>Feature Flags</h3>
            <div className="admin-detail-flags">
              {knownFeatureFlags.map((flag) => (
                <div key={flag.key} className="admin-detail-flag-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={featureFlags[flag.key] === true}
                      onChange={(e) => handleToggleFeatureFlag(flag.key, e.target.checked)}
                      disabled={loading}
                    />
                    <span>{flag.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Security Snapshot */}
          <section className="admin-detail-section">
            <h3>Security Snapshot</h3>
            <div className="admin-detail-info-grid">
              <div>
                <label>Last Login</label>
                <div>{formatDate(user.lastLoginAt)}</div>
              </div>
              <div>
                <label>Devices</label>
                <div>{devices.length} device(s)</div>
              </div>
              <div>
                <label>Created At</label>
                <div>{formatDate(user.createdAt)}</div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="admin-detail-section">
            <h3>Recent Activity (Last 20)</h3>
            {activities.length === 0 ? (
              <p className="admin-detail-empty">No activity recorded</p>
            ) : (
              <div className="admin-detail-activity-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="admin-detail-activity-item">
                    <div className="admin-detail-activity-type">{activity.activityType}</div>
                    <div className="admin-detail-activity-desc">{activity.description}</div>
                    <div className="admin-detail-activity-time">{formatDate(activity.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Devices */}
          <section className="admin-detail-section">
            <h3>Devices (Last 10)</h3>
            {devices.length === 0 ? (
              <p className="admin-detail-empty">No devices registered</p>
            ) : (
              <div className="admin-detail-devices-list">
                {devices.map((device) => (
                  <div key={device.id} className="admin-detail-device-item">
                    <div className="admin-detail-device-name">{device.deviceName}</div>
                    <div className="admin-detail-device-info">
                      <div>Last seen: {formatDate(device.lastSeenAt)}</div>
                      {device.ipAddress && <div>IP: {device.ipAddress}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetailPanel;

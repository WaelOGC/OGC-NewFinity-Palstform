import { useState, useEffect } from "react";
import { api } from "../../utils/apiClient.js";
import {
  getAdminUser,
  getAdminUserSessions,
  adminRevokeUserSession,
  adminRevokeAllUserSessions,
} from "../../utils/apiClient.js";
import "./admin-user-detail-panel.css";

function AdminUserDetailPanel({ userId, onClose, onUserUpdated }) {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null); // Can be string or { message, code }

  const [activities, setActivities] = useState([]);
  const [devices, setDevices] = useState([]);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null); // Can be string or { message, code }
  const [sessionsActionLoading, setSessionsActionLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [role, setRole] = useState("");
  const [accountStatus, setAccountStatus] = useState("ACTIVE");
  const [featureFlags, setFeatureFlags] = useState({});

  // Load user and sessions when userId changes
  useEffect(() => {
    if (!userId) return;

    const loadUserAndSessions = async () => {
      setUserLoading(true);
      setSessionsLoading(true);
      setUserError(null);
      setSessionsError(null);

      try {
        // Load full user detail (includes activities and devices)
        const fullDetail = await api.get(`/admin/users/${userId}`);
        
        if (fullDetail && fullDetail.user) {
          const loadedUser = fullDetail.user;
          setUser(loadedUser);
          setActivities(fullDetail.recentActivity || []);
          setDevices(fullDetail.devices || []);
          setRole(loadedUser.role || "");
          setAccountStatus(loadedUser.accountStatus || "ACTIVE");
          setFeatureFlags(loadedUser.featureFlags || {});
          setUserError(null);
        } else {
          setUserError("Failed to load user details");
        }

        // Load sessions separately
        const sessionList = await getAdminUserSessions(userId);
        setSessions(sessionList || []);
        setSessionsError(null);
      } catch (err) {
        console.error("Failed to load user details or sessions:", err);
        setUserError({
          message: err?.message || "Unable to load user details.",
          code: err?.code
        });
        setSessionsError({
          message: err?.message || "Unable to load sessions.",
          code: err?.code
        });
      } finally {
        setUserLoading(false);
        setSessionsLoading(false);
      }
    };

    loadUserAndSessions();
  }, [userId]);

  const handleAdminRevokeSession = async (sessionId) => {
    if (!userId || !sessionId) return;
    
    if (!confirm("Are you sure you want to revoke this session? The user will be logged out from that device.")) {
      return;
    }

    setSessionsActionLoading(true);
    setSessionsError(null);
    setError(null);
    setSuccess(null);

    try {
      await adminRevokeUserSession(userId, sessionId);
      setSuccess("Session revoked successfully");
      
      // Refresh sessions
      const refreshed = await getAdminUserSessions(userId);
      setSessions(refreshed || []);
      setSessionsError(null);
      
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error("Error revoking session:", err);
      const errorObj = {
        message: err?.message || "Unable to revoke session.",
        code: err?.code
      };
      setSessionsError(errorObj);
      setError(errorObj.message);
    } finally {
      setSessionsActionLoading(false);
    }
  };

  const handleAdminRevokeAllSessions = async () => {
    if (!userId) return;
    
    if (!confirm("Are you sure you want to log out this user from all devices? This will force them to log in again.")) {
      return;
    }

    setSessionsActionLoading(true);
    setSessionsError(null);
    setError(null);
    setSuccess(null);

    try {
      await adminRevokeAllUserSessions(userId);
      setSuccess("Successfully logged out user from all devices");
      
      // Refresh sessions
      const refreshed = await getAdminUserSessions(userId);
      setSessions(refreshed || []);
      setSessionsError(null);
      
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error("Error revoking all sessions:", err);
      const errorObj = {
        message: err?.message || "Unable to revoke all sessions.",
        code: err?.code
      };
      setSessionsError(errorObj);
      setError(errorObj.message);
    } finally {
      setSessionsActionLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // API client now returns data directly (from { status: "OK", data: { user } })
      const data = await api.put(`/admin/users/${user.id}/role`, { role });
      
      // Success - API client throws on error
      setSuccess("Role updated successfully");
      if (data && data.user) {
        setUser({ ...user, role: data.user.role });
        setRole(data.user.role);
      }
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error("Error updating role:", err);
      setError(err?.message || "Unable to update role.");
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

      const data = await api.put(`/admin/users/${user.id}/status`, { accountStatus });
      
      // Success - API client throws on error
      setSuccess("Account status updated successfully");
      if (data && data.user) {
        setUser({ ...user, accountStatus: data.user.accountStatus });
        setAccountStatus(data.user.accountStatus);
      }
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err?.message || "Unable to update status.");
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

      // API client now returns data directly (from { status: "OK", data: { user } })
      const data = await api.put(`/admin/users/${user.id}/feature-flags`, {
        featureFlags: { [flagName]: value },
      });
      
      // Success - API client throws on error
      setSuccess("Feature flag updated successfully");
      if (data && data.user && data.user.featureFlags) {
        setFeatureFlags(data.user.featureFlags);
      }
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      console.error("Error updating feature flag:", err);
      // Revert on error
      setFeatureFlags(featureFlags);
      setError(err?.message || "Unable to update feature flag.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Loading state
  if (userLoading) {
    return (
      <div className="admin-detail-overlay" onClick={onClose}>
        <div className="admin-detail-panel" onClick={(e) => e.stopPropagation()}>
          <div className="admin-detail-header">
            <h2>User Details</h2>
            <button onClick={onClose} className="admin-detail-close">×</button>
          </div>
          <div className="admin-detail-content">
            <p>Loading user...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (userError) {
    const errorMessage = typeof userError === 'string' ? userError : userError.message;
    const errorCode = typeof userError === 'object' ? userError.code : null;
    return (
      <div className="admin-detail-overlay" onClick={onClose}>
        <div className="admin-detail-panel" onClick={(e) => e.stopPropagation()}>
          <div className="admin-detail-header">
            <h2>User Details</h2>
            <button onClick={onClose} className="admin-detail-close">×</button>
          </div>
          <div className="admin-detail-content">
            <div className="admin-detail-message admin-detail-error">
              {errorMessage}
              {errorCode && <span className="error-code">(Code: {errorCode})</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No user state
  if (!user) {
    return (
      <div className="admin-detail-overlay" onClick={onClose}>
        <div className="admin-detail-panel" onClick={(e) => e.stopPropagation()}>
          <div className="admin-detail-header">
            <h2>User Details</h2>
            <button onClick={onClose} className="admin-detail-close">×</button>
          </div>
          <div className="admin-detail-content">
            <p>No user selected.</p>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Sessions (Phase 7.1) */}
          <section className="admin-detail-section">
            <div className="admin-detail-sessions-header">
              <h3>Active Sessions</h3>
              {sessions.length > 0 && (
                <button
                  onClick={handleAdminRevokeAllSessions}
                  disabled={sessionsActionLoading}
                  className="admin-detail-revoke-all-btn"
                >
                  {sessionsActionLoading ? "Logging out..." : "Log out user from all devices"}
                </button>
              )}
            </div>
            {sessionsLoading ? (
              <p className="admin-detail-empty">Loading sessions...</p>
            ) : sessionsError ? (
              <div className="admin-detail-message admin-detail-error">
                {typeof sessionsError === 'string' ? sessionsError : sessionsError.message}
                {typeof sessionsError === 'object' && sessionsError.code && (
                  <span className="error-code">(Code: {sessionsError.code})</span>
                )}
              </div>
            ) : sessions.length === 0 ? (
              <p className="admin-detail-empty">No active sessions for this user.</p>
            ) : (
              <div className="admin-detail-devices-list">
                {sessions.map((session) => (
                  <div key={session.id} className="admin-detail-device-item admin-detail-session-item">
                    <div className="admin-detail-session-item-content">
                      <div className="admin-detail-device-name">
                        {session.userAgent ? (() => {
                          let browser = "Unknown";
                          let os = "Unknown";
                          const ua = session.userAgent;
                          if (ua.includes("Chrome")) browser = "Chrome";
                          else if (ua.includes("Firefox")) browser = "Firefox";
                          else if (ua.includes("Safari")) browser = "Safari";
                          else if (ua.includes("Edge")) browser = "Edge";
                          if (ua.includes("Windows")) os = "Windows";
                          else if (ua.includes("Mac")) os = "macOS";
                          else if (ua.includes("Linux")) os = "Linux";
                          else if (ua.includes("Android")) os = "Android";
                          else if (ua.includes("iOS")) os = "iOS";
                          return `${browser} on ${os}`;
                        })() : "Unknown device"}
                        {session.isCurrent && (
                          <span className="admin-detail-current-session-badge">
                            Current session (approx.)
                          </span>
                        )}
                      </div>
                      <div className="admin-detail-device-info">
                        <div>Last seen: {formatDate(session.lastSeenAt)}</div>
                        {session.ipAddress && <div>IP: {session.ipAddress}</div>}
                        {session.createdAt && <div>Created: {formatDate(session.createdAt)}</div>}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => handleAdminRevokeSession(session.id)}
                        disabled={sessionsActionLoading}
                        className="admin-detail-revoke-btn"
                      >
                        {sessionsActionLoading ? "Revoking..." : "Revoke"}
                      </button>
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

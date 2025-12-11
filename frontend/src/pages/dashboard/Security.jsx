import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/apiClient.js";
import { QRCodeSVG } from "qrcode.react";
import "../../index.css";
import "./dashboard-pages.css";

// TODO: Expand in Phase 3 (IP risk scoring, geo checks, proper TOTP, advanced device fingerprinting)

function Security() {
  const { user } = useAuth();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Activity state
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  // Devices state
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState(null);
  const [revokingDevice, setRevokingDevice] = useState(null);

  // Sessions state (Phase 7.1)
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
  const [revokingSession, setRevokingSession] = useState(null);
  const [revokingAllOthers, setRevokingAllOthers] = useState(false);

  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState({ enabled: false });
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [twoFactorError, setTwoFactorError] = useState(null);
  const [twoFactorMessage, setTwoFactorMessage] = useState(null);
  const [twoFactorSetupMode, setTwoFactorSetupMode] = useState(false); // 'idle', 'qr', 'verify'
  const [twoFactorQrUrl, setTwoFactorQrUrl] = useState(null);
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = useState("");
  const [twoFactorVerifying, setTwoFactorVerifying] = useState(false);

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, []);

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Fetch sessions on mount (Phase 7.1)
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch 2FA status on mount
  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);
      // apiClient handles authentication via cookies
      const response = await api.get('/user/security/activity');
      
      if (response.status === "OK" && response.data?.items) {
        setActivities(Array.isArray(response.data.items) ? response.data.items : []);
      } else {
        // If no items, set empty array instead of error
        setActivities([]);
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      // Don't show error - just show empty state
      setActivities([]);
      setActivitiesError(null);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      setDevicesLoading(true);
      setDevicesError(null);
      // apiClient handles authentication via cookies
      const response = await api.get('/user/security/devices');
      
      if (response.status === "OK" && response.data?.devices) {
        setDevices(Array.isArray(response.data.devices) ? response.data.devices : []);
      } else {
        // If no devices, set empty array instead of error
        setDevices([]);
      }
    } catch (err) {
      console.error("Failed to fetch devices:", err);
      // Don't show error - just show empty state
      setDevices([]);
      setDevicesError(null);
    } finally {
      setDevicesLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      // apiClient handles authentication via cookies
      const response = await api.get('/user/security/sessions');
      
      if (response.status === "OK" && response.data?.sessions) {
        setSessions(Array.isArray(response.data.sessions) ? response.data.sessions : []);
      } else {
        // If no sessions, set empty array instead of error
        setSessions([]);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      // Don't show error - just show empty state
      setSessions([]);
      setSessionsError(null);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchTwoFactorStatus = async () => {
    try {
      setTwoFactorLoading(true);
      setTwoFactorError(null);
      // apiClient handles authentication via cookies
      const response = await api.get('/user/security/2fa/status');
      
      if (response.status === "OK" && response.data) {
        setTwoFactorStatus(response.data);
      } else {
        // Default to disabled if status not available
        setTwoFactorStatus({ enabled: false });
      }
    } catch (err) {
      console.error("Failed to fetch 2FA status:", err);
      // Default to disabled on error
      setTwoFactorStatus({ enabled: false });
      setTwoFactorError(null); // Don't show error, just default to disabled
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    try {
      setPasswordLoading(true);
      // apiClient handles authentication via cookies
      const response = await api.put('/user/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.status === "OK") {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
        // Refresh activities to show password change
        fetchActivities();
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      setPasswordError(err.backendMessage || err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    if (!confirm("Are you sure you want to revoke this device? You will need to log in again from this device.")) {
      return;
    }

    try {
      setRevokingDevice(deviceId);
      // apiClient handles authentication via cookies
      const response = await api.delete(`/user/security/devices/${deviceId}`);

      if (response.status === "OK") {
        // Refresh devices list
        await fetchDevices();
        // Refresh activities to show device revocation
        await fetchActivities();
      }
    } catch (err) {
      console.error("Failed to revoke device:", err);
      alert(err.backendMessage || err.message || "Failed to revoke device");
    } finally {
      setRevokingDevice(null);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm("Are you sure you want to log out from this device? You will need to log in again from that device.")) {
      return;
    }

    try {
      setRevokingSession(sessionId);
      // apiClient handles authentication via cookies
      const response = await api.post('/user/security/sessions/revoke', { sessionId });

      if (response.status === "OK") {
        // Refresh sessions list
        await fetchSessions();
        // Refresh activities
        await fetchActivities();
      }
    } catch (err) {
      console.error("Failed to revoke session:", err);
      alert(err.backendMessage || err.message || "Failed to revoke session");
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!confirm("Are you sure you want to log out from all other devices? You will remain logged in on this device only.")) {
      return;
    }

    try {
      setRevokingAllOthers(true);
      // apiClient handles authentication via cookies
      const response = await api.post('/user/security/sessions/revoke-all-others', {});

      if (response.status === "OK") {
        // Refresh sessions list
        await fetchSessions();
        // Refresh activities
        await fetchActivities();
        alert(`Successfully logged out from ${response.data?.revokedCount || 0} other device(s).`);
      }
    } catch (err) {
      console.error("Failed to revoke all other sessions:", err);
      alert(err.backendMessage || err.message || "Failed to revoke sessions");
    } finally {
      setRevokingAllOthers(false);
    }
  };

  const handleTwoFactorSetup = async () => {
    try {
      setTwoFactorError(null);
      setTwoFactorMessage(null);
      setTwoFactorSetupMode('qr');
      
      // apiClient handles authentication via cookies
      const response = await api.post('/user/security/2fa/setup', { step: 'start' });

      if (response.status === "OK" && response.data?.otpauthUrl) {
        setTwoFactorQrUrl(response.data.otpauthUrl);
      } else {
        setTwoFactorError("Failed to generate QR code");
        setTwoFactorSetupMode(false);
      }
    } catch (err) {
      console.error("Failed to setup 2FA:", err);
      setTwoFactorError(err.backendMessage || err.message || "Failed to setup 2FA");
      setTwoFactorSetupMode(false);
    }
  };

  const handleTwoFactorVerify = async () => {
    if (!twoFactorVerifyCode || !/^\d{6}$/.test(twoFactorVerifyCode)) {
      setTwoFactorError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setTwoFactorVerifying(true);
      setTwoFactorError(null);
      
      // apiClient handles authentication via cookies
      const response = await api.post('/user/security/2fa/setup', { 
        step: 'verify', 
        token: twoFactorVerifyCode 
      });

      if (response.status === "OK") {
        setTwoFactorStatus({ enabled: true, method: 'totp' });
        setTwoFactorMessage("2FA enabled successfully!");
        setTwoFactorSetupMode(false);
        setTwoFactorQrUrl(null);
        setTwoFactorVerifyCode("");
        setTimeout(() => {
          setTwoFactorMessage(null);
          fetchTwoFactorStatus();
          fetchActivities();
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to verify 2FA:", err);
      setTwoFactorError(err.backendMessage || err.message || "Invalid code. Please try again.");
    } finally {
      setTwoFactorVerifying(false);
    }
  };

  const handleCancelTwoFactorSetup = () => {
    setTwoFactorSetupMode(false);
    setTwoFactorQrUrl(null);
    setTwoFactorVerifyCode("");
    setTwoFactorError(null);
  };

  const handleTwoFactorDisable = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication?")) {
      return;
    }

    try {
      setTwoFactorMessage(null);
      // apiClient handles authentication via cookies
      const response = await api.post('/user/security/2fa/disable', {});

      if (response.status === "OK") {
        setTwoFactorStatus({ enabled: false });
        setTwoFactorMessage("2FA disabled successfully");
        setTimeout(() => setTwoFactorMessage(null), 3000);
        // Refresh activities
        fetchActivities();
      }
    } catch (err) {
      console.error("Failed to disable 2FA:", err);
      setTwoFactorError(err.backendMessage || err.message || "Failed to disable 2FA");
    }
  };

      // Format activity type to human-readable label
  const formatActivityType = (type) => {
    const labels = {
      LOGIN_SUCCESS: "Successful login",
      LOGIN_FAILED: "Failed login attempt",
      LOGIN_CHALLENGE_2FA: "2FA challenge required",
      LOGIN_SUCCESS_2FA: "Successful login with 2FA",
      PASSWORD_CHANGED: "Password changed",
      PROFILE_UPDATED: "Profile updated",
      DEVICE_REVOKED: "Device revoked",
      TWO_FACTOR_ENABLED: "Two-factor authentication enabled",
      TWO_FACTOR_DISABLED: "Two-factor authentication disabled",
      TWO_FACTOR_FAILED: "Failed 2FA verification attempt",
    };
    return labels[type] || type;
  };

  // Format date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Parse user agent to get browser/OS info
  const parseUserAgent = (userAgent) => {
    if (!userAgent) return "Unknown device";
    
    let browser = "Unknown";
    let os = "Unknown";
    
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iOS")) os = "iOS";
    
    return `${browser} on ${os}`;
  };

  // Get current device ID (simplified - would need to match backend logic)
  const getCurrentDeviceId = () => {
    // This is a simplified approach - in production, you'd want to match the backend's device ID generation
    return devices.length > 0 ? devices[0].deviceFingerprint : null;
  };

  return (
    <section className="ogc-dashboard-page">
      <div className="ogc-dashboard-page-header">
        <h1 className="ogc-dashboard-page-title">Security</h1>
        <p className="ogc-dashboard-page-subtitle">
          Manage your account security settings and password.
        </p>
      </div>

      {/* Change Password Section */}
      <div className="ogc-dashboard-card">
        <h2 className="ogc-dashboard-card-title">Change Password</h2>
        
        {passwordError && (
          <div className="ogc-form-error" style={{ marginBottom: "1rem" }}>
            {passwordError}
          </div>
        )}
        
        {passwordSuccess && (
          <div className="ogc-form-success" style={{ marginBottom: "1rem" }}>
            Password changed successfully!
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="ogc-profile-form">
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
              required
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
              placeholder="Enter your new password (min 8 characters)"
              minLength={8}
              required
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
              minLength={8}
              required
            />
          </div>

          <button 
            type="submit" 
            className="ogc-form-submit-btn"
            disabled={passwordLoading}
          >
            {passwordLoading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Recent Activity Section */}
      <div className="ogc-dashboard-card" style={{ marginTop: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Recent Activity</h2>
        
        {activitiesLoading ? (
          <p style={{ opacity: 0.8 }}>Loading activity...</p>
        ) : activities.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No activity recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  padding: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <strong>{formatActivityType(activity.activityType)}</strong>
                    {activity.description && (
                      <p style={{ margin: "4px 0 0 0", opacity: 0.8, fontSize: "0.9em" }}>
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: "0.85em", opacity: 0.7 }}>
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: "0.85em", opacity: 0.7, display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {activity.ipAddress && (
                    <span>IP: {activity.ipAddress}</span>
                  )}
                  {activity.userAgent && (
                    <span>{parseUserAgent(activity.userAgent)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Sessions Section (Phase 7.1) */}
      <div className="ogc-dashboard-card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className="ogc-dashboard-card-title">Active Sessions</h2>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAllOtherSessions}
              disabled={revokingAllOthers}
              style={{
                padding: "8px 16px",
                backgroundColor: "rgba(255, 0, 0, 0.2)",
                border: "1px solid rgba(255, 0, 0, 0.3)",
                borderRadius: "4px",
                color: "#fff",
                cursor: revokingAllOthers ? "not-allowed" : "pointer",
                opacity: revokingAllOthers ? 0.5 : 1,
                fontSize: "0.9em",
              }}
            >
              {revokingAllOthers ? "Logging out..." : "Log out from all other devices"}
            </button>
          )}
        </div>
        
        {sessionsLoading ? (
          <p style={{ opacity: 0.8 }}>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No active sessions.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  padding: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong>{parseUserAgent(session.userAgent)}</strong>
                    {session.isCurrent && (
                      <span style={{ fontSize: "0.75em", padding: "2px 6px", backgroundColor: "rgba(0, 255, 0, 0.2)", borderRadius: "4px" }}>
                        This device
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
                    Last seen: {formatDateTime(session.lastSeenAt)}
                  </div>
                  {session.ipAddress && (
                    <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
                      IP: {session.ipAddress}
                    </div>
                  )}
                  {session.createdAt && (
                    <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
                      Created: {formatDateTime(session.createdAt)}
                    </div>
                  )}
                </div>
                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    disabled={revokingSession === session.id}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "rgba(255, 0, 0, 0.2)",
                      border: "1px solid rgba(255, 0, 0, 0.3)",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: revokingSession === session.id ? "not-allowed" : "pointer",
                      opacity: revokingSession === session.id ? 0.5 : 1,
                    }}
                  >
                    {revokingSession === session.id ? "Logging out..." : "Log out"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Devices & Sessions Section (Legacy - keeping for backward compatibility) */}
      <div className="ogc-dashboard-card" style={{ marginTop: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Devices & Sessions</h2>
        
        {devicesLoading ? (
          <p style={{ opacity: 0.8 }}>Loading devices...</p>
        ) : devices.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No devices registered yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {devices.map((device, index) => {
              const isCurrentDevice = index === 0; // Simplified - first device is current
              return (
                <div
                  key={device.id}
                  style={{
                    padding: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <strong>{device.deviceName || "Unknown device"}</strong>
                      {isCurrentDevice && (
                        <span style={{ fontSize: "0.75em", padding: "2px 6px", backgroundColor: "rgba(0, 255, 0, 0.2)", borderRadius: "4px" }}>
                          This device
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
                      Last seen: {formatDateTime(device.lastSeenAt)}
                    </div>
                    {device.ipAddress && (
                      <div style={{ fontSize: "0.85em", opacity: 0.7 }}>
                        IP: {device.ipAddress}
                      </div>
                    )}
                  </div>
                  {!isCurrentDevice && (
                    <button
                      onClick={() => handleRevokeDevice(device.deviceFingerprint)}
                      disabled={revokingDevice === device.deviceFingerprint}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "rgba(255, 0, 0, 0.2)",
                        border: "1px solid rgba(255, 0, 0, 0.3)",
                        borderRadius: "4px",
                        color: "#fff",
                        cursor: revokingDevice === device.deviceFingerprint ? "not-allowed" : "pointer",
                        opacity: revokingDevice === device.deviceFingerprint ? 0.5 : 1,
                      }}
                    >
                      {revokingDevice === device.deviceFingerprint ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="ogc-dashboard-card" style={{ marginTop: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Two-Factor Authentication</h2>
        
        {twoFactorLoading ? (
          <p style={{ opacity: 0.8 }}>Loading 2FA status...</p>
        ) : (
          <>
            {twoFactorError && (
              <div className="ogc-form-error" style={{ marginBottom: "1rem" }}>
                {twoFactorError}
              </div>
            )}
            
            {twoFactorMessage && (
              <div className="ogc-form-success" style={{ marginBottom: "1rem" }}>
                {twoFactorMessage}
              </div>
            )}

            {!twoFactorSetupMode ? (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ opacity: 0.8, marginBottom: "12px" }}>
                    Status: <strong>{twoFactorStatus.enabled ? "Enabled" : "Disabled"}</strong>
                  </p>
                  {twoFactorStatus.enabled && (
                    <p style={{ opacity: 0.7, fontSize: "0.9em", marginBottom: "16px" }}>
                      Method: <strong>TOTP (Google Authenticator / Authy)</strong>
                    </p>
                  )}
                </div>

                {twoFactorStatus.enabled ? (
                  <button
                    onClick={handleTwoFactorDisable}
                    className="ogc-form-submit-btn"
                    style={{ backgroundColor: "rgba(255, 0, 0, 0.2)", borderColor: "rgba(255, 0, 0, 0.3)" }}
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    onClick={handleTwoFactorSetup}
                    className="ogc-form-submit-btn"
                  >
                    Enable 2FA
                  </button>
                )}
              </>
            ) : (
              <div>
                {twoFactorQrUrl && (
                  <div style={{ marginBottom: "24px" }}>
                    <p style={{ marginBottom: "16px", opacity: 0.9 }}>
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                    </p>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "center", 
                      padding: "20px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                      marginBottom: "16px"
                    }}>
                      <QRCodeSVG value={twoFactorQrUrl} size={200} />
                    </div>
                    <p style={{ fontSize: "0.9em", opacity: 0.7, marginBottom: "16px" }}>
                      After scanning, enter the 6-digit code from your app below:
                    </p>
                    
                    <div className="ogc-form-group">
                      <label htmlFor="twoFactorCode" className="ogc-form-label">
                        6-Digit Code
                      </label>
                      <input
                        type="text"
                        id="twoFactorCode"
                        className="ogc-form-input"
                        value={twoFactorVerifyCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setTwoFactorVerifyCode(value);
                        }}
                        placeholder="000000"
                        maxLength={6}
                        style={{ textAlign: "center", fontSize: "1.2em", letterSpacing: "0.2em" }}
                      />
                    </div>
                    
                    <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                      <button
                        onClick={handleTwoFactorVerify}
                        className="ogc-form-submit-btn"
                        disabled={twoFactorVerifying || twoFactorVerifyCode.length !== 6}
                      >
                        {twoFactorVerifying ? "Verifying..." : "Verify & Enable"}
                      </button>
                      <button
                        onClick={handleCancelTwoFactorSetup}
                        className="ogc-form-submit-btn"
                        style={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.1)", 
                          borderColor: "rgba(255, 255, 255, 0.2)" 
                        }}
                        disabled={twoFactorVerifying}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default Security;

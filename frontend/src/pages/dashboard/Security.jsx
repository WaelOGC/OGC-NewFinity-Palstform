import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api, API_BASE_URL } from "../../utils/apiClient.js";
import { QRCodeCanvas } from 'qrcode.react';
import {
  getUserSessions,
  revokeUserSession,
  revokeAllOtherSessions,
  getUserSecurityActivity,
  getUserSecurityDevices,
  getTwoFactorStatus,
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  exportAccountData,
  changePasswordApi,
  fetchSecuritySessions,
  revokeSession as revokeSecuritySession,
  revokeOtherSessions as revokeOtherSecuritySessions,
  deleteAccountApi,
  getRecoveryCodesStatus,
  regenerateRecoveryCodes,
} from "../../utils/apiClient.js";
import "../../index.css";
import "./dashboard-pages.css";

// TODO: Expand in Phase 3 (IP risk scoring, geo checks, proper TOTP, advanced device fingerprinting)

function Security() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);
  const [sessionsActionLoading, setSessionsActionLoading] = useState(false);

  // 2FA state (new implementation)
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    createdAt: null,
    confirmedAt: null,
  });
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [twoFactorError, setTwoFactorError] = useState(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorOtpToken, setTwoFactorOtpToken] = useState('');
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState('idle'); // 'idle' | 'setup'
  const [twoFactorSetupMode, setTwoFactorSetupMode] = useState('qr');   // 'qr' | 'manual'
  const [twoFactorOtpauthUrl, setTwoFactorOtpauthUrl] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);

  // Delete Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Data Export state
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Recovery codes state (Phase S5)
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [freshRecoveryCodes, setFreshRecoveryCodes] = useState([]); // plain codes after generation

  // PHASE S2: Load sessions function
  const loadSessions = async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const sessionList = await fetchSecuritySessions();
      setSessions(sessionList || []);
      setSessionsError(null);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setSessionsError(err?.message || "Unable to load sessions.");
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Fetch activities function
  const fetchActivities = async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const items = await getUserSecurityActivity();
      setActivities(items || []);
      setActivitiesError(null);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      setActivitiesError(err?.message || "Unable to load recent activity.");
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch devices function
  const fetchDevices = async () => {
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const list = await getUserSecurityDevices();
      setDevices(list || []);
      setDevicesError(null);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
      setDevicesError(err?.message || "Unable to load devices.");
      setDevices([]);
    } finally {
      setDevicesLoading(false);
    }
  };

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
    loadSessions();
  }, []);

  // Load 2FA status on mount (new implementation)
  useEffect(() => {
    let cancelled = false;

    async function load2FA() {
      try {
        setTwoFactorLoading(true);
        setTwoFactorError(null);
        const data = await getTwoFactorStatus();
        if (!cancelled) {
          // Backend now returns { enabled, method, enabledAt }
          setTwoFactorStatus({
            enabled: data.enabled || false,
            createdAt: data.enabledAt || null,
            confirmedAt: data.enabledAt || null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setTwoFactorError(err.message || 'Failed to load 2FA status.');
        }
      } finally {
        if (!cancelled) {
          setTwoFactorLoading(false);
        }
      }
    }

    load2FA();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load recovery codes status on mount (Phase S5)
  useEffect(() => {
    async function loadRecoveryStatus() {
      try {
        const codes = await getRecoveryCodesStatus();
        setRecoveryCodes(codes || []);
      } catch (err) {
        console.error('Failed to load recovery codes status:', err);
        // Do not show blocking error – keep card usable
      }
    }

    loadRecoveryStatus();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || !confirmPassword) {
      setPasswordError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
      // Refresh activities to show password change
      fetchActivities();
    } catch (err) {
      console.error("Failed to change password:", err);
      setPasswordError(err?.message || "Failed to change password.");
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
      alert(err?.message || "Unable to revoke device.");
    } finally {
      setRevokingDevice(null);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm("Are you sure you want to log out from this device? You will need to log in again from that device.")) {
      return;
    }

    setSessionsActionLoading(true);
    setSessionsError(null);
    try {
      await revokeSecuritySession(sessionId);
      // Reload list after revocation
      await loadSessions();
      // Refresh activities to show revocation
      await fetchActivities();
    } catch (err) {
      console.error("Failed to revoke session:", err);
      setSessionsError(err?.message || "Unable to revoke session.");
    } finally {
      setSessionsActionLoading(false);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm("Are you sure you want to log out from all other devices? You will remain logged in on this device only.")) {
      return;
    }

    setSessionsActionLoading(true);
    setSessionsError(null);
    try {
      await revokeOtherSecuritySessions();
      // Reload list after revocation
      await loadSessions();
      // Refresh activities to show revocation
      await fetchActivities();
    } catch (err) {
      console.error("Failed to revoke other sessions:", err);
      setSessionsError(err?.message || "Unable to revoke other sessions.");
    } finally {
      setSessionsActionLoading(false);
    }
  };

  // 2FA handlers (new implementation)
  async function handleStart2FA() {
    try {
      setTwoFactorError('');
      setTwoFactorLoading(true);
      setTwoFactorBusy(true);
      
      // Clear any previous state first
      setTwoFactorSecret('');
      setTwoFactorOtpauthUrl('');
      setTwoFactorOtpToken('');
      setTwoFactorSetupMode('qr');      // default to QR
      
      // Get fresh setup data from server
      const { secret, otpauthUrl } = await startTwoFactorSetup();
      
      // Set new state with fresh data
      setTwoFactorSecret(secret || '');
      setTwoFactorOtpauthUrl(otpauthUrl || '');
      setTwoFactorOtpToken('');
      setTwoFactorSetupStep('setup');
    } catch (err) {
      setTwoFactorError(err.message || 'Failed to start 2FA setup.');
      setTwoFactorSetupStep('idle');
    } finally {
      setTwoFactorLoading(false);
      setTwoFactorBusy(false);
    }
  }

  async function handleConfirm2FA() {
    try {
      if (!twoFactorOtpToken.trim()) {
        setTwoFactorError('Enter the 6-digit code from your authenticator app.');
        return;
      }
      
      if (!/^\d{6}$/.test(twoFactorOtpToken.trim())) {
        setTwoFactorError('Please enter a valid 6-digit code.');
        return;
      }
      
      setTwoFactorBusy(true);
      setTwoFactorError(null);
      await confirmTwoFactorSetup(twoFactorOtpToken.trim());
      
      // Reset setup state
      setTwoFactorSetupStep('idle');
      setTwoFactorSetupMode('qr');
      setTwoFactorSecret('');
      setTwoFactorOtpauthUrl('');
      setTwoFactorOtpToken('');
      setTwoFactorError(null);
      
      // Refresh status from server to get updated enabled state
      try {
        const freshStatus = await getTwoFactorStatus();
        setTwoFactorStatus({
          enabled: freshStatus.enabled || true,
          createdAt: freshStatus.enabledAt || new Date().toISOString(),
          confirmedAt: freshStatus.enabledAt || new Date().toISOString(),
        });
      } catch (statusErr) {
        console.warn('Failed to refresh 2FA status after confirm:', statusErr);
        // Fallback to optimistic update
        setTwoFactorStatus((prev) => ({ ...prev, enabled: true, confirmedAt: new Date().toISOString() }));
      }
      
      // Refresh activities
      fetchActivities();
    } catch (err) {
      // Handle specific error codes from backend
      const errorCode = err.code || err.backendCode;
      let errorMessage = err.message || err.backendMessage || 'Failed to confirm 2FA.';
      
      if (errorCode === 'TWO_FACTOR_CODE_INVALID' || errorCode === 'TOTP_INVALID') {
        errorMessage = 'The verification code is invalid or has expired. Please try again.';
      } else if (errorCode === 'TWO_FACTOR_NOT_INITIALIZED' || errorCode === 'TOTP_NOT_INITIALIZED') {
        errorMessage = '2FA setup not started. Please begin setup first.';
      }
      
      setTwoFactorError(errorMessage);
    } finally {
      setTwoFactorBusy(false);
    }
  }

  const handleCancelTwoFactorSetup = () => {
    setTwoFactorSetupStep('idle');
    setTwoFactorSecret('');
    setTwoFactorOtpauthUrl('');
    setTwoFactorOtpToken('');
    setTwoFactorError('');
  };

  async function handleDisable2FA() {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will reduce your account security.')) {
      return;
    }
    
    try {
      setTwoFactorBusy(true);
      setTwoFactorError(null);
      await disableTwoFactor();
      
      // Reset all UI state
      setTwoFactorStatus({ enabled: false, createdAt: null, confirmedAt: null });
      setTwoFactorSetupStep('idle');
      setTwoFactorSetupMode('qr');
      setTwoFactorSecret('');
      setTwoFactorOtpauthUrl('');
      setTwoFactorOtpToken('');
      setTwoFactorError(null);
      
      // Refresh status from server to ensure consistency
      try {
        const freshStatus = await getTwoFactorStatus();
        setTwoFactorStatus({
          enabled: freshStatus.enabled || false,
          createdAt: freshStatus.enabledAt || null,
          confirmedAt: freshStatus.enabledAt || null,
        });
      } catch (statusErr) {
        console.warn('Failed to refresh 2FA status after disable:', statusErr);
      }
      
      // Refresh activities
      fetchActivities();
    } catch (err) {
      // Handle specific error codes from backend
      const errorCode = err.code || err.backendCode;
      let errorMessage = err.message || err.backendMessage || 'Failed to disable 2FA.';
      
      if (errorCode === 'TWO_FACTOR_NOT_ENABLED') {
        errorMessage = 'Two-factor authentication is not enabled for this account.';
      }
      
      setTwoFactorError(errorMessage);
    } finally {
      setTwoFactorBusy(false);
    }
  }

  function openDeleteModal() {
    setDeleteError(null);
    setDeletePassword("");
    setDeleteOtp("");
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleteBusy) return;
    setShowDeleteModal(false);
  }

  async function handleConfirmDeleteAccount() {
    try {
      setDeleteBusy(true);
      setDeleteError(null);

      const payload = {
        password: deletePassword,
        otp: deleteOtp || undefined,
        confirmText: deleteConfirmText,
      };

      await deleteAccountApi(payload);

      // Clear local app state if needed (auth context, etc.)
      // For now, force a full redirect to landing page.
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const deleteFormValid =
    deletePassword.trim().length > 0 &&
    deleteConfirmText.trim().toUpperCase() === 'DELETE';

  // Recovery codes handlers (Phase S5)
  function openRecoveryModal() {
    setFreshRecoveryCodes([]);
    setRecoveryError(null);
    setShowRecoveryModal(true);
  }

  function closeRecoveryModal() {
    if (recoveryBusy) return;
    setShowRecoveryModal(false);
  }

  async function handleGenerateRecoveryCodes() {
    try {
      setRecoveryBusy(true);
      setRecoveryError(null);

      const codes = await regenerateRecoveryCodes();
      setFreshRecoveryCodes(codes);
      // Refresh status to show new list (all unused)
      const status = await getRecoveryCodesStatus();
      setRecoveryCodes(status || []);
    } catch (err) {
      setRecoveryError(err.message || 'Failed to generate recovery codes.');
    } finally {
      setRecoveryBusy(false);
    }
  }

  function handleDownloadRecoveryCodes() {
    if (!freshRecoveryCodes || freshRecoveryCodes.length === 0) return;

    const blob = new Blob(
      [
        'OGC NewFinity — 2FA Recovery Codes\n\n',
        'Store these codes in a safe place. Each code can be used once.\n\n',
        ...freshRecoveryCodes.map((c) => `${c}\n`),
      ],
      { type: 'text/plain;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ogc-newfinity-2fa-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleDownloadData = async () => {
    setExportBusy(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      const blob = await exportAccountData();

      const url = window.URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const fileName = `ogc-newfinity-account-export-${dateStr}.json`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
    } catch (err) {
      console.error("[Security] Account export failed", err);
      setExportError(
        err?.message ||
          "Could not generate your data export right now. Please try again later."
      );
    } finally {
      setExportBusy(false);
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
        
        {activitiesError && (
          <div className="ogc-form-error" style={{ marginBottom: "1rem" }}>
            {activitiesError}
          </div>
        )}
        
        {activitiesLoading ? (
          <p style={{ opacity: 0.8 }}>Loading recent activity...</p>
        ) : !activitiesLoading && !activitiesError && activities.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No recent activity yet.</p>
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
              onClick={handleRevokeAllOthers}
              disabled={sessionsActionLoading}
              style={{
                padding: "8px 16px",
                backgroundColor: "rgba(255, 0, 0, 0.2)",
                border: "1px solid rgba(255, 0, 0, 0.3)",
                borderRadius: "4px",
                color: "#fff",
                cursor: sessionsActionLoading ? "not-allowed" : "pointer",
                opacity: sessionsActionLoading ? 0.5 : 1,
                fontSize: "0.9em",
              }}
            >
              {sessionsActionLoading ? "Logging out..." : "Log out from all other devices"}
            </button>
          )}
        </div>
        
        {sessionsError && (
          <div className="ogc-form-error" style={{ marginBottom: "1rem" }}>
            {sessionsError}
          </div>
        )}
        
        {sessionsLoading ? (
          <p style={{ opacity: 0.8 }}>Loading sessions...</p>
        ) : sessions.length === 0 && !sessionsError ? (
          <p style={{ opacity: 0.8 }}>No active sessions found.</p>
        ) : (
          <>
            <ul className="session-list">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className={'session-item' + (session.isCurrent ? ' session-item--current' : '')}
                >
                  <div className="session-main">
                    <div className="session-title-row">
                      <span className="session-device">{session.deviceLabel || 'Unknown device'}</span>
                      {session.isCurrent && <span className="session-badge">This device</span>}
                    </div>
                    <div className="session-meta">
                      <span>{session.ipAddress}</span>
                      <span>Last active: {new Date(session.lastSeenAt).toLocaleString()}</span>
                      <span>Expires: {new Date(session.expiresAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      type="button"
                      className="session-revoke-btn"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={sessionsActionLoading}
                    >
                      {sessionsActionLoading ? 'Removing…' : 'Sign out'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            
            {sessions.length > 1 && (
              <div className="session-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleRevokeAllOthers}
                  disabled={sessionsActionLoading}
                >
                  {sessionsActionLoading ? 'Signing out…' : 'Sign out of other devices'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Devices & Sessions Section (Legacy - keeping for backward compatibility) */}
      <div className="ogc-dashboard-card" style={{ marginTop: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Devices & Sessions</h2>

        <p className="security-muted" style={{ marginBottom: "0.5rem" }}>
          Overview of devices and browsers that have an active session on your account.
        </p>

        {sessionsLoading && (
          <p className="security-muted">Loading devices…</p>
        )}

        {sessionsError && (
          <p className="form-message form-message--error">{sessionsError}</p>
        )}

        {!sessionsLoading && !sessionsError && sessions.length === 0 && (
          <p className="security-muted">No active devices found.</p>
        )}

        {!sessionsLoading && !sessionsError && sessions.length > 0 && (
          <ul className="session-list">
            {sessions.map((s) => (
              <li
                key={`device-${s.id}`}
                className={
                  "session-item" + (s.isCurrent ? " session-item--current" : "")
                }
              >
                <div className="session-main">
                  <div className="session-title-row">
                    <span className="session-device">{s.deviceLabel}</span>
                    {s.isCurrent && <span className="session-badge">This device</span>}
                  </div>

                  <div className="session-meta">
                    <span>{s.ipAddress}</span>
                    <span>
                      Last active:{" "}
                      {s.lastSeenAt
                        ? new Date(s.lastSeenAt).toLocaleString()
                        : "Unknown"}
                    </span>
                    <span>
                      Expires:{" "}
                      {s.expiresAt
                        ? new Date(s.expiresAt).toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="ogc-dashboard-card" style={{ marginTop: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Two-Factor Authentication</h2>
        <p className="ogc-dashboard-card-subtitle">
          Add an extra layer of security to your account using a one-time code from an authenticator app.
        </p>

        {twoFactorLoading && (
          <p className="security-muted">Checking 2FA status…</p>
        )}

        {twoFactorError && (
          <p className="form-message form-message--error" style={{ marginTop: '0.5rem' }}>
            {twoFactorError}
          </p>
        )}

        {!twoFactorLoading && twoFactorSetupStep === 'idle' && (
          <>
            <p className="security-muted">
              Status:{' '}
              {twoFactorStatus.enabled ? (
                <span style={{ color: 'var(--accent-primary)' }}>Enabled</span>
              ) : (
                <span style={{ color: 'var(--accent-warning)' }}>Disabled</span>
              )}
            </p>

            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              {!twoFactorStatus.enabled && (
                <button
                  type="button"
                  className="ogc-button-primary"
                  onClick={handleStart2FA}
                  disabled={twoFactorBusy}
                >
                  {twoFactorBusy ? 'Starting…' : 'Enable 2FA'}
                </button>
              )}

              {twoFactorStatus.enabled && (
                <button
                  type="button"
                  className="ogc-button-secondary"
                  onClick={handleDisable2FA}
                  disabled={twoFactorBusy}
                >
                  {twoFactorBusy ? 'Updating…' : 'Disable 2FA'}
                </button>
              )}
            </div>

            <p className="security-note">
              Enforcement in the login flow will be added in a later phase. For now, this
              lets you prepare your authenticator setup.
            </p>
          </>
        )}

        {!twoFactorLoading && twoFactorSetupStep === 'setup' && (
          <div className="twofactor-setup-panel">
            <div className="twofactor-setup-header">
              <div className="twofactor-toggle">
                <button
                  type="button"
                  className={
                    twoFactorSetupMode === 'qr'
                      ? 'twofactor-toggle-btn twofactor-toggle-btn--active'
                      : 'twofactor-toggle-btn'
                  }
                  onClick={() => setTwoFactorSetupMode('qr')}
                >
                  QR code
                </button>
                <button
                  type="button"
                  className={
                    twoFactorSetupMode === 'manual'
                      ? 'twofactor-toggle-btn twofactor-toggle-btn--active'
                      : 'twofactor-toggle-btn'
                  }
                  onClick={() => setTwoFactorSetupMode('manual')}
                >
                  Secret key
                </button>
              </div>
              <p className="twofactor-setup-subtitle">
                Scan the QR code with your authenticator app, or switch to "Secret key" to enter it manually.
              </p>
            </div>

            {twoFactorSetupMode === 'qr' && (
              <div className="twofactor-qr-section">
                {twoFactorOtpauthUrl ? (
                  <div className="twofactor-qr-box">
                    <QRCodeCanvas
                      value={twoFactorOtpauthUrl}
                      size={160}
                      includeMargin={true}
                    />
                  </div>
                ) : (
                  <p className="twofactor-helper-text">
                    QR data is not available. You can switch to "Secret key" instead.
                  </p>
                )}
              </div>
            )}

            {twoFactorSetupMode === 'manual' && (
              <div className="twofactor-secret-box">
                <div className="twofactor-secret-label">Secret key</div>
                <div className="twofactor-secret-value">
                  {twoFactorSecret || 'Not available'}
                </div>
                <p className="twofactor-helper-text">
                  In your authenticator app, choose "Enter key manually" and paste this secret.
                </p>
              </div>
            )}

            {/* Code entry is shared for both modes */}
            <div className="twofactor-code-row">
              <label className="twofactor-code-label">
                Enter the 6-digit code from your app to confirm:
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="ogc-input"
                value={twoFactorOtpToken}
                onChange={(e) => setTwoFactorOtpToken(e.target.value.trim())}
                placeholder="123456"
              />
            </div>

            {twoFactorError && (
              <div className="ogc-form-error" style={{ marginBottom: '0.75rem' }}>
                {twoFactorError}
              </div>
            )}

            <div className="twofactor-actions-row">
              <button
                type="button"
                className="ogc-button-primary"
                onClick={handleConfirm2FA}
                disabled={twoFactorBusy || !twoFactorOtpToken}
              >
                {twoFactorBusy ? 'Confirming…' : 'Confirm & enable'}
              </button>
              <button
                type="button"
                className="ogc-button-secondary"
                onClick={handleCancelTwoFactorSetup}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connected Accounts Section */}
      <div className="ogc-dashboard-card" style={{ marginTop: '24px' }}>
        <h2 className="ogc-dashboard-card-title">Connected Accounts</h2>
        <p className="ogc-dashboard-card-text">
          Link your social accounts to sign in faster. You can connect multiple providers to your account.
        </p>

        {user?.connectedProviders ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {['google', 'github', 'twitter', 'linkedin', 'discord'].map((provider) => {
              const isConnected = user.connectedProviders.includes(provider);
              const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
              
              return (
                <div
                  key={provider}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: '500' }}>{providerName}</span>
                    {isConnected && (
                      <span style={{ fontSize: '0.85em', color: 'var(--accent-primary)', opacity: 0.9 }}>
                        ✓ Connected
                      </span>
                    )}
                  </div>
                  {isConnected ? (
                    <button
                      type="button"
                      className="ogc-button-secondary"
                      style={{ fontSize: '0.9em', padding: '6px 12px' }}
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to disconnect your ${providerName} account?`)) {
                          return;
                        }
                        try {
                          await api.post(`/auth/oauth/disconnect/${provider}`);
                          // Refresh user data to update connectedProviders
                          const meData = await api.get('/auth/me');
                          if (meData && meData.user) {
                            // Update will happen via AuthContext useEffect
                            window.location.reload(); // Simple refresh for now
                          }
                        } catch (err) {
                          alert(err?.message || `Failed to disconnect ${providerName} account.`);
                        }
                      }}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ogc-button-primary"
                      style={{ fontSize: '0.9em', padding: '6px 12px' }}
                      onClick={() => {
                        // Redirect to connect endpoint
                        window.location.href = `${API_BASE_URL}/auth/oauth/connect/${provider}`;
                      }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="security-muted" style={{ marginTop: '0.5rem' }}>
            Loading connected accounts...
          </p>
        )}
      </div>

      {/* Recovery codes Section (Phase S5) */}
      <div className="ogc-dashboard-card" style={{ marginTop: '24px' }}>
        <h2 className="ogc-dashboard-card-title">Recovery codes</h2>
        <p className="ogc-dashboard-card-text">
          Use recovery codes if you lose access to your authenticator app. Each code can be used once.
        </p>

        <p className="ogc-dashboard-card-text" style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.5rem' }}>
          Status:&nbsp;
          {recoveryCodes && recoveryCodes.length > 0 ? (
            <>
              {recoveryCodes.filter((c) => !c.used).length} unused codes,&nbsp;
              {recoveryCodes.filter((c) => c.used).length} used.
            </>
          ) : (
            'No recovery codes generated yet.'
          )}
        </p>

        <button
          type="button"
          className="ogc-button-secondary"
          onClick={openRecoveryModal}
        >
          {recoveryCodes && recoveryCodes.length > 0
            ? 'View / regenerate recovery codes'
            : 'Generate recovery codes'}
        </button>
      </div>

      {/* Download Your Data Section */}
      <div className="ogc-dashboard-card security-privacy-export" style={{ marginTop: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Download your data</h2>
        <p className="ogc-dashboard-card-text">
          Export a copy of your account data, including profile details, sessions, and
          recent security activity, as a JSON file.
        </p>

        <button
          type="button"
          className="ogc-button-primary"
          onClick={handleDownloadData}
          disabled={exportBusy}
        >
          {exportBusy ? "Preparing export…" : "Download my data"}
        </button>

        {exportError && (
          <div className="ogc-form-message ogc-form-message--error" style={{ marginTop: "0.75rem" }}>
            {exportError}
          </div>
        )}
        {exportSuccess && !exportError && (
          <div className="ogc-form-message ogc-form-message--success" style={{ marginTop: "0.75rem" }}>
            Your data export has started downloading.
          </div>
        )}
      </div>

      {/* Delete Account Section */}
      <div className="ogc-dashboard-card security-danger-zone" style={{ marginTop: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Delete account</h2>
        <p className="ogc-dashboard-card-text" style={{ marginBottom: "16px" }}>
          This action is permanent and cannot be undone. All your sessions will be
          revoked and you will lose access to this account.
        </p>

        <button
          type="button"
          className="ogc-button-danger"
          onClick={openDeleteModal}
        >
          Delete my account
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="ogc-modal-backdrop">
          <div className="ogc-modal">
            <h2 className="ogc-modal-title">Delete your account</h2>
            <p className="ogc-modal-text">
              This action is <strong>permanent</strong>. Your profile, sessions, and
              account data will be deleted. Security logs will be anonymized for
              fraud and abuse prevention.
            </p>

            <div className="ogc-modal-section">
              <label className="ogc-modal-label">Current password</label>
              <input
                type="password"
                className="ogc-input"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>

            {/* Optional 2FA input — safe even if 2FA is disabled */}
            <div className="ogc-modal-section">
              <label className="ogc-modal-label">
                Two-factor code (if 2FA is enabled)
              </label>
              <input
                type="text"
                className="ogc-input"
                inputMode="numeric"
                maxLength={6}
                value={deleteOtp}
                onChange={(e) => setDeleteOtp(e.target.value)}
                placeholder="123456"
              />
            </div>

            <div className="ogc-modal-section">
              <label className="ogc-modal-label">
                Type <code>DELETE</code> to confirm
              </label>
              <input
                type="text"
                className="ogc-input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            {deleteError && (
              <div className="ogc-form-message ogc-form-message--error">
                {deleteError}
              </div>
            )}

            <div className="ogc-modal-actions">
              <button
                type="button"
                className="ogc-button-secondary"
                onClick={closeDeleteModal}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ogc-button-danger"
                onClick={handleConfirmDeleteAccount}
                disabled={!deleteFormValid || deleteBusy}
              >
                {deleteBusy ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recovery codes Modal (Phase S5) */}
      {showRecoveryModal && (
        <div className="ogc-modal-backdrop">
          <div className="ogc-modal">
            <h2 className="ogc-modal-title">2FA recovery codes</h2>
            <p className="ogc-modal-text">
              Store these codes somewhere safe (password manager, secure notes, or offline file).
              Each code can be used once if you lose access to your authenticator app.
            </p>

            <div className="ogc-modal-section">
              <button
                type="button"
                className="ogc-button-primary"
                onClick={handleGenerateRecoveryCodes}
                disabled={recoveryBusy}
              >
                {recoveryBusy ? 'Generating…' : 'Generate new codes'}
              </button>
              <p className="ogc-modal-helper">
                Generating new codes will invalidate any existing unused codes.
              </p>
            </div>

            {recoveryError && (
              <div className="ogc-form-message ogc-form-message--error">
                {recoveryError}
              </div>
            )}

            {freshRecoveryCodes.length > 0 && (
              <div className="twofactor-recovery-list">
                <p className="ogc-modal-text" style={{ marginBottom: '0.4rem' }}>
                  Copy or download these codes now. You won't be able to see them again.
                </p>
                <div className="twofactor-recovery-codes">
                  {freshRecoveryCodes.map((code) => (
                    <div key={code} className="twofactor-recovery-code-item">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="twofactor-recovery-actions">
                  <button
                    type="button"
                    className="ogc-button-secondary"
                    onClick={handleDownloadRecoveryCodes}
                  >
                    Download as text file
                  </button>
                </div>
              </div>
            )}

            <div className="ogc-modal-actions">
              <button
                type="button"
                className="ogc-button-secondary"
                onClick={closeRecoveryModal}
                disabled={recoveryBusy}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Security;

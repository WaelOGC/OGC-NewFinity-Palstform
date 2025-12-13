import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAdminSettings, updateAdminSetting } from "../../utils/apiClient.js";
import { hasAdminPermission, ADMIN_SETTINGS_READ, ADMIN_SETTINGS_WRITE } from "../../utils/adminPermissions.js";
import AdminNotAuthorized from "./AdminNotAuthorized.jsx";
import "../../styles/plasmaAdminUI.css";
import "./admin-settings-page.css";

function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [localSettings, setLocalSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saveReason, setSaveReason] = useState("");
  const [changedKeys, setChangedKeys] = useState(new Set());

  // Permission checks
  const canRead = hasAdminPermission(user, ADMIN_SETTINGS_READ);
  const canWrite = hasAdminPermission(user, ADMIN_SETTINGS_WRITE);

  // Fetch settings on mount
  useEffect(() => {
    if (!canRead) {
      setLoading(false);
      return;
    }

    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead]);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAdminSettings();
      
      // Backend returns: { settings: { key: { value, type, default, ... } } }
      const settingsObj = data.settings || {};
      
      setSettings(settingsObj);
      setLocalSettings(settingsObj);
      setChangedKeys(new Set());
    } catch (err) {
      console.error("Error fetching settings:", err);
      
      if (err?.httpStatus === 403) {
        setError("You don't have permission to view settings.");
      } else if (err?.httpStatus === 429) {
        setError("Rate limit exceeded. Try again shortly.");
      } else {
        setError(err?.message || "Failed to load settings. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  // Check if a setting has changed
  const isDirty = (key) => {
    if (!settings || !localSettings[key]) return false;
    const original = settings[key]?.value;
    const current = localSettings[key]?.value;
    
    // Handle undefined/null cases
    if (original === undefined && current === undefined) return false;
    if (original === undefined || current === undefined) return true;
    
    // Handle different types
    if (typeof original === 'boolean' && typeof current === 'boolean') {
      return original !== current;
    }
    if (typeof original === 'number' && typeof current === 'number') {
      return original !== current;
    }
    if (typeof original === 'string' && typeof current === 'string') {
      return original.trim() !== current.trim();
    }
    return original !== current;
  };

  // Check if any setting is dirty
  const hasChanges = () => {
    const keys = ['maintenance_mode', 'maintenance_message', 'feature_signup_enabled', 'rate_limit_multiplier', 'security_force_2fa_admins'];
    return keys.some(key => isDirty(key));
  };

  // Update local state for a setting
  const updateLocalSetting = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));

    // Track changed keys
    const newChangedKeys = new Set(changedKeys);
    if (isDirty(key)) {
      newChangedKeys.add(key);
    } else {
      newChangedKeys.delete(key);
    }
    setChangedKeys(newChangedKeys);
  };

  // Handle save
  const handleSave = async () => {
    if (!canWrite || !hasChanges()) return;

    // Check if maintenance_mode is being enabled
    const enablingMaintenance = 
      localSettings.maintenance_mode?.value === true && 
      settings?.maintenance_mode?.value === false;

    if (enablingMaintenance) {
      setShowConfirmModal(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    if (!canWrite) return;

    try {
      setSaving(true);
      setSaveError(null);

      // Get all changed keys
      const keysToUpdate = Array.from(changedKeys).filter(key => isDirty(key));
      
      if (keysToUpdate.length === 0) {
        setSaving(false);
        return;
      }

      // Save each key sequentially
      const results = [];
      for (const key of keysToUpdate) {
        try {
          const value = localSettings[key]?.value;
          await updateAdminSetting(key, value, saveReason || undefined);
          results.push({ key, success: true });
        } catch (err) {
          console.error(`Error updating ${key}:`, err);
          results.push({ 
            key, 
            success: false, 
            error: err?.message || `Failed to update ${key}` 
          });
        }
      }

      // Check for failures
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        const errorMessages = failures.map(f => `${f.key}: ${f.error}`).join('; ');
        setSaveError(`Some settings failed to save: ${errorMessages}`);
      }

      // Re-fetch settings to get server truth
      await fetchSettings();
      
      // Clear save reason
      setSaveReason("");
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Error saving settings:", err);
      
      if (err?.httpStatus === 403) {
        setSaveError("You don't have permission to modify settings.");
      } else if (err?.httpStatus === 429) {
        setSaveError("Rate limit exceeded. Try again shortly.");
      } else {
        setSaveError(err?.message || "Failed to save settings. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (!settings) return;
    setLocalSettings(settings);
    setChangedKeys(new Set());
    setSaveReason("");
  };

  // Handle maintenance mode toggle
  const handleMaintenanceModeToggle = (enabled) => {
    updateLocalSetting('maintenance_mode', enabled);
  };

  // Validate rate limit multiplier
  const validateRateLimit = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    return num >= 0.1 && num <= 10;
  };

  // Handle rate limit multiplier change
  const handleRateLimitChange = (value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0.1 && num <= 10) {
      updateLocalSetting('rate_limit_multiplier', num);
    } else if (value === '' || value === '-') {
      // Allow empty or minus for typing
      updateLocalSetting('rate_limit_multiplier', value);
    }
  };

  // Show not authorized if no read permission
  if (!canRead) {
    return <AdminNotAuthorized />;
  }

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <div>
          <h1>Platform Settings</h1>
          <p className="admin-settings-subtitle">
            Manage global platform configuration and feature toggles
          </p>
        </div>
      </div>

      {/* Read-only banner if no write permission */}
      {!canWrite && (
        <div className="admin-settings-readonly-banner plasma-panel">
          <div className="admin-settings-readonly-banner-icon">🔒</div>
          <div className="admin-settings-readonly-banner-content">
            <div className="admin-settings-readonly-banner-title">Read-only</div>
            <div className="admin-settings-readonly-banner-subtitle">
              You have read-only access to settings. Contact an administrator to make changes.
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="admin-settings-error-banner">
          <div className="admin-settings-error-icon">⚠️</div>
          <div className="admin-settings-error-content">
            <div className="admin-settings-error-title">Error Loading Settings</div>
            <div className="admin-settings-error-message">{error}</div>
            <button onClick={fetchSettings} className="plasma-button plasma-button--ghost">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Save error banner */}
      {saveError && (
        <div className="admin-settings-error-banner">
          <div className="admin-settings-error-icon">⚠️</div>
          <div className="admin-settings-error-content">
            <div className="admin-settings-error-title">Save Error</div>
            <div className="admin-settings-error-message">{saveError}</div>
            <button onClick={() => setSaveError(null)} className="plasma-button plasma-button--ghost">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !settings && (
        <div className="admin-settings-loading">
          <p>Loading settings...</p>
        </div>
      )}

      {/* Settings content */}
      {!loading && settings && (
        <div className="admin-settings-content">
          {/* Maintenance Mode Section */}
          <div className="admin-settings-section plasma-panel--raised">
            <div className="admin-settings-section-header">
              <h2 className="admin-settings-section-title">Maintenance Mode</h2>
              <p className="admin-settings-section-description">
                Enable maintenance mode to temporarily disable access for all users
              </p>
            </div>
            
            <div className="admin-settings-controls">
              <div className="admin-settings-control-row">
                <div className="admin-settings-control-label-group">
                  <label className="admin-settings-control-label">Maintenance Mode</label>
                  <span className="admin-settings-control-description">
                    When enabled, all users will see a maintenance message
                  </span>
                </div>
                <div className="admin-settings-control-input-group">
                  <label className="admin-settings-toggle">
                    <input
                      type="checkbox"
                      checked={localSettings.maintenance_mode?.value || false}
                      onChange={(e) => handleMaintenanceModeToggle(e.target.checked)}
                      disabled={!canWrite}
                    />
                    <span className="admin-settings-toggle-slider"></span>
                  </label>
                  {isDirty('maintenance_mode') && (
                    <span className="admin-settings-dirty-indicator">●</span>
                  )}
                </div>
              </div>

              <div className="admin-settings-control-row">
                <div className="admin-settings-control-label-group">
                  <label className="admin-settings-control-label">Maintenance Message</label>
                  <span className="admin-settings-control-description">
                    Message displayed to users during maintenance
                  </span>
                </div>
                <div className="admin-settings-control-input-group">
                  <input
                    type="text"
                    className="plasma-field"
                    value={localSettings.maintenance_message?.value || ""}
                    onChange={(e) => updateLocalSetting('maintenance_message', e.target.value)}
                    disabled={!canWrite || !localSettings.maintenance_mode?.value}
                    placeholder="We'll be back soon."
                  />
                  {isDirty('maintenance_message') && (
                    <span className="admin-settings-dirty-indicator">●</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Access & Signup Section */}
          <div className="admin-settings-section plasma-panel--raised">
            <div className="admin-settings-section-header">
              <h2 className="admin-settings-section-title">Access & Signup</h2>
              <p className="admin-settings-section-description">
                Control user registration and security requirements
              </p>
            </div>
            
            <div className="admin-settings-controls">
              <div className="admin-settings-control-row">
                <div className="admin-settings-control-label-group">
                  <label className="admin-settings-control-label">Enable Signup</label>
                  <span className="admin-settings-control-description">
                    Allow new users to register accounts
                  </span>
                </div>
                <div className="admin-settings-control-input-group">
                  <label className="admin-settings-toggle">
                    <input
                      type="checkbox"
                      checked={localSettings.feature_signup_enabled?.value || false}
                      onChange={(e) => updateLocalSetting('feature_signup_enabled', e.target.checked)}
                      disabled={!canWrite}
                    />
                    <span className="admin-settings-toggle-slider"></span>
                  </label>
                  {isDirty('feature_signup_enabled') && (
                    <span className="admin-settings-dirty-indicator">●</span>
                  )}
                </div>
              </div>

              <div className="admin-settings-control-row">
                <div className="admin-settings-control-label-group">
                  <label className="admin-settings-control-label">Force 2FA for Admins</label>
                  <span className="admin-settings-control-description">
                    Require two-factor authentication for all admin users
                  </span>
                </div>
                <div className="admin-settings-control-input-group">
                  <label className="admin-settings-toggle">
                    <input
                      type="checkbox"
                      checked={localSettings.security_force_2fa_admins?.value || false}
                      onChange={(e) => updateLocalSetting('security_force_2fa_admins', e.target.checked)}
                      disabled={!canWrite}
                    />
                    <span className="admin-settings-toggle-slider"></span>
                  </label>
                  {isDirty('security_force_2fa_admins') && (
                    <span className="admin-settings-dirty-indicator">●</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rate Limiting Section */}
          <div className="admin-settings-section plasma-panel--raised">
            <div className="admin-settings-section-header">
              <h2 className="admin-settings-section-title">Rate Limiting</h2>
              <p className="admin-settings-section-description">
                Adjust rate limit multiplier (0.1 to 10.0)
              </p>
            </div>
            
            <div className="admin-settings-controls">
              <div className="admin-settings-control-row">
                <div className="admin-settings-control-label-group">
                  <label className="admin-settings-control-label">Rate Limit Multiplier</label>
                  <span className="admin-settings-control-description">
                    Multiplier for API rate limits (1.0 = default, 0.1 = 10x stricter, 10.0 = 10x more lenient)
                  </span>
                </div>
                <div className="admin-settings-control-input-group">
                  <input
                    type="number"
                    className="plasma-field"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={localSettings.rate_limit_multiplier?.value ?? 1}
                    onChange={(e) => handleRateLimitChange(e.target.value)}
                    disabled={!canWrite}
                  />
                  {isDirty('rate_limit_multiplier') && (
                    <span className="admin-settings-dirty-indicator">●</span>
                  )}
                  {localSettings.rate_limit_multiplier?.value !== undefined && 
                   !validateRateLimit(localSettings.rate_limit_multiplier?.value) && (
                    <span className="admin-settings-validation-error">
                      Must be between 0.1 and 10.0
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {canWrite && (
            <div className="admin-settings-actions">
              <button
                onClick={handleReset}
                disabled={!hasChanges() || saving}
                className="plasma-button plasma-button--ghost"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges() || saving || (localSettings.rate_limit_multiplier?.value !== undefined && !validateRateLimit(localSettings.rate_limit_multiplier?.value))}
                className="plasma-button plasma-button--primary"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal for Maintenance Mode */}
      {showConfirmModal && (
        <div className="admin-settings-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="admin-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-settings-modal-header">
              <h3>Enable Maintenance Mode?</h3>
            </div>
            <div className="admin-settings-modal-body">
              <p>This will impact all users. Continue?</p>
              <div className="admin-settings-modal-reason">
                <label className="admin-settings-modal-reason-label">
                  Reason (optional):
                </label>
                <textarea
                  className="plasma-field"
                  value={saveReason}
                  onChange={(e) => setSaveReason(e.target.value)}
                  placeholder="e.g., Emergency maintenance, scheduled update..."
                  rows={3}
                />
              </div>
            </div>
            <div className="admin-settings-modal-actions">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSaveReason("");
                }}
                className="plasma-button plasma-button--ghost"
              >
                Cancel
              </button>
              <button
                onClick={performSave}
                disabled={saving}
                className="plasma-button plasma-button--primary"
              >
                {saving ? "Saving..." : "Enable Maintenance Mode"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettingsPage;

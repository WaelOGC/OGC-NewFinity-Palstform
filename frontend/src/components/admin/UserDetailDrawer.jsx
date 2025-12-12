import { useState, useEffect } from "react";
import { fetchAdminUserDetail, toggleAdminUserStatus } from "../../utils/apiClient.js";
import "./user-detail-drawer.css";

function UserDetailDrawer({ userId, isOpen, onClose, onUserStatusChange }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDetail();
    } else {
      // Reset state when drawer closes
      setUser(null);
      setError(null);
    }
  }, [isOpen, userId]);

  const loadUserDetail = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchAdminUserDetail(userId);
      setUser(response.data);
    } catch (err) {
      console.error("Error loading user detail:", err);
      setError(err?.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatProviderName = (provider) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    const action = user.accountStatus === 'ACTIVE' ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setToggling(true);
    setError(null);

    try {
      const response = await toggleAdminUserStatus(userId);
      const newStatus = response.data.accountStatus;
      
      // Update the user state with new accountStatus
      setUser(prev => ({
        ...prev,
        accountStatus: newStatus
      }));

      // Propagate the status change to parent component
      if (onUserStatusChange) {
        onUserStatusChange(userId, newStatus);
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
      setError(err?.message || "Failed to toggle user status");
    } finally {
      setToggling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="user-detail-drawer-backdrop" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className={`user-detail-drawer ${isOpen ? 'user-detail-drawer-open' : ''}`}>
        <div className="user-detail-drawer-header">
          <h2 className="user-detail-drawer-title">User Details</h2>
          <button 
            className="user-detail-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        <div className="user-detail-drawer-content">
          {loading && (
            <div className="user-detail-drawer-loading">
              Loading user details...
            </div>
          )}

          {error && (
            <div className="user-detail-drawer-error">
              {error}
            </div>
          )}

          {!loading && !error && user && (
            <div className="user-detail-drawer-info">
              {/* Full Name */}
              <div className="user-detail-drawer-field">
                <label className="user-detail-drawer-label">Full Name</label>
                <div className="user-detail-drawer-value">
                  {user.fullName || "No name"}
                </div>
              </div>

              {/* Email */}
              <div className="user-detail-drawer-field">
                <label className="user-detail-drawer-label">Email</label>
                <div className="user-detail-drawer-value">
                  {user.email || "No email"}
                </div>
              </div>

              {/* Username (if available) */}
              {user.username && (
                <div className="user-detail-drawer-field">
                  <label className="user-detail-drawer-label">Username</label>
                  <div className="user-detail-drawer-value">
                    @{user.username}
                  </div>
                </div>
              )}

              {/* Role */}
              <div className="user-detail-drawer-field">
                <label className="user-detail-drawer-label">Role</label>
                <div className="user-detail-drawer-value">
                  {user.role || "STANDARD_USER"}
                </div>
              </div>

              {/* Account Status */}
              <div className="user-detail-drawer-field">
                <label className="user-detail-drawer-label">Account Status</label>
                <div className="user-detail-drawer-value">
                  {user.accountStatus || "ACTIVE"}
                </div>
                {/* Toggle button - only show for non-FOUNDER users with ACTIVE or DISABLED status */}
                {user.role !== 'FOUNDER' && (user.accountStatus === 'ACTIVE' || user.accountStatus === 'DISABLED') && (
                  <button
                    className={`user-detail-drawer-toggle-btn ${
                      user.accountStatus === 'ACTIVE' 
                        ? 'user-detail-drawer-toggle-btn-disable' 
                        : 'user-detail-drawer-toggle-btn-enable'
                    }`}
                    onClick={handleToggleStatus}
                    disabled={toggling || loading}
                  >
                    {toggling 
                      ? 'Processing...' 
                      : user.accountStatus === 'ACTIVE' 
                        ? 'Disable User' 
                        : 'Enable User'
                    }
                  </button>
                )}
              </div>

              {/* Created Date */}
              <div className="user-detail-drawer-field">
                <label className="user-detail-drawer-label">Created At</label>
                <div className="user-detail-drawer-value">
                  {formatDate(user.createdAt)}
                </div>
              </div>

              {/* Last Active (if available) */}
              {user.lastLoginAt && (
                <div className="user-detail-drawer-field">
                  <label className="user-detail-drawer-label">Last Active</label>
                  <div className="user-detail-drawer-value">
                    {formatDate(user.lastLoginAt)}
                  </div>
                </div>
              )}

              {/* Connected Providers (if available) */}
              {user.connectedProviders && user.connectedProviders.length > 0 && (
                <div className="user-detail-drawer-field">
                  <label className="user-detail-drawer-label">Connected Providers</label>
                  <div className="user-detail-drawer-providers">
                    {user.connectedProviders.map((provider) => (
                      <span 
                        key={provider} 
                        className="user-detail-drawer-provider-badge"
                      >
                        {formatProviderName(provider)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && !user && (
            <div className="user-detail-drawer-empty">
              No user data available
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default UserDetailDrawer;

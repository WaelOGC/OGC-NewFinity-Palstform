import { useState, useEffect, useRef } from "react";
import { fetchAdminUserDetail, toggleAdminUserStatus } from "../../utils/apiClient.js";
import "./user-detail-drawer.css";

function UserDetailDrawer({ userId, isOpen, onClose, onUserStatusChange }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const drawerRef = useRef(null);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      // Focus the drawer when it opens
      const firstFocusable = drawerRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen]);

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

  // Don't render when closed to prevent click capture
  if (!isOpen) {
    return null;
  }

  // Ensure onClose is a function
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="user-detail-drawer-backdrop" 
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="user-detail-drawer user-detail-drawer-open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-detail-drawer-header">
          <h2 id="user-detail-drawer-title" className="user-detail-drawer-title">User Details</h2>
          <button 
            className="user-detail-drawer-close"
            onClick={handleClose}
            aria-label="Close drawer"
            type="button"
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
                  <span className="user-detail-drawer-role-chip">
                    {user.role || "STANDARD_USER"}
                  </span>
                </div>
              </div>

              {/* Account Status */}
              <div className="user-detail-drawer-field">
                <label className="user-detail-drawer-label">Account Status</label>
                <div className="user-detail-drawer-value">
                  <span className={`user-detail-drawer-status-chip ${
                    user.accountStatus === 'ACTIVE' 
                      ? 'user-detail-drawer-status-chip-active'
                      : user.accountStatus === 'SUSPENDED'
                      ? 'user-detail-drawer-status-chip-suspended'
                      : user.accountStatus === 'BANNED'
                      ? 'user-detail-drawer-status-chip-banned'
                      : ''
                  }`}>
                    {user.accountStatus || "ACTIVE"}
                  </span>
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

          {!loading && !error && !user && userId && (
            <div className="user-detail-drawer-empty">
              Loading user details...
            </div>
          )}

          {!loading && !error && !user && !userId && (
            <div className="user-detail-drawer-empty">
              Select a user to view details.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default UserDetailDrawer;

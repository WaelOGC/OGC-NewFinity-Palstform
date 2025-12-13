import { useState, useEffect } from "react";
import { getAdminRoles } from "../../utils/apiClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasAdminPermission, ADMIN_ROLES_READ } from "../../utils/adminPermissions.js";
import AdminNotAuthorized from "./AdminNotAuthorized.jsx";
import "../../styles/plasmaAdminUI.css";
import "./admin-roles-page.css";

/**
 * Convert permission constant to friendly display label
 * Examples: ADMIN_USERS_READ → USERS: READ
 */
function formatPermissionLabel(permission) {
  if (!permission || permission === '*') {
    return 'ALL PERMISSIONS';
  }
  
  // Remove leading ADMIN_ prefix if present
  let label = permission.replace(/^ADMIN_/, '');
  
  // Replace underscores with spaces
  label = label.replace(/_/g, ' ');
  
  // Convert to title case and handle READ/WRITE suffix
  const parts = label.split(' ');
  if (parts.length > 1 && (parts[parts.length - 1] === 'READ' || parts[parts.length - 1] === 'WRITE')) {
    const action = parts.pop();
    const resource = parts.join(' ');
    return `${resource}: ${action}`;
  }
  
  return label;
}

/**
 * Get tier badge label for role
 */
function getTierBadge(roleId) {
  const roleLower = roleId.toLowerCase();
  if (roleLower === 'founder') return 'FULL ACCESS';
  if (roleLower === 'admin') return 'ADMIN ACCESS';
  return 'READ ONLY';
}

/**
 * Get card emphasis class for role
 */
function getCardClass(roleId) {
  const roleLower = roleId.toLowerCase();
  if (roleLower === 'founder') return 'role-card--founder';
  if (roleLower === 'admin') return 'role-card--admin';
  return 'role-card--readonly';
}

function AdminRolesPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user has permission to view roles
  const canViewRoles = hasAdminPermission(user, ADMIN_ROLES_READ);

  const fetchRoles = async () => {
    if (!canViewRoles) {
      setError("You do not have permission to view roles.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getAdminRoles();

      // Backend returns: { roles: [...] }
      setRoles(data.roles || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      // Check for permission denied error
      if (err?.code === 'PERMISSION_DENIED' || err?.httpStatus === 403) {
        setError("You do not have permission to view roles.");
      } else {
        setError(err?.message || "Failed to load roles. Please try again.");
      }
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial fetch only

  // Show not authorized if user doesn't have permission
  if (!canViewRoles) {
    return <AdminNotAuthorized />;
  }

  return (
    <div className="admin-roles-page">
      <div className="admin-roles-header">
        <div>
          <h1>Roles Management</h1>
          <p className="admin-roles-subtitle">View role definitions and permission mappings</p>
        </div>
      </div>

      {/* Read-only Banner */}
      <div className="admin-roles-readonly-banner plasma-panel">
        <div className="admin-roles-readonly-banner-icon">🔒</div>
        <div className="admin-roles-readonly-banner-content">
          <div className="admin-roles-readonly-banner-title">Read-only</div>
          <div className="admin-roles-readonly-banner-subtitle">
            Roles and permissions are defined by the system. Editing will be added later.
          </div>
        </div>
      </div>

      {loading && roles.length === 0 && (
        <div className="admin-roles-loading">
          <p>Loading roles...</p>
        </div>
      )}

      {error && roles.length === 0 && (
        <div className="admin-roles-error">
          <h3 className="admin-roles-error-title">Unable to load roles</h3>
          <p className="admin-roles-error-message">{error}</p>
          <button onClick={fetchRoles} className="plasma-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && roles.length === 0 && (
        <div className="admin-roles-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-roles-empty-icon">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h3 className="admin-roles-empty-state-title">No roles found</h3>
          <p className="admin-roles-empty-state-message">
            There are no roles to display.
          </p>
        </div>
      )}

      {!loading && !error && roles.length > 0 && (
        <div className="admin-roles-content">
          <div className="admin-roles-grid">
            {roles.map((role) => (
              <div key={role.id} className={`admin-role-card plasma-panel--raised ${getCardClass(role.id)}`}>
                <div className="admin-role-card-header">
                  <div className="admin-role-card-title-section">
                    <h3 className="admin-role-card-title">{role.label}</h3>
                    <span className="admin-role-tier-badge">
                      {getTierBadge(role.id)}
                    </span>
                  </div>
                </div>
                <p className="admin-role-card-description">{role.description}</p>
                <div className="admin-role-card-permissions">
                  <h4 className="admin-role-card-permissions-title">Permissions</h4>
                  {role.permissions && role.permissions.length > 0 ? (
                    role.permissions[0] === '*' ? (
                      <div className="admin-role-permission-chip admin-role-permission-chip--primary">
                        ALL PERMISSIONS
                      </div>
                    ) : (
                      <div className="admin-role-permissions-list">
                        {role.permissions.map((permission, idx) => (
                          <span key={idx} className="admin-role-permission-chip admin-role-permission-chip--active">
                            {formatPermissionLabel(permission)}
                          </span>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="admin-role-permissions-empty">No permissions assigned</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRolesPage;

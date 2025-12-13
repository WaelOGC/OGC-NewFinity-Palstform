import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasAdminPermission, ADMIN_USERS_READ } from "../../utils/adminPermissions.js";
import AdminNotAuthorized from "./AdminNotAuthorized.jsx";

/**
 * Normalize user object to ensure consistent field names
 * Handles variations in backend response (lastLoginAt vs lastLogin, roles vs role, etc.)
 */
function normalizeAdminUser(u) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName || u.fullName || null,
    roles: u.roles || (u.role ? [u.role] : []),
    accountStatus: u.accountStatus || u.status || null,
    lastLoginAt: u.lastLoginAt || u.lastLogin || null,
    createdAt: u.createdAt,
    // Preserve other fields
    ...u,
  };
}

function AdminUserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [user, setUser] = useState(null);
  const [degradedMode, setDegradedMode] = useState(false);
  
  // Check if user has permission to view user details
  const canViewUserDetails = hasAdminPermission(currentUser, ADMIN_USERS_READ);

  const fetchUserDetail = async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      // Use fetch directly to check for degraded mode header
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      // Check degraded mode header
      const adminMode = response.headers.get('x-admin-mode');
      if (adminMode === 'degraded') {
        setDegradedMode(true);
      }

      const text = await response.text();
      const data = JSON.parse(text);

      // Handle error responses
      if (!response.ok || data?.status === 'ERROR') {
        const errorCode = data?.code;
        const httpStatus = response.status;

        // Handle 404 specifically
        if (httpStatus === 404 || errorCode === 'ADMIN_USER_NOT_FOUND') {
          setNotFound(true);
          setError(null);
          return;
        }

        // Handle 401/403
        if (httpStatus === 401 || httpStatus === 403 || errorCode === 'AUTH_REQUIRED' || errorCode === 'ADMIN_REQUIRED') {
          // These will be handled by showing AdminNotAuthorized
          setError(data?.message || 'Access denied');
          return;
        }

        // Other errors
        throw new Error(data?.message || 'Failed to fetch user details');
      }

      // Extract user from response
      const responseData = data?.data || data;
      const userData = responseData?.user || responseData;

      if (userData) {
        // Normalize user object to ensure consistent field names
        setUser(normalizeAdminUser(userData));
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      
      // Check if it's an authorization error
      if (err.httpStatus === 401 || err.httpStatus === 403 || err.code === 'AUTH_REQUIRED' || err.code === 'ADMIN_REQUIRED') {
        setError(err.message || 'Access denied');
        return;
      }

      setError(err.message || err.backendMessage || "Failed to load user details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleRetry = () => {
    fetchUserDetail();
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      return null;
    }
  };

  const formatRoleLabel = (role) => {
    const labels = {
      FOUNDER: "Founder",
      CORE_TEAM: "Core Team",
      ADMIN: "Admin",
      MODERATOR: "Moderator",
      CREATOR: "Creator",
      STANDARD_USER: "Standard User",
      SUSPENDED: "Suspended",
      BANNED: "Banned",
    };
    return labels[role] || role;
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Unknown";
    return status.toUpperCase();
  };

  // Handle authorization errors
  if (error && (error.includes('Access denied') || error.includes('permission') || error.includes('AUTH_REQUIRED') || error.includes('ADMIN_REQUIRED'))) {
    return <AdminNotAuthorized />;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      {/* Degraded mode banner */}
      {degradedMode && (
        <div style={{
          backgroundColor: '#ff9800',
          color: 'white',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          ⚠️ User details are operating in degraded mode. Some information may be limited.
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary, #666)' }}>
          <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Loading user details...</div>
          <div style={{ fontSize: '0.875rem' }}>Please wait</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-error, #fee)',
          border: '1px solid var(--border-error, #fcc)',
          borderRadius: '4px',
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-error, #c00)' }}>Error Loading User Details</h3>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary, #666)' }}>{error}</p>
          <button
            onClick={handleRetry}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--primary, #0066cc)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Not found state */}
      {notFound && !loading && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
        }}>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary, #333)' }}>User Not Found</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary, #666)' }}>
            The user with ID {userId} could not be found.
          </p>
          <button
            onClick={() => navigate('/admin/users')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--primary, #0066cc)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to Users
          </button>
        </div>
      )}

      {/* Success state */}
      {user && !loading && !error && !notFound && (
        <>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => navigate('/admin/users')}
              style={{
                marginBottom: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color, #ddd)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-primary, #333)'
              }}
            >
              ← Back to Users
            </button>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>User Details</h1>
            <p style={{ color: 'var(--text-secondary, #666)', fontSize: '0.875rem' }}>
              ID: {user.id || 'N/A'} {user.email && `• ${user.email}`}
            </p>
          </div>

          {/* Identity Section */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary, #f9f9f9)',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #e0e0e0)'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary, #333)' }}>Identity</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #999)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Display Name</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary, #333)' }}>
                  {user.fullName || user.displayName || 'No name'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #999)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary, #333)' }}>
                  {user.email || 'No email'}
                </div>
              </div>
              {user.username && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #999)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Username</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-primary, #333)' }}>
                    @{user.username}
                  </div>
                </div>
              )}
              {user.provider && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #999)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Provider</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-primary, #333)' }}>
                    {user.provider}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Section */}
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary, #f9f9f9)',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #e0e0e0)'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary, #333)' }}>Account</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #999)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Account Status</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary, #333)' }}>
                  {(() => {
                    const normalized = normalizeAdminUser(user);
                    return formatStatusLabel(normalized.accountStatus);
                  })()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #999)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Roles</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary, #333)' }}>
                  {(() => {
                    const normalized = normalizeAdminUser(user);
                    if (normalized.roles.length === 0) {
                      return <span style={{ color: 'var(--text-secondary, #999)', fontStyle: 'italic' }}>None</span>;
                    }
                    return (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {normalized.roles.map((role, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'var(--primary-light, #e3f2fd)',
                              color: 'var(--primary, #0066cc)',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}
                          >
                            {formatRoleLabel(role)}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #999)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Created At</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary, #333)' }}>
                  {formatDate(user.createdAt) || 'Unknown'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #999)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Last Login</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary, #333)' }}>
                  {(() => {
                    const normalized = normalizeAdminUser(user);
                    return formatDate(normalized.lastLoginAt) || 'Never';
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminUserDetailPage;
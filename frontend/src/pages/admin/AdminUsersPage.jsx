import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAdminUsers } from "../../utils/apiClient.js";
import UserDetailDrawer from "../../components/admin/UserDetailDrawer.jsx";
import "../../styles/plasmaAdminUI.css";
import "./admin-users-page.css";

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

function AdminUsersPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0 });
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Selected user for detail drawer
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Track which user's email was copied
  const [copiedUserId, setCopiedUserId] = useState(null);
  
  // Degraded mode state (if available via context or props)
  const [degradedMode, setDegradedMode] = useState(false);

  // Parallax effect for command bar
  const commandBarRef = useRef(null);
  const [parallaxStyle, setParallaxStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });

  const fetchUsers = async (page = 1, searchOverride = null, roleFilterOverride = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use fetch directly to check for degraded mode header
      const searchTerm = searchOverride !== null ? searchOverride : search;
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');
      if (searchTerm) params.set('q', searchTerm);
      
      const response = await fetch(`/api/v1/admin/users?${params.toString()}`, {
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
        const error = new Error(data?.message || 'Failed to fetch users');
        error.code = data?.code;
        error.httpStatus = response.status;
        throw error;
      }
      
      // Extract data from response
      const responseData = data?.data || data;
      
      // Backend returns: { users: [], page: 1, limit: 25, total: 0 }
      // Backend users have: { id, email, username, displayName, roles: [], accountStatus, createdAt, ... }
      if (responseData && Array.isArray(responseData.users)) {
        // Normalize user objects to ensure consistent field names
        const normalizedUsers = responseData.users.map(normalizeAdminUser);
        
        // Apply role filter on frontend if backend doesn't support it
        let filteredUsers = normalizedUsers;
        const activeRoleFilter = roleFilterOverride !== null ? roleFilterOverride : roleFilter;
        if (activeRoleFilter) {
          filteredUsers = normalizedUsers.filter(user => {
            // Check if user.role matches or if user.roles array contains the filter
            return user.role === activeRoleFilter || 
                   (Array.isArray(user.roles) && user.roles.includes(activeRoleFilter));
          });
        }
        
        // Apply status filter on frontend
        const activeStatusFilter = statusFilter;
        if (activeStatusFilter) {
          filteredUsers = filteredUsers.filter(user => {
            const userStatus = (user.accountStatus || 'ACTIVE').toUpperCase();
            return userStatus === activeStatusFilter.toUpperCase();
          });
        }
        
        setUsers(filteredUsers);
        setEmpty(filteredUsers.length === 0 && responseData.total === 0);
        setPagination({
          page: responseData.page || page,
          pageSize: responseData.limit || 25, // Backend returns 'limit', not 'pageSize'
          total: responseData.total || 0,
          totalPages: Math.ceil((responseData.total || 0) / (responseData.limit || 25)),
        });
        setError(null);
      } else if (responseData && responseData.users === undefined) {
        // Backend returned data but without users array - might be empty or error
        console.warn('Admin users response missing users array:', responseData);
        setUsers([]);
        setEmpty(true);
        setPagination({
          page: responseData.page || page,
          pageSize: responseData.limit || 25,
          total: responseData.total || 0,
          totalPages: Math.ceil((responseData.total || 0) / (responseData.limit || 25)),
        });
        setError(null);
      } else {
        setError("Failed to load users: Invalid response format");
        setEmpty(false);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setEmpty(false);
      // Check for ADMIN_REQUIRED error code
      if (err?.code === 'ADMIN_REQUIRED' || err?.backendCode === 'ADMIN_REQUIRED') {
        setError("Admin access required. You do not have permission to view this page.");
      } else {
        setError(err?.message || err?.backendMessage || "The server encountered an error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch on mount - filter changes are handled explicitly

  // Handle userId param from route (for /admin/users/:userId)
  useEffect(() => {
    if (userId) {
      const parsedUserId = parseInt(userId);
      if (!isNaN(parsedUserId)) {
        setSelectedUserId(parsedUserId);
        setDrawerOpen(true);
      }
    } else {
      // If no userId in URL, close drawer
      if (drawerOpen && !selectedUserId) {
        setDrawerOpen(false);
      }
    }
  }, [userId]);

  // Parallax effect handler
  useEffect(() => {
    const commandBar = commandBarRef.current;
    if (!commandBar) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      const rect = commandBar.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      // Normalize to -1 to 1 range
      const normalizedX = mouseX / (rect.width / 2);
      const normalizedY = mouseY / (rect.height / 2);
      
      // Apply rotation (max 3-4 degrees)
      const rotateY = normalizedX * 3;
      const rotateX = -normalizedY * 3;
      
      setParallaxStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      });
    };

    const handleMouseLeave = () => {
      setParallaxStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
      });
    };

    commandBar.addEventListener('mousemove', handleMouseMove);
    commandBar.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      commandBar.removeEventListener('mousemove', handleMouseMove);
      commandBar.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const openUserDrawer = (userId) => {
    if (!userId) {
      console.error("Invalid user ID:", userId);
      return;
    }
    setSelectedUserId(userId);
    setDrawerOpen(true);
  };

  const viewUserDetails = (userId, e) => {
    if (e) {
      e.stopPropagation();
    }
    if (!userId) {
      console.error("Invalid user ID:", userId);
      return;
    }
    // Navigate to user details page
    navigate(`/admin/users/${userId}`);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedUserId(null);
    // Navigate back to users list if we're on a detail route
    if (userId) {
      navigate('/admin/users');
    }
  };

  const handleUserStatusChange = (userId, newStatus) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? { ...u, accountStatus: newStatus }
          : u
      )
    );
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers(1, '', '');
  };

  const handleRetry = () => {
    fetchUsers(pagination.page);
  };

  const getEmptyStateMessage = () => {
    const hasSearch = search.trim() !== '';
    const hasRoleFilter = roleFilter !== '';

    if (hasSearch && hasRoleFilter) {
      return "No users match your search and role filter.";
    } else if (hasSearch) {
      return "No users match your search.";
    } else if (hasRoleFilter) {
      return "No users match this role filter.";
    }
    return "No users found.";
  };

  const getRoleBadgeClass = (role) => {
    const classes = {
      FOUNDER: "role-badge-founder",
      CORE_TEAM: "role-badge-core-team",
      ADMIN: "role-badge-admin",
      MODERATOR: "role-badge-moderator",
      CREATOR: "role-badge-creator",
      STANDARD_USER: "",
      SUSPENDED: "role-badge-suspended",
      BANNED: "role-badge-banned",
    };
    return classes[role] || "";
  };

  const getRoleLabel = (role) => {
    const labels = {
      FOUNDER: "Founder",
      CORE_TEAM: "Core Team",
      ADMIN: "Admin",
      MODERATOR: "Moderator",
      CREATOR: "Creator",
      STANDARD_USER: "Standard",
      SUSPENDED: "Suspended",
      BANNED: "Banned",
    };
    return labels[role] || role;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      ACTIVE: "status-badge-active",
      SUSPENDED: "status-badge-suspended",
      BANNED: "status-badge-banned",
    };
    return classes[status] || "";
  };

  const getStatusTooltipText = (status) => {
    const tooltips = {
      ACTIVE: "User account is active",
      DISABLED: "User account was disabled by an administrator",
    };
    return tooltips[status] || "";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (err) {
      return "Invalid date";
    }
  };

  const handleCopyEmail = async (e, email, userId) => {
    e.stopPropagation(); // Prevent opening the drawer
    
    if (!email) return;
    
    try {
      await navigator.clipboard.writeText(email);
      setCopiedUserId(userId);
      
      // Clear the feedback after 1.2 seconds
      setTimeout(() => {
        setCopiedUserId(null);
      }, 1200);
    } catch (err) {
      console.error("Failed to copy email:", err);
      // Show error feedback
      setCopiedUserId(`error-${userId}`);
      setTimeout(() => {
        setCopiedUserId(null);
      }, 1200);
    }
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>Users</h1>
          <p className="admin-users-subtitle">Search, inspect and manage platform accounts.</p>
        </div>
      </div>

      <div 
        ref={commandBarRef}
        className="plasma-command-bar plasma-panel--raised"
        style={parallaxStyle}
      >
        <div className="plasma-command-bar-search">
          <div className="plasma-field-wrapper">
            <input
              type="text"
              placeholder="Search by email, name, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPagination(prev => ({ ...prev, page: 1 }));
                  fetchUsers(1, search, roleFilter);
                }
              }}
              className="plasma-field admin-users-search"
            />
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
        </div>
        <div className="plasma-command-bar-filters">
          <div className="plasma-field-wrapper">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                fetchUsers(1);
              }}
              className="plasma-field admin-users-filter"
            >
              <option value="">All Roles</option>
              <option value="FOUNDER">Founder</option>
              <option value="CORE_TEAM">Core Team</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="CREATOR">Creator</option>
              <option value="STANDARD_USER">Standard</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div className="plasma-field-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchUsers(1);
              }}
              className="plasma-field admin-users-filter"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          {(search || roleFilter || statusFilter) && (
            <button
              onClick={handleClearFilters}
              className="plasma-button plasma-button--ghost"
              aria-label="Clear filters"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

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
          ⚠️ User management is operating in degraded mode. Some features may be limited.
        </div>
      )}

      {loading && (
        <div className="admin-users-loading" style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: 'var(--text-secondary, #666)' 
        }}>
          Loading users...
        </div>
      )}

      {error && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-error, #fee)',
          border: '1px solid var(--border-error, #fcc)',
          borderRadius: '4px',
          margin: '1rem 0'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-error, #c00)' }}>Error Loading Users</h3>
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

      {!loading && !error && (
        <>
          {(users.length === 0 || empty) ? (
            <div className="admin-users-empty-state" style={{
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                marginBottom: '0.5rem', 
                color: 'var(--text-primary, #333)' 
              }}>
                No users found
              </h3>
              <p style={{ 
                marginBottom: '1.5rem', 
                color: 'var(--text-secondary, #666)' 
              }}>
                {getEmptyStateMessage()}
              </p>
              {(search || roleFilter || statusFilter) && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--primary, #0066cc)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="admin-users-table-container">
                <table className="admin-users-table">
                  <thead>
                    <tr className="plasma-table-header">
                      <th>Name / Email</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th>Last Login</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      if (!user || !user.id) {
                        return null; // Skip invalid users
                      }
                      return (
                        <tr
                          key={user.id}
                          onClick={() => openUserDrawer(user.id)}
                          className="admin-users-table-row plasma-table-row"
                        >
                          <td>
                            <div className="admin-users-name">
                              <strong>{user.fullName || user.displayName || "No name"}</strong>
                              <div className="admin-users-email-wrapper">
                                <span className="admin-users-email">{user.email || "No email"}</span>
                                {user.email && (
                                  <>
                                    <button
                                      className="plasma-icon-button admin-users-copy-btn"
                                      onClick={(e) => handleCopyEmail(e, user.email, user.id)}
                                      aria-label="Copy email"
                                      title="Copy email"
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                      </svg>
                                    </button>
                                    {copiedUserId === user.id && (
                                      <span className="admin-users-copy-feedback">Copied!</span>
                                    )}
                                    {copiedUserId === `error-${user.id}` && (
                                      <span className="admin-users-copy-feedback admin-users-copy-feedback-error">Copy failed</span>
                                    )}
                                  </>
                                )}
                              </div>
                              {user.username && (
                                <span className="admin-users-username">@{user.username}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {(() => {
                              const normalized = normalizeAdminUser(user);
                              if (normalized.roles.length === 0) {
                                return <span style={{ color: 'var(--text-secondary, #999)', fontSize: '0.875rem' }}>—</span>;
                              }
                              const roleToShow = normalized.roles[0];
                              return (
                                <span className={`role-badge ${getRoleBadgeClass(roleToShow)}`}>
                                  {getRoleLabel(roleToShow)}
                                </span>
                              );
                            })()}
                          </td>
                          <td>
                            {(() => {
                              const normalized = normalizeAdminUser(user);
                              const status = normalized.accountStatus;
                              return (
                                <div className="status-badge-wrapper">
                                  <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                                    {status ? status.toUpperCase() : 'UNKNOWN'}
                                  </span>
                                  {getStatusTooltipText(status) && (
                                    <div className="status-tooltip">
                                      {getStatusTooltipText(status)}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td>
                            {(() => {
                              const normalized = normalizeAdminUser(user);
                              return formatDate(normalized.lastLoginAt);
                            })()}
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>
                            <button
                              onClick={(e) => viewUserDetails(user.id, e)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-color, #ddd)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: 'var(--text-primary, #333)'
                              }}
                              title="View user details"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 0 && (
                <div className="admin-users-pagination">
                  <button
                    onClick={() => fetchUsers(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="admin-users-pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="admin-users-pagination-info">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </span>
                  <button
                    onClick={() => fetchUsers(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="admin-users-pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <UserDetailDrawer
        userId={selectedUserId}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onUserStatusChange={handleUserStatusChange}
      />
    </div>
  );
}

export default AdminUsersPage;

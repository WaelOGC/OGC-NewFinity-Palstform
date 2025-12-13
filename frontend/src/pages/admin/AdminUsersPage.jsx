import { useState, useEffect, useRef } from "react";
import { fetchAdminUsers } from "../../utils/apiClient.js";
import UserDetailDrawer from "../../components/admin/UserDetailDrawer.jsx";
import "../../styles/plasmaAdminUI.css";
import "./admin-users-page.css";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Parallax effect for command bar
  const commandBarRef = useRef(null);
  const [parallaxStyle, setParallaxStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' });

  const fetchUsers = async (page = 1, searchOverride = null, roleFilterOverride = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchAdminUsers({ 
        page, 
        pageSize: 25,
        search: searchOverride !== null ? searchOverride : search,
        role: roleFilterOverride !== null ? roleFilterOverride : roleFilter,
      });
      
      // Backend returns: { users: [], page: 1, limit: 25, total: 0 }
      // Backend users have: { id, email, username, displayName, roles: [], accountStatus, createdAt, ... }
      if (data && Array.isArray(data.users)) {
        // Normalize user objects to match frontend expectations
        // Backend returns roles array, but frontend expects role (singular) for display
        // Backend returns displayName, but frontend expects fullName
        const normalizedUsers = data.users.map(user => ({
          ...user,
          role: user.role || (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : null),
          fullName: user.fullName || user.displayName || null,
        }));
        
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
        
        setUsers(filteredUsers);
        setPagination({
          page: data.page || page,
          pageSize: data.limit || 25, // Backend returns 'limit', not 'pageSize'
          total: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / (data.limit || 25)),
        });
      } else if (data && data.users === undefined) {
        // Backend returned data but without users array - might be empty or error
        console.warn('Admin users response missing users array:', data);
        setUsers([]);
        setPagination({
          page: data.page || page,
          pageSize: data.limit || 25,
          total: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / (data.limit || 25)),
        });
      } else {
        setError("Failed to load users: Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      // Check for ADMIN_REQUIRED error code
      if (err?.code === 'ADMIN_REQUIRED' || err?.backendCode === 'ADMIN_REQUIRED') {
        setError("Admin access required. You do not have permission to view this page.");
      } else {
        setError(err?.message || "The server encountered an error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch on mount - filter changes are handled explicitly

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

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedUserId(null);
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
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers(1, '', '');
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
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                  fetchUsers(1);
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
              onChange={(e) => setStatusFilter(e.target.value)}
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

      {loading && <div className="admin-users-loading">Loading users...</div>}
      {error && <div className="admin-users-error">Error: {error}</div>}

      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <div className="admin-users-empty-state">
              <h3 className="admin-users-empty-state-title">No users found</h3>
              <p className="admin-users-empty-state-message">
                {getEmptyStateMessage()}
              </p>
              <button
                className="admin-users-empty-state-button"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
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
                              <strong>{user.fullName || "No name"}</strong>
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
                            {user.role && (
                              <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                                {getRoleLabel(user.role)}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="status-badge-wrapper">
                              <span className={`status-badge ${getStatusBadgeClass(user.accountStatus)}`}>
                                {user.accountStatus || "ACTIVE"}
                              </span>
                              {getStatusTooltipText(user.accountStatus) && (
                                <div className="status-tooltip">
                                  {getStatusTooltipText(user.accountStatus)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{formatDate(user.lastLoginAt)}</td>
                          <td>{formatDate(user.createdAt)}</td>
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

import { useState, useEffect } from "react";
import { api } from "../../utils/apiClient.js";
import AdminUserDetailPanel from "../../components/admin/AdminUserDetailPanel.jsx";
import "./admin-users-page.css";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Selected user for detail panel
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (statusFilter) params.append("status", statusFilter);

      // API client now returns data directly (from { status: "OK", data: { items, pagination } })
      const data = await api.get(`/admin/users?${params.toString()}`);
      
      if (data) {
        setUsers(Array.isArray(data.items) ? data.items : []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      } else {
        setError("Failed to load users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [search, roleFilter, statusFilter]);

  const handleUserClick = async (user) => {
    if (!user || !user.id) {
      console.error("Invalid user object:", user);
      return;
    }
    // Just set the userId - AdminUserDetailPanel will load the data
    setSelectedUser({ id: user.id });
    setShowDetailPanel(true);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = () => {
    // Refresh users list
    fetchUsers(pagination.page);
    // Note: AdminUserDetailPanel will auto-refresh when userId changes
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

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>Users</h1>
          <p className="admin-users-subtitle">Search, inspect and manage platform accounts.</p>
        </div>
      </div>

      <div className="admin-users-filters">
        <input
          type="text"
          placeholder="Search by email, name, or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-users-search"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-users-filter"
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-users-filter"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      {loading && <div className="admin-users-loading">Loading users...</div>}
      {error && <div className="admin-users-error">Error: {error}</div>}

      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <div className="admin-users-empty">
              No users found for this filter. Try adjusting your search.
            </div>
          ) : (
            <>
              <div className="admin-users-table-container">
                <table className="admin-users-table">
                  <thead>
                    <tr>
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
                          onClick={() => handleUserClick(user)}
                          className="admin-users-table-row"
                        >
                          <td>
                            <div className="admin-users-name">
                              <strong>{user.fullName || "No name"}</strong>
                              <span className="admin-users-email">{user.email || "No email"}</span>
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
                            <span className={`status-badge ${getStatusBadgeClass(user.accountStatus)}`}>
                              {user.accountStatus || "ACTIVE"}
                            </span>
                          </td>
                          <td>{formatDate(user.lastLoginAt)}</td>
                          <td>{formatDate(user.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

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
            </>
          )}
        </>
      )}

      {showDetailPanel && selectedUser && (
        <AdminUserDetailPanel
          userId={selectedUser.id}
          onClose={handleCloseDetailPanel}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}

export default AdminUsersPage;

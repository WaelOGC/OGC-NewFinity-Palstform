import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAdminSessions, revokeAdminSession } from "../../utils/apiClient.js";
import { hasAdminPermission, ADMIN_SESSIONS_READ, ADMIN_SESSIONS_WRITE } from "../../utils/adminPermissions.js";
import AdminNotAuthorized from "./AdminNotAuthorized.jsx";
import "../../styles/plasmaAdminUI.css";
import "./admin-sessions-page.css";

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'expired', label: 'Expired' },
];

function AdminSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revokeModal, setRevokeModal] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeConfirmSelf, setRevokeConfirmSelf] = useState(false);
  const [revoking, setRevoking] = useState(false);

  // Permission checks
  const canRead = hasAdminPermission(user, ADMIN_SESSIONS_READ);
  const canWrite = hasAdminPermission(user, ADMIN_SESSIONS_WRITE);

  // Get current session ID (best effort - from cookie or stored)
  const getCurrentSessionId = () => {
    // Try to get from localStorage or cookie if available
    // This is a best-effort check
    return null; // We'll detect self-session differently
  };

  // Fetch sessions
  const fetchSessions = useCallback(async (showLoading = true) => {
    if (!canRead) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      setError(null);

      const result = await getAdminSessions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        q: searchQuery || undefined,
        limit: 25,
        offset: 0,
      });

      if (result.ok && result.data) {
        setSessions(result.data.sessions || []);
        setTotal(result.data.total || 0);
      } else {
        setError(result.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      console.error('Error fetching admin sessions:', err);
      
      if (err?.httpStatus === 403) {
        setError("You don't have permission to view admin sessions.");
      } else if (err?.httpStatus === 429) {
        setError("Rate limit exceeded. Please wait before refreshing.");
      } else {
        setError(err?.message || 'Failed to load admin sessions. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [canRead, statusFilter, searchQuery]);

  // Initial fetch and refetch when filters change
  useEffect(() => {
    if (canRead) {
      fetchSessions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, canRead]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchSessions(true);
  };

  // Handle revoke click
  const handleRevokeClick = (session) => {
    // Check if this might be the current session (best effort)
    // We can't perfectly detect this on frontend, but we'll show a warning
    const mightBeCurrent = session.status === 'active';
    setRevokeModal({
      session,
      mightBeCurrent,
    });
    setRevokeReason('');
    setRevokeConfirmSelf(false);
  };

  // Handle revoke confirmation
  const handleRevokeConfirm = async () => {
    if (!revokeModal || !canWrite) return;

    const { session, mightBeCurrent } = revokeModal;

    // If might be current session and not confirmed, show error
    if (mightBeCurrent && !revokeConfirmSelf) {
      alert('Please confirm that you want to revoke this session, as it may be your current session.');
      return;
    }

    try {
      setRevoking(true);
      const result = await revokeAdminSession(
        session.id,
        revokeReason || undefined,
        revokeConfirmSelf
      );

      if (result.ok) {
        // Close modal and refresh list
        setRevokeModal(null);
        setRevokeReason('');
        setRevokeConfirmSelf(false);
        fetchSessions(false);
      } else {
        alert(result.error || 'Failed to revoke session');
      }
    } catch (err) {
      console.error('Error revoking session:', err);
      alert(err?.message || 'Failed to revoke session');
    } finally {
      setRevoking(false);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || 'unknown';
    return `session-status-badge session-status-${statusLower}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  // Permission denied
  if (!canRead) {
    return <AdminNotAuthorized requiredPermission={ADMIN_SESSIONS_READ} />;
  }

  // Loading state
  if (loading && sessions.length === 0) {
    return (
      <div className="admin-sessions-page">
        <div className="admin-sessions-header">
          <h1>Admin Sessions</h1>
        </div>
        <div className="admin-sessions-content">
          <div className="sessions-loading">
            <p>Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-sessions-page">
      <div className="admin-sessions-header">
        <div className="admin-sessions-header-content">
          <div>
            <h1>Admin Sessions</h1>
            <p className="admin-sessions-subtitle">
              Manage active admin user sessions
            </p>
          </div>
          <div className="admin-sessions-header-actions">
            <button
              className="btn btn-secondary"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-sessions-content">
        {/* Error banner */}
        {error && (
          <div className="sessions-error-banner">
            <span className="sessions-error-icon">⚠️</span>
            <span className="sessions-error-message">{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="sessions-toolbar">
          <div className="sessions-toolbar-filters">
            <select
              className="sessions-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="sessions-search-input"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Sessions table */}
        {sessions.length === 0 ? (
          <div className="sessions-empty-state">
            <p>No sessions found</p>
          </div>
        ) : (
          <div className="sessions-table-container">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>IP</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="sessions-table-row">
                    <td className="sessions-table-email">{session.email || 'N/A'}</td>
                    <td className="sessions-table-role">{session.role || 'N/A'}</td>
                    <td className="sessions-table-ip">{session.ip || 'N/A'}</td>
                    <td>
                      <span className={getStatusBadgeClass(session.status)}>
                        {session.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="sessions-table-last-seen">{formatDate(session.lastSeenAt)}</td>
                    <td className="sessions-table-created">{formatDate(session.createdAt)}</td>
                    <td className="sessions-table-expires">{formatDate(session.expiresAt)}</td>
                    <td className="sessions-table-actions">
                      {session.status === 'active' && canWrite && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRevokeClick(session)}
                          title="Force logout"
                        >
                          Force logout
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke modal */}
      {revokeModal && (
        <div className="sessions-revoke-modal-overlay" onClick={() => setRevokeModal(null)}>
          <div className="sessions-revoke-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sessions-revoke-modal-header">
              <h2>Force Logout Session</h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setRevokeModal(null)}
                disabled={revoking}
              >
                ×
              </button>
            </div>
            <div className="sessions-revoke-modal-content">
              <p>
                Are you sure you want to revoke this session? This will immediately log out the user from this device.
              </p>
              {revokeModal.mightBeCurrent && (
                <div className="sessions-revoke-modal-warning">
                  <strong>⚠️ Warning:</strong> This appears to be an active session. If this is your current session, you will be logged out.
                </div>
              )}
              <div className="sessions-revoke-modal-field">
                <label>Session Details:</label>
                <div className="sessions-revoke-modal-details">
                  <div><strong>Email:</strong> {revokeModal.session.email || 'N/A'}</div>
                  <div><strong>IP:</strong> {revokeModal.session.ip || 'N/A'}</div>
                  <div><strong>Last Seen:</strong> {formatDate(revokeModal.session.lastSeenAt)}</div>
                </div>
              </div>
              <div className="sessions-revoke-modal-field">
                <label htmlFor="revoke-reason">Reason (optional):</label>
                <textarea
                  id="revoke-reason"
                  className="sessions-revoke-reason-input"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Enter reason for revocation..."
                  rows={3}
                />
              </div>
              {revokeModal.mightBeCurrent && (
                <div className="sessions-revoke-modal-field">
                  <label>
                    <input
                      type="checkbox"
                      checked={revokeConfirmSelf}
                      onChange={(e) => setRevokeConfirmSelf(e.target.checked)}
                    />
                    {' '}I understand this will log me out if this is my current session
                  </label>
                </div>
              )}
            </div>
            <div className="sessions-revoke-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setRevokeModal(null)}
                disabled={revoking}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleRevokeConfirm}
                disabled={revoking || (revokeModal.mightBeCurrent && !revokeConfirmSelf)}
              >
                {revoking ? 'Revoking...' : 'Force Logout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSessionsPage;

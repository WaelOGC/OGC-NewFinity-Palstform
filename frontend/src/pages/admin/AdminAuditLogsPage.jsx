import { useState, useEffect, Fragment } from "react";
import { adminListAuditLogs } from "../../utils/adminApi.js";
import "../../styles/plasmaAdminUI.css";
import "./admin-audit-logs-page.css";

function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [expandedRow, setExpandedRow] = useState(null);
  const [copiedMetadataId, setCopiedMetadataId] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    action: "",
    targetType: "",
    actorId: "",
    dateFrom: "",
    dateTo: "",
    q: "",
  });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        pageSize: 25,
        action: filters.action || null,
        targetType: filters.targetType || null,
        actorId: filters.actorId ? parseInt(filters.actorId) : null,
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
        q: filters.q || null,
      };

      const data = await adminListAuditLogs(params);

      if (data.error) {
        // API not available
        setError("Audit log API is not yet available. The backend endpoint needs to be implemented.");
        setLogs([]);
        setPagination({
          page: 1,
          pageSize: 25,
          total: 0,
          totalPages: 0,
        });
      } else {
        setLogs(data.items || []);
        setPagination(data.pagination || {
          page: 1,
          pageSize: 25,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError(err?.message || "Failed to load audit logs. Please try again.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial fetch only

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchLogs(1);
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      targetType: "",
      actorId: "",
      dateFrom: "",
      dateTo: "",
      q: "",
    });
    // Fetch with cleared filters
    setTimeout(() => fetchLogs(1), 0);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  const toggleRowExpand = (logId) => {
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatMetadata = (metadata) => {
    if (!metadata) return null;
    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return String(metadata);
    }
  };

  const getMetadataPreview = (metadata) => {
    if (!metadata) return "No metadata";
    try {
      const str = JSON.stringify(metadata);
      return str.length > 100 ? str.substring(0, 100) + "..." : str;
    } catch {
      return "Invalid metadata";
    }
  };

  const handleCopyMetadata = async (e, metadata, logId) => {
    e.stopPropagation();
    
    if (!metadata) return;
    
    try {
      const metadataStr = formatMetadata(metadata);
      await navigator.clipboard.writeText(metadataStr);
      setCopiedMetadataId(logId);
      
      setTimeout(() => {
        setCopiedMetadataId(null);
      }, 1200);
    } catch (err) {
      console.error("Failed to copy metadata:", err);
      setCopiedMetadataId(`error-${logId}`);
      setTimeout(() => {
        setCopiedMetadataId(null);
      }, 1200);
    }
  };

  const getActionChipClass = (action) => {
    // Positive actions (teal/violet)
    if (['USER_CREATED', 'ROLE_ASSIGNED', 'ROLE_UPDATED', 'FEATURE_FLAG_UPDATED', 'STATUS_UPDATED'].includes(action)) {
      return 'audit-action-chip--positive';
    }
    // Negative actions (pink/red)
    if (['ACCESS_DENIED', 'SUSPENDED', 'BANNED', 'USER_DELETED', 'SESSION_REVOKED'].includes(action)) {
      return 'audit-action-chip--negative';
    }
    // System events (blue/neutral)
    return 'audit-action-chip--system';
  };

  // Available action types (can be extended based on backend)
  const actionTypes = [
    "USER_CREATED",
    "USER_DELETED",
    "ROLE_ASSIGNED",
    "ROLE_UPDATED",
    "STATUS_UPDATED",
    "FEATURE_FLAG_UPDATED",
    "SESSION_REVOKED",
    "ACCESS_DENIED",
    "SUSPENDED",
    "BANNED",
  ];

  // Available target types
  const targetTypes = [
    "USER",
    "CONTENT",
    "SYSTEM",
    "SESSION",
    "ROLE",
    "FEATURE_FLAG",
  ];

  return (
    <div className="admin-audit-logs-page">
      <div className="admin-audit-logs-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="admin-audit-logs-subtitle">Track administrative actions and system events</p>
        </div>
      </div>

      {/* Plasma Command Bar */}
      <div className="plasma-command-bar plasma-panel--raised">
        <div className="plasma-command-bar-search">
          <div className="plasma-field-wrapper">
            <input
              type="text"
              placeholder="Search audit logs..."
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
              className="plasma-field admin-audit-search"
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
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="plasma-field admin-audit-filter"
            >
              <option value="">All Actions</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="plasma-field-wrapper">
            <select
              value={filters.targetType}
              onChange={(e) => handleFilterChange("targetType", e.target.value)}
              className="plasma-field admin-audit-filter"
            >
              <option value="">All Types</option>
              {targetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <div className="plasma-field-wrapper">
            <input
              type="number"
              value={filters.actorId}
              onChange={(e) => handleFilterChange("actorId", e.target.value)}
              placeholder="Actor ID"
              className="plasma-field admin-audit-filter"
            />
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="plasma-field-wrapper">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="plasma-field admin-audit-filter"
              title="From Date"
            />
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="plasma-field-wrapper">
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="plasma-field admin-audit-filter"
              title="To Date"
            />
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          {(filters.action || filters.targetType || filters.actorId || filters.dateFrom || filters.dateTo || filters.q) && (
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
          <button
            onClick={handleApplyFilters}
            className="plasma-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Apply
          </button>
        </div>
      </div>

      {loading && logs.length === 0 && (
        <div className="admin-audit-logs-loading">
          <p>Loading audit logs...</p>
        </div>
      )}

      {error && logs.length === 0 && (
        <div className="admin-audit-logs-error">
          <h3 className="admin-audit-logs-error-title">Unable to load audit logs</h3>
          <p className="admin-audit-logs-error-message">{error}</p>
          <button onClick={() => fetchLogs(1)} className="plasma-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="admin-audit-logs-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-audit-logs-empty-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h3 className="admin-audit-logs-empty-state-title">No audit logs found</h3>
          <p className="admin-audit-logs-empty-state-message">
            {filters.action || filters.targetType || filters.actorId || filters.dateFrom || filters.dateTo || filters.q
              ? "No audit logs match your current filters. Try adjusting your search criteria."
              : "There are no audit logs to display."}
          </p>
          {(filters.action || filters.targetType || filters.actorId || filters.dateFrom || filters.dateTo || filters.q) && (
            <button
              className="admin-audit-logs-empty-state-button"
              onClick={handleClearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          {error && (
            <div className="admin-audit-logs-error-banner">
              <p>{error}</p>
            </div>
          )}
          <div className="admin-audit-table-container">
            <table className="admin-audit-table">
              <thead>
                <tr className="plasma-table-header">
                  <th>Time</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Actor</th>
                  <th>IP</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr 
                      className={`admin-audit-table-row plasma-table-row ${expandedRow === log.id ? "admin-audit-row-expanded" : ""}`}
                    >
                      <td>
                        <div className="admin-audit-time">
                          <span className="admin-audit-time-relative" title={formatDate(log.createdAt)}>
                            {formatRelativeTime(log.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`audit-action-chip ${getActionChipClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div className="admin-audit-target">
                          {log.targetType && (
                            <span className="admin-audit-target-type">{log.targetType}</span>
                          )}
                          {log.targetId && (
                            <span className="admin-audit-target-id">#{log.targetId}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-audit-actor">
                          <span className="admin-audit-actor-id">{log.actorId}</span>
                          {log.actorRole && (
                            <span className="admin-audit-actor-role">{log.actorRole}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {log.ipAddress ? (
                          <span className="admin-audit-ip">{log.ipAddress}</span>
                        ) : (
                          <span className="admin-audit-ip-empty">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleRowExpand(log.id)}
                          className="plasma-icon-button admin-audit-expand-btn"
                          aria-label={expandedRow === log.id ? "Collapse metadata" : "Expand metadata"}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {expandedRow === log.id ? (
                              <polyline points="18 15 12 9 6 15"></polyline>
                            ) : (
                              <polyline points="6 9 12 15 18 9"></polyline>
                            )}
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr key={`${log.id}-expanded`} className="admin-audit-row-details">
                        <td colSpan="6">
                          <div className="admin-audit-details">
                            <div className="admin-audit-details-section">
                              <div className="admin-audit-details-header">
                                <h4>Full Metadata</h4>
                                <button
                                  onClick={(e) => handleCopyMetadata(e, log.metadata, log.id)}
                                  className="plasma-icon-button admin-audit-copy-btn"
                                  aria-label="Copy metadata to clipboard"
                                  title="Copy metadata"
                                >
                                  {copiedMetadataId === log.id ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                  )}
                                </button>
                                {copiedMetadataId === log.id && (
                                  <span className="admin-audit-copy-feedback">Copied!</span>
                                )}
                                {copiedMetadataId === `error-${log.id}` && (
                                  <span className="admin-audit-copy-feedback admin-audit-copy-feedback-error">Copy failed</span>
                                )}
                              </div>
                              <pre className="admin-audit-metadata-full">
                                {formatMetadata(log.metadata)}
                              </pre>
                            </div>
                            {(log.ipAddress || log.userAgent) && (
                              <div className="admin-audit-details-meta">
                                {log.ipAddress && (
                                  <div className="admin-audit-meta-item">
                                    <strong>IP Address:</strong> {log.ipAddress}
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div className="admin-audit-meta-item">
                                    <strong>User Agent:</strong> {log.userAgent}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="admin-audit-pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="admin-audit-pagination-btn"
              >
                Previous
              </button>
              <span className="admin-audit-pagination-info">
                Page {pagination.page} of {pagination.totalPages} {pagination.total > 0 && `(${pagination.total} total)`}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="admin-audit-pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminAuditLogsPage;

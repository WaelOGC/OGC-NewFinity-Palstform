import { useState, useEffect, Fragment, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getAdminAuditLogs } from "../../utils/apiClient.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasAdminPermission, ADMIN_AUDIT_LOGS_READ } from "../../utils/adminPermissions.js";
import "../../styles/plasmaAdminUI.css";
import "./admin-audit-logs-page.css";

// Helper functions for URL param parsing and validation
const parseIntSafe = (value, defaultValue) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const clampPage = (page) => {
  return Math.max(1, parseIntSafe(page, 1));
};

const normalizeLimit = (limit) => {
  const validLimits = [10, 25, 50, 100];
  const parsed = parseIntSafe(limit, 25);
  return validLimits.includes(parsed) ? parsed : 25;
};

const buildQueryParams = (params) => {
  const searchParams = new URLSearchParams();
  if (params.page && params.page > 1) searchParams.set('page', params.page.toString());
  if (params.limit && params.limit !== 25) searchParams.set('limit', params.limit.toString());
  if (params.q) searchParams.set('q', params.q);
  if (params.action) searchParams.set('action', params.action);
  if (params.status) searchParams.set('status', params.status);
  if (params.actorUserId) searchParams.set('actorUserId', params.actorUserId.toString());
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

function AdminAuditLogsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial values from URL params
  const urlPage = clampPage(searchParams.get('page'));
  const urlLimit = normalizeLimit(searchParams.get('limit'));
  const urlQ = searchParams.get('q') || '';
  const urlAction = searchParams.get('action') || '';
  const urlStatus = searchParams.get('status') || '';
  const urlActorUserId = searchParams.get('actorUserId') || '';

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: urlPage, limit: urlLimit, total: 0 });
  const [expandedRow, setExpandedRow] = useState(null);
  const [copiedMetadataId, setCopiedMetadataId] = useState(null);
  const [copiedRequestId, setCopiedRequestId] = useState(null);
  const [degradedMode, setDegradedMode] = useState(false);
  
  // Density mode state with localStorage initialization
  const [density, setDensity] = useState(() => {
    try {
      const saved = localStorage.getItem('admin.auditLogs.density');
      return saved === 'compact' ? 'compact' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  // Check if user has permission to view audit logs
  const canViewAuditLogs = hasAdminPermission(user, ADMIN_AUDIT_LOGS_READ);

  // Filters - initialize from URL params
  const [filters, setFilters] = useState({
    action: urlAction,
    status: urlStatus,
    actorUserId: urlActorUserId,
    q: urlQ,
  });

  // Debounce ref for search
  const searchDebounceRef = useRef(null);

  const fetchLogs = useCallback(async (page, limit, filterOverrides = {}) => {
    if (!canViewAuditLogs) {
      setError("You do not have permission to view audit logs.");
      setLoading(false);
      return;
    }

    const isFirstLoad = logs.length === 0;
    
    try {
      // Only show loading state on first load, otherwise keep data visible
      if (isFirstLoad) {
        setLoading(true);
      }
      setError(null);

      const activeFilters = {
        action: filterOverrides.action !== undefined ? filterOverrides.action : filters.action,
        status: filterOverrides.status !== undefined ? filterOverrides.status : filters.status,
        actorUserId: filterOverrides.actorUserId !== undefined ? filterOverrides.actorUserId : filters.actorUserId,
        q: filterOverrides.q !== undefined ? filterOverrides.q : filters.q,
      };

      const params = {
        page: page || pagination.page,
        limit: limit || pagination.limit,
        action: activeFilters.action || undefined,
        status: activeFilters.status || undefined,
        actorUserId: activeFilters.actorUserId ? parseIntSafe(activeFilters.actorUserId, null) : undefined,
        q: activeFilters.q || undefined,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      // Use fetch directly to check for degraded mode header
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          searchParams.set(key, params[key].toString());
        }
      });

      const response = await fetch(`/api/v1/admin/audit-logs?${searchParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      // Check degraded mode header
      const adminMode = response.headers.get('x-admin-mode');
      if (adminMode === 'degraded') {
        setDegradedMode(true);
      } else {
        setDegradedMode(false);
      }

      const text = await response.text();
      const data = JSON.parse(text);

      // Handle error responses
      if (!response.ok || data?.status === 'ERROR') {
        const error = new Error(data?.message || 'Failed to fetch audit logs');
        error.code = data?.code;
        error.httpStatus = response.status;
        throw error;
      }

      const responseData = data?.data || data;

      // Backend returns: { logs: [...], page, limit, total }
      setLogs(responseData.logs || []);
      const newPage = responseData.page || page || pagination.page;
      const newLimit = responseData.limit || limit || pagination.limit;
      const newTotal = responseData.total || 0;
      
      setPagination({
        page: newPage,
        limit: newLimit,
        total: newTotal,
        totalPages: Math.max(1, Math.ceil(newTotal / newLimit)),
      });

      // Update URL params
      const newSearchParams = new URLSearchParams();
      if (newPage > 1) newSearchParams.set('page', newPage.toString());
      if (newLimit !== 25) newSearchParams.set('limit', newLimit.toString());
      if (activeFilters.q) newSearchParams.set('q', activeFilters.q);
      if (activeFilters.action) newSearchParams.set('action', activeFilters.action);
      if (activeFilters.status) newSearchParams.set('status', activeFilters.status);
      if (activeFilters.actorUserId) newSearchParams.set('actorUserId', activeFilters.actorUserId);
      
      setSearchParams(newSearchParams, { replace: true });
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      // Check for permission denied error
      if (err?.code === 'PERMISSION_DENIED' || err?.httpStatus === 403) {
        setError("You do not have permission to view audit logs.");
      } else {
        setError(err?.message || "Failed to load audit logs. Please try again.");
      }
      // Only clear logs on first load error, otherwise keep previous data
      if (isFirstLoad) {
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [canViewAuditLogs, logs.length, filters, pagination.page, pagination.limit, setSearchParams]);

  // Track if this is the initial mount
  const isInitialMountRef = useRef(true);

  // Initial load and URL param changes
  useEffect(() => {
    const urlPage = clampPage(searchParams.get('page'));
    const urlLimit = normalizeLimit(searchParams.get('limit'));
    const urlQ = searchParams.get('q') || '';
    const urlAction = searchParams.get('action') || '';
    const urlStatus = searchParams.get('status') || '';
    const urlActorUserId = searchParams.get('actorUserId') || '';

    // Update filters from URL (only if different to avoid loops)
    setFilters(prev => {
      if (prev.action === urlAction && prev.status === urlStatus && 
          prev.actorUserId === urlActorUserId && prev.q === urlQ) {
        return prev;
      }
      return {
        action: urlAction,
        status: urlStatus,
        actorUserId: urlActorUserId,
        q: urlQ,
      };
    });

    // Update pagination from URL
    setPagination(prev => {
      if (prev.page === urlPage && prev.limit === urlLimit) {
        return prev;
      }
      return {
        ...prev,
        page: urlPage,
        limit: urlLimit,
      };
    });

    // Fetch with URL params
    fetchLogs(urlPage, urlLimit, {
      action: urlAction,
      status: urlStatus,
      actorUserId: urlActorUserId,
      q: urlQ,
    });

    // Auto-collapse expanded row when data changes
    setExpandedRow(null);

    isInitialMountRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]); // Re-fetch when URL params change

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    // Reset to page 1 when applying filters
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', '1');
    if (pagination.limit !== 25) newSearchParams.set('limit', pagination.limit.toString());
    if (filters.q) newSearchParams.set('q', filters.q);
    if (filters.action) newSearchParams.set('action', filters.action);
    if (filters.status) newSearchParams.set('status', filters.status);
    if (filters.actorUserId) newSearchParams.set('actorUserId', filters.actorUserId);
    setSearchParams(newSearchParams, { replace: true });
  };

  // Helper to check if any filters are applied
  const hasActiveFilters = () => {
    return !!(filters.action || filters.status || filters.actorUserId || filters.q);
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      status: "",
      actorUserId: "",
      q: "",
    });
    // Reset to page 1 and clear all filter params, preserve limit
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', '1');
    if (pagination.limit !== 25) newSearchParams.set('limit', pagination.limit.toString());
    setSearchParams(newSearchParams, { replace: true });
  };

  // Debounced search handler - only when user types (not on initial load or URL sync)
  const prevQRef = useRef(filters.q);
  useEffect(() => {
    // Skip if this is initial mount or if q hasn't actually changed
    if (isInitialMountRef.current || prevQRef.current === filters.q) {
      prevQRef.current = filters.q;
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Only debounce if we have existing logs
    if (logs.length > 0) {
      searchDebounceRef.current = setTimeout(() => {
        // Reset to page 1 when search changes
        const newSearchParams = new URLSearchParams();
        newSearchParams.set('page', '1');
        if (pagination.limit !== 25) newSearchParams.set('limit', pagination.limit.toString());
        if (filters.q) newSearchParams.set('q', filters.q);
        if (filters.action) newSearchParams.set('action', filters.action);
        if (filters.status) newSearchParams.set('status', filters.status);
        if (filters.actorUserId) newSearchParams.set('actorUserId', filters.actorUserId);
        setSearchParams(newSearchParams, { replace: true });
      }, 350);
    }

    prevQRef.current = filters.q;

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  const handlePageChange = (newPage) => {
    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
    const clampedPage = Math.max(1, Math.min(newPage, totalPages));
    if (clampedPage !== pagination.page) {
      const newSearchParams = new URLSearchParams(searchParams);
      if (clampedPage > 1) {
        newSearchParams.set('page', clampedPage.toString());
      } else {
        newSearchParams.delete('page');
      }
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  const handleLimitChange = (newLimit) => {
    const normalized = normalizeLimit(newLimit);
    if (normalized !== pagination.limit) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', '1'); // Reset to page 1 when limit changes
      if (normalized !== 25) {
        newSearchParams.set('limit', normalized.toString());
      } else {
        newSearchParams.delete('limit');
      }
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  const toggleRowExpand = (e, logId) => {
    e.stopPropagation();
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  const handleCopyRequestId = async (e, requestId, logId) => {
    e.stopPropagation();
    
    if (!requestId) return;
    
    try {
      await navigator.clipboard.writeText(requestId);
      setCopiedRequestId(logId);
      
      setTimeout(() => {
        setCopiedRequestId(null);
      }, 1200);
    } catch (err) {
      console.error("Failed to copy request ID:", err);
      setCopiedRequestId(`error-${logId}`);
      setTimeout(() => {
        setCopiedRequestId(null);
      }, 1200);
    }
  };

  const handleDensityChange = (newDensity) => {
    setDensity(newDensity);
    try {
      localStorage.setItem('admin.auditLogs.density', newDensity);
    } catch (err) {
      // Silently fail if localStorage is unavailable
      console.warn('Failed to save density preference:', err);
    }
  };

  // Defensive formatting helpers - never throw, always return string
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "—";
      }
      // Format as YYYY-MM-DD HH:mm:ss in local time
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return "—";
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "—";
      }
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
      // Fallback to formatted date
      return formatDate(dateString);
    } catch {
      return "—";
    }
  };

  const formatActor = (log) => {
    if (!log) return "—";
    // Prefer email if present and non-empty
    if (log.actorEmail && String(log.actorEmail).trim()) {
      return String(log.actorEmail).trim();
    }
    // Fallback to userId if present
    if (log.actorUserId != null && String(log.actorUserId).trim()) {
      return String(log.actorUserId).trim();
    }
    return "—";
  };

  const formatTarget = (log) => {
    if (!log) return "—";
    const hasType = log.targetType && String(log.targetType).trim();
    const hasId = log.targetId != null && String(log.targetId).trim();
    
    if (hasType && hasId) {
      return `${String(log.targetType).trim()} #${String(log.targetId).trim()}`;
    }
    if (hasType) {
      return String(log.targetType).trim();
    }
    if (hasId) {
      return `#${String(log.targetId).trim()}`;
    }
    return "—";
  };

  const formatMessage = (log) => {
    if (!log) return "—";
    if (log.message && String(log.message).trim()) {
      return String(log.message).trim();
    }
    return "—";
  };

  const formatMetadata = (metadata) => {
    if (!metadata) return '—';
    try {
      if (typeof metadata === 'object') {
        return JSON.stringify(metadata, null, 2);
      }
      return String(metadata);
    } catch {
      return '—';
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


  // Show not authorized if user lacks permission
  if (!canViewAuditLogs) {
    return (
      <div className="admin-audit-logs-page">
        <div className="admin-audit-logs-header">
          <div>
            <h1>Audit Logs</h1>
            <p className="admin-audit-logs-subtitle">Track administrative actions and system events</p>
          </div>
        </div>
        <div style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-error, #fee)',
          border: '1px solid var(--border-error, #fcc)',
          borderRadius: '4px',
          margin: '2rem 0'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-error, #c00)' }}>Not Authorized</h3>
          <p style={{ color: 'var(--text-secondary, #666)' }}>
            You do not have permission to view audit logs. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-audit-logs-page">
      <div className="admin-audit-logs-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="admin-audit-logs-subtitle">Track administrative actions and system events</p>
        </div>
        <div className="admin-audit-logs-density-toggle">
          <label className="admin-audit-logs-density-label">Density:</label>
          <div className="admin-audit-logs-density-control">
            <button
              className={`admin-audit-logs-density-btn ${density === 'comfortable' ? 'active' : ''}`}
              onClick={() => handleDensityChange('comfortable')}
              aria-pressed={density === 'comfortable'}
            >
              Comfortable
            </button>
            <button
              className={`admin-audit-logs-density-btn ${density === 'compact' ? 'active' : ''}`}
              onClick={() => handleDensityChange('compact')}
              aria-pressed={density === 'compact'}
            >
              Compact
            </button>
          </div>
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
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="plasma-field admin-audit-filter"
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="plasma-field-wrapper">
            <input
              type="number"
              value={filters.actorUserId}
              onChange={(e) => handleFilterChange("actorUserId", e.target.value)}
              placeholder="Actor User ID"
              className="plasma-field admin-audit-filter"
            />
            <svg className="plasma-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          {(filters.action || filters.status || filters.actorUserId || filters.q) && (
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

      {/* Degraded mode banner */}
      {degradedMode && (
        <div className="admin-audit-logs-error-banner" style={{ 
          background: 'rgba(255, 193, 7, 0.15)',
          borderColor: 'var(--plasma-yellow, #ffc107)',
          color: 'var(--plasma-yellow, #ffc107)'
        }}>
          <p>
            ⚠️ Audit logs are operating in degraded mode. Some features may be limited.
          </p>
        </div>
      )}

      {/* Initial loading state (only when no data) */}
      {loading && logs.length === 0 && (
        <div className="admin-audit-logs-loading">
          <p>Loading audit logs...</p>
        </div>
      )}

      {/* Error state (only when no data) */}
      {error && logs.length === 0 && (
        <div className="admin-audit-logs-error">
          <h3 className="admin-audit-logs-error-title">Unable to load audit logs</h3>
          <p className="admin-audit-logs-error-message">{error}</p>
          <button onClick={() => {
            const newSearchParams = new URLSearchParams();
            newSearchParams.set('page', '1');
            if (pagination.limit !== 25) newSearchParams.set('limit', pagination.limit.toString());
            setSearchParams(newSearchParams, { replace: true });
          }} className="plasma-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Retry
          </button>
        </div>
      )}

      {/* Empty state - differentiate between no logs yet vs no results for filters */}
      {!loading && !error && pagination.total === 0 && (
        <div className="admin-audit-logs-empty-state">
          {hasActiveFilters() ? (
            // No results for current filters
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-audit-logs-empty-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3 className="admin-audit-logs-empty-state-title">No results found</h3>
              <p className="admin-audit-logs-empty-state-message">
                No audit logs match the current filters.
              </p>
              <button
                className="admin-audit-logs-empty-state-button"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            </>
          ) : (
            // No logs yet
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-audit-logs-empty-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <h3 className="admin-audit-logs-empty-state-title">No audit logs yet</h3>
              <p className="admin-audit-logs-empty-state-message">
                Admin activity will appear here once actions are performed.
              </p>
            </>
          )}
        </div>
      )}

      {/* Table with data - show loading indicator and error banner if needed */}
      {logs.length > 0 && (
        <>
          {/* Inline error banner (when error but data exists) */}
          {error && (
            <div className="admin-audit-logs-error-banner">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p>{error}</p>
                <button 
                  onClick={() => {
                    const newSearchParams = new URLSearchParams(searchParams);
                    setSearchParams(newSearchParams, { replace: true });
                  }} 
                  className="plasma-button plasma-button--ghost"
                  style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {/* Loading indicator overlay when loading but data exists */}
          {loading && (
            <div style={{ 
              position: 'relative', 
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              background: 'var(--plasma-panel-bg)',
              border: '1px solid var(--plasma-panel-border)',
              borderRadius: '8px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem'
            }}>
              <span>Loading...</span>
            </div>
          )}
          
          <div className={`admin-audit-table-container density-${density}`} style={{ position: 'relative', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <table className="admin-audit-table">
              <thead>
                <tr className="plasma-table-header">
                  <th style={{ width: '40px', minWidth: '40px' }}></th>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Request ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr 
                      className={`admin-audit-table-row plasma-table-row ${expandedRow === log.id ? "admin-audit-row-expanded" : ""}`}
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <td>
                        <button
                          className="admin-audit-expand-btn"
                          onClick={(e) => toggleRowExpand(e, log.id)}
                          aria-label={expandedRow === log.id ? "Collapse details" : "Expand details"}
                          aria-expanded={expandedRow === log.id}
                        >
                          <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            style={{ 
                              transform: expandedRow === log.id ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}
                          >
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </td>
                      <td>
                        <div className="admin-audit-time">
                          {(() => {
                            const timeText = formatRelativeTime(log.createdAt);
                            const fullDate = formatDate(log.createdAt);
                            if (timeText === "—") {
                              return <span>—</span>;
                            }
                            return (
                              <span className="admin-audit-time-relative" title={fullDate}>
                                {timeText}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td>
                        <div className="admin-audit-actor">
                          {(() => {
                            const actorText = formatActor(log);
                            if (actorText === "—") {
                              return <span>—</span>;
                            }
                            // Check if we're showing email or userId
                            const isEmail = log?.actorEmail && String(log.actorEmail).trim() === actorText;
                            if (isEmail) {
                              return (
                                <>
                                  {log.actorUserId != null && (
                                    <span className="admin-audit-actor-id" style={{ display: 'none' }}>{String(log.actorUserId)}</span>
                                  )}
                                  <span className="admin-audit-actor-email">{actorText}</span>
                                </>
                              );
                            }
                            // Showing userId
                            return (
                              <>
                                <span className="admin-audit-actor-id">{actorText}</span>
                                {log.actorEmail && String(log.actorEmail).trim() && (
                                  <span className="admin-audit-actor-email" style={{ display: 'none' }}>{String(log.actorEmail).trim()}</span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td>
                        {log.action ? (
                          <span className="audit-action-chip">
                            {log.action}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-audit-target">
                          {(() => {
                            const targetText = formatTarget(log);
                            if (targetText === "—") {
                              return <span>—</span>;
                            }
                            // Check if it contains both type and ID
                            if (log.targetType && String(log.targetType).trim() && log.targetId != null && String(log.targetId).trim()) {
                              return (
                                <>
                                  <span className="admin-audit-target-type">{String(log.targetType).trim()}</span>
                                  <span className="admin-audit-target-id"> #{String(log.targetId).trim()}</span>
                                </>
                              );
                            }
                            // Only type
                            if (log.targetType && String(log.targetType).trim()) {
                              return <span className="admin-audit-target-type">{targetText}</span>;
                            }
                            // Only ID
                            return <span className="admin-audit-target-id">{targetText}</span>;
                          })()}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const status = log.status?.toUpperCase();
                          let statusClass = 'audit-status-chip--unknown';
                          let statusText = 'UNKNOWN';
                          
                          if (status === 'SUCCESS') {
                            statusClass = 'audit-status-chip--success';
                            statusText = 'SUCCESS';
                          } else if (status === 'WARNING') {
                            statusClass = 'audit-status-chip--warning';
                            statusText = 'WARNING';
                          } else if (status === 'ERROR' || status === 'FAILED') {
                            statusClass = 'audit-status-chip--error';
                            statusText = 'ERROR';
                          } else if (status) {
                            // Unknown status value, but show it
                            statusText = status;
                          }
                          
                          return (
                            <span className={`audit-status-chip ${statusClass}`}>
                              {statusText}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        {log.requestId ? (
                          <span className="admin-audit-request-id" title={log.requestId}>
                            {log.requestId.length > 12 ? `${log.requestId.substring(0, 12)}...` : log.requestId}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr key={`${log.id}-expanded`} className="admin-audit-row-details">
                        <td colSpan="7">
                          <div className="admin-audit-details">
                            <div className="admin-audit-details-section">
                              <div className="admin-audit-details-header">
                                <h4>Full Details</h4>
                                {(log.meta || log.message) && (
                                  <button
                                    onClick={(e) => handleCopyMetadata(e, log.meta || log.message, log.id)}
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
                                )}
                                {copiedMetadataId === log.id && (
                                  <span className="admin-audit-copy-feedback">Copied!</span>
                                )}
                                {copiedMetadataId === `error-${log.id}` && (
                                  <span className="admin-audit-copy-feedback admin-audit-copy-feedback-error">Copy failed</span>
                                )}
                              </div>
                              {(() => {
                                const messageText = formatMessage(log);
                                if (messageText !== "—") {
                                  return (
                                    <div className="admin-audit-message">
                                      <strong>Message:</strong> {messageText}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {log.meta ? (
                                <pre className="admin-audit-metadata-full">
                                  {formatMetadata(log.meta)}
                                </pre>
                              ) : (
                                <div className="admin-audit-meta-item">
                                  <strong>Meta:</strong> —
                                </div>
                              )}
                            </div>
                            {(log.ip || log.requestId) && (
                              <div className="admin-audit-details-meta">
                                {log.ip && (
                                  <div className="admin-audit-meta-item">
                                    <strong>IP Address:</strong> <span style={{ fontFamily: 'monospace' }}>{log.ip}</span>
                                  </div>
                                )}
                                {log.requestId && (
                                  <div className="admin-audit-meta-item">
                                    <strong>Request ID:</strong>{' '}
                                    <span style={{ fontFamily: 'monospace' }}>{log.requestId}</span>
                                    <button
                                      onClick={(e) => handleCopyRequestId(e, log.requestId, log.id)}
                                      className="admin-audit-copy-request-btn"
                                      aria-label="Copy request ID"
                                      title="Copy request ID"
                                    >
                                      {copiedRequestId === log.id ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                      ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                      )}
                                    </button>
                                    {copiedRequestId === log.id && (
                                      <span className="admin-audit-copy-feedback" style={{ marginLeft: '0.5rem' }}>Copied!</span>
                                    )}
                                    {copiedRequestId === `error-${log.id}` && (
                                      <span className="admin-audit-copy-feedback admin-audit-copy-feedback-error" style={{ marginLeft: '0.5rem' }}>Copy failed</span>
                                    )}
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
          {pagination.total > 0 && (
            <div className="admin-audit-pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="admin-audit-pagination-btn"
              >
                Previous
              </button>
              <span className="admin-audit-pagination-info">
                Page {pagination.page} of {pagination.totalPages} · Total {pagination.total}
              </span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(e.target.value)}
                disabled={loading}
                className="admin-audit-pagination-limit"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
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

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getSystemHealth } from "../../utils/apiClient.js";
import { hasAdminPermission, SYSTEM_HEALTH_READ } from "../../utils/adminPermissions.js";
import AdminNotAuthorized from "./AdminNotAuthorized.jsx";
import "../../styles/plasmaAdminUI.css";
import "./admin-system-health-page.css";

const REFRESH_INTERVAL_MS = 15000; // 15 seconds

function AdminSystemHealthPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);
  const isVisibleRef = useRef(true);

  // Permission check
  const canRead = hasAdminPermission(user, SYSTEM_HEALTH_READ);

  // Fetch health data
  const fetchHealth = useCallback(async (showLoading = true) => {
    if (!canRead) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      setError(null);

      const result = await getSystemHealth();

      if (result.ok && result.data) {
        setHealthData(result.data);
        setLastRefresh(new Date());
      } else {
        // Keep last known data, but show error
        setError(result.error || "Failed to fetch system health");
      }
    } catch (err) {
      console.error("Error fetching system health:", err);
      
      // Keep last known data, but show error
      if (err?.httpStatus === 403) {
        setError("You don't have permission to view system health.");
      } else if (err?.httpStatus === 429) {
        setError("Rate limit exceeded. Please wait before refreshing.");
      } else {
        setError(err?.message || "Failed to load system health. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [canRead]);

  // Initial fetch
  useEffect(() => {
    fetchHealth(true);
  }, [fetchHealth]);

  // Auto-refresh setup
  useEffect(() => {
    if (!canRead) return;

    // Handle visibility change (pause refresh when tab not visible)
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (document.hidden) {
        // Pause refresh when tab is hidden
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      } else {
        // Resume refresh when tab becomes visible
        // Fetch immediately, then set up interval
        fetchHealth(false);
        refreshIntervalRef.current = setInterval(() => {
          if (isVisibleRef.current) {
            fetchHealth(false);
          }
        }, REFRESH_INTERVAL_MS);
      }
    };

    // Set up initial interval
    refreshIntervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        fetchHealth(false);
      }
    }, REFRESH_INTERVAL_MS);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [canRead, fetchHealth]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchHealth(true);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || 'unknown';
    return `status-badge status-badge-${statusLower}`;
  };

  // Get status label
  const getStatusLabel = (status) => {
    return status?.toUpperCase() || 'UNKNOWN';
  };

  // Format latency
  const formatLatency = (latencyMs) => {
    if (latencyMs === null || latencyMs === undefined) return 'N/A';
    return `${latencyMs} ms`;
  };

  // Render service card
  const renderServiceCard = (serviceName, serviceData) => {
    const status = serviceData?.status || 'UNKNOWN';
    const latencyMs = serviceData?.latencyMs;
    const details = serviceData?.details || {};

    return (
      <div key={serviceName} className="health-service-card">
        <div className="health-service-header">
          <h3 className="health-service-name">{serviceName.toUpperCase()}</h3>
          <span className={getStatusBadgeClass(status)}>
            {getStatusLabel(status)}
          </span>
        </div>
        <div className="health-service-body">
          <div className="health-service-metric">
            <span className="health-metric-label">Latency:</span>
            <span className="health-metric-value">{formatLatency(latencyMs)}</span>
          </div>
          {Object.keys(details).length > 0 && (
            <div className="health-service-details">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="health-detail-item">
                  <span className="health-detail-key">{key}:</span>
                  <span className="health-detail-value">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Permission denied
  if (!canRead) {
    return <AdminNotAuthorized requiredPermission={SYSTEM_HEALTH_READ} />;
  }

  // Loading state
  if (loading && !healthData) {
    return (
      <div className="admin-system-health-page">
        <div className="admin-system-health-header">
          <h1>System Health</h1>
        </div>
        <div className="admin-system-health-content">
          <div className="health-loading">
            <p>Loading system health...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get overall status
  const overallStatus = healthData?.status || 'UNKNOWN';
  const services = healthData?.services || {};
  const timestamp = healthData?.timestamp || null;

  return (
    <div className="admin-system-health-page">
      <div className="admin-system-health-header">
        <div className="admin-system-health-header-content">
          <div>
            <h1>System Health</h1>
            {timestamp && (
              <p className="admin-system-health-subtitle">
                Last updated: {new Date(timestamp).toLocaleString()}
                {lastRefresh && ` • Auto-refresh: ${REFRESH_INTERVAL_MS / 1000}s`}
              </p>
            )}
          </div>
          <div className="admin-system-health-header-actions">
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

      <div className="admin-system-health-content">
        {/* Error banner */}
        {error && (
          <div className="health-error-banner">
            <span className="health-error-icon">⚠️</span>
            <span className="health-error-message">{error}</span>
            {healthData && (
              <span className="health-error-note">
                (Showing last known results)
              </span>
            )}
          </div>
        )}

        {/* Overall status */}
        <div className="health-overall-status">
          <div className="health-overall-card">
            <div className="health-overall-label">Overall Status</div>
            <div className="health-overall-badge">
              <span className={getStatusBadgeClass(overallStatus)}>
                {getStatusLabel(overallStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Service cards */}
        <div className="health-services-grid">
          {renderServiceCard('API', services.api)}
          {renderServiceCard('Database', services.db)}
          {renderServiceCard('Cache', services.cache)}
          {renderServiceCard('Queue', services.queue)}
        </div>
      </div>
    </div>
  );
}

export default AdminSystemHealthPage;

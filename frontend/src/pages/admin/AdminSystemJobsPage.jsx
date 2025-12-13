import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getSystemJobs, getSystemJob, retrySystemJob, cancelSystemJob } from "../../utils/apiClient.js";
import { hasAdminPermission, SYSTEM_JOBS_READ, SYSTEM_JOBS_WRITE } from "../../utils/adminPermissions.js";
import AdminNotAuthorized from "./AdminNotAuthorized.jsx";
import "../../styles/plasmaAdminUI.css";
import "./admin-system-jobs-page.css";

const REFRESH_INTERVAL_MS = 20000; // 20 seconds

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'canceled', label: 'Canceled' },
];

function AdminSystemJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [selectedJobLoading, setSelectedJobLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const refreshIntervalRef = useRef(null);
  const isVisibleRef = useRef(true);

  // Permission checks
  const canRead = hasAdminPermission(user, SYSTEM_JOBS_READ);
  const canWrite = hasAdminPermission(user, SYSTEM_JOBS_WRITE);

  // Fetch jobs
  const fetchJobs = useCallback(async (showLoading = true) => {
    if (!canRead) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsRefreshing(true);
      }
      setError(null);

      const result = await getSystemJobs({
        status: statusFilter || undefined,
        q: searchQuery || undefined,
        limit: 25,
        offset: 0,
      });

      if (result.ok && result.data) {
        setJobs(result.data.jobs || []);
        setTotal(result.data.total || 0);
        setConfigured(result.data.configured || false);
        setLastRefresh(new Date());
      } else {
        // Keep last known data, but show error
        setError(result.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Error fetching system jobs:', err);
      
      // Keep last known data, but show error
      if (err?.httpStatus === 403) {
        setError("You don't have permission to view system jobs.");
      } else if (err?.httpStatus === 429) {
        setError("Rate limit exceeded. Please wait before refreshing.");
      } else {
        setError(err?.message || 'Failed to load system jobs. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [canRead, statusFilter, searchQuery]);

  // Fetch job details
  const fetchJobDetails = useCallback(async (jobId) => {
    if (!canRead || !jobId) return;

    try {
      setSelectedJobLoading(true);
      const result = await getSystemJob(jobId);

      if (result.ok && result.data) {
        setSelectedJobDetails(result.data.job);
      } else {
        setSelectedJobDetails(null);
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setSelectedJobDetails(null);
    } finally {
      setSelectedJobLoading(false);
    }
  }, [canRead]);

  // Handle job selection
  const handleJobClick = (job) => {
    setSelectedJob(job);
    if (job?.id) {
      fetchJobDetails(job.id);
    }
  };

  // Handle retry
  const handleRetry = async (jobId) => {
    if (!canWrite || !jobId) return;

    try {
      const result = await retrySystemJob(jobId);
      if (result.ok) {
        // Refresh jobs list
        fetchJobs(false);
        // Close detail panel if this job was selected
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
          setSelectedJobDetails(null);
        }
      } else {
        alert(result.error || 'Failed to retry job');
      }
    } catch (err) {
      console.error('Error retrying job:', err);
      alert(err?.message || 'Failed to retry job');
    }
  };

  // Handle cancel
  const handleCancel = async (jobId) => {
    if (!canWrite || !jobId) return;

    if (!confirm('Are you sure you want to cancel this job?')) {
      return;
    }

    try {
      const result = await cancelSystemJob(jobId);
      if (result.ok) {
        // Refresh jobs list
        fetchJobs(false);
        // Close detail panel if this job was selected
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
          setSelectedJobDetails(null);
        }
      } else {
        alert(result.error || 'Failed to cancel job');
      }
    } catch (err) {
      console.error('Error canceling job:', err);
      alert(err?.message || 'Failed to cancel job');
    }
  };

  // Refetch when filters change (fetchJobs already depends on statusFilter and searchQuery)
  useEffect(() => {
    if (canRead) {
      fetchJobs(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, canRead]);

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
        fetchJobs(false);
        refreshIntervalRef.current = setInterval(() => {
          if (isVisibleRef.current) {
            fetchJobs(false);
          }
        }, REFRESH_INTERVAL_MS);
      }
    };

    // Set up initial interval
    refreshIntervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        fetchJobs(false);
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
  }, [canRead, fetchJobs]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    fetchJobs(true);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || 'unknown';
    return `job-status-badge job-status-${statusLower}`;
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
    return <AdminNotAuthorized requiredPermission={SYSTEM_JOBS_READ} />;
  }

  // Loading state
  if (loading && jobs.length === 0) {
    return (
      <div className="admin-system-jobs-page">
        <div className="admin-system-jobs-header">
          <h1>Background Jobs</h1>
        </div>
        <div className="admin-system-jobs-content">
          <div className="jobs-loading">
            <p>Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-system-jobs-page">
      <div className="admin-system-jobs-header">
        <div className="admin-system-jobs-header-content">
          <div>
            <h1>Background Jobs</h1>
            {lastRefresh && (
              <p className="admin-system-jobs-subtitle">
                Last updated: {lastRefresh.toLocaleString()}
                {configured && ` • Auto-refresh: ${REFRESH_INTERVAL_MS / 1000}s`}
              </p>
            )}
          </div>
          <div className="admin-system-jobs-header-actions">
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

      <div className="admin-system-jobs-content">
        {/* Error banner */}
        {error && (
          <div className="jobs-error-banner">
            <span className="jobs-error-icon">⚠️</span>
            <span className="jobs-error-message">{error}</span>
            {jobs.length > 0 && (
              <span className="jobs-error-note">
                (Showing last known results)
              </span>
            )}
          </div>
        )}

        {/* Not configured banner */}
        {!configured && (
          <div className="jobs-not-configured-banner">
            <span className="jobs-not-configured-icon">ℹ️</span>
            <span className="jobs-not-configured-message">
              Queue is not configured yet. The system is operating in read-only mode.
            </span>
          </div>
        )}

        {/* Toolbar */}
        <div className="jobs-toolbar">
          <div className="jobs-toolbar-filters">
            <select
              className="jobs-status-filter"
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
              className="jobs-search-input"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Jobs table */}
        {jobs.length === 0 ? (
          <div className="jobs-empty-state">
            <p>No jobs found</p>
            {!configured && (
              <p className="jobs-empty-state-note">
                Configure a queue system to see background jobs here.
              </p>
            )}
          </div>
        ) : (
          <div className="jobs-table-container">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`jobs-table-row ${selectedJob?.id === job.id ? 'selected' : ''}`}
                    onClick={() => handleJobClick(job)}
                  >
                    <td className="jobs-table-id">{job.id?.substring(0, 8) || 'N/A'}</td>
                    <td className="jobs-table-name">{job.name || 'Unnamed Job'}</td>
                    <td>
                      <span className={getStatusBadgeClass(job.status)}>
                        {job.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="jobs-table-attempts">
                      {job.attempts != null ? `${job.attempts}/${job.maxAttempts || 'N/A'}` : 'N/A'}
                    </td>
                    <td className="jobs-table-updated">{formatDate(job.updatedAt)}</td>
                    <td className="jobs-table-actions" onClick={(e) => e.stopPropagation()}>
                      {job.status === 'failed' && canWrite && configured && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleRetry(job.id)}
                          title="Retry job"
                        >
                          Retry
                        </button>
                      )}
                      {(job.status === 'queued' || job.status === 'running') && canWrite && configured && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancel(job.id)}
                          title="Cancel job"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Job details panel */}
        {selectedJob && (
          <div className="jobs-detail-panel">
            <div className="jobs-detail-panel-header">
              <h2>Job Details</h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setSelectedJob(null);
                  setSelectedJobDetails(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="jobs-detail-panel-content">
              {selectedJobLoading ? (
                <p>Loading job details...</p>
              ) : selectedJobDetails ? (
                <div className="jobs-detail-info">
                  <div className="jobs-detail-field">
                    <label>ID:</label>
                    <span>{selectedJobDetails.id || 'N/A'}</span>
                  </div>
                  <div className="jobs-detail-field">
                    <label>Name:</label>
                    <span>{selectedJobDetails.name || 'Unnamed Job'}</span>
                  </div>
                  <div className="jobs-detail-field">
                    <label>Status:</label>
                    <span className={getStatusBadgeClass(selectedJobDetails.status)}>
                      {selectedJobDetails.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="jobs-detail-field">
                    <label>Attempts:</label>
                    <span>
                      {selectedJobDetails.attempts != null
                        ? `${selectedJobDetails.attempts}/${selectedJobDetails.maxAttempts || 'N/A'}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="jobs-detail-field">
                    <label>Created At:</label>
                    <span>{formatDate(selectedJobDetails.createdAt)}</span>
                  </div>
                  <div className="jobs-detail-field">
                    <label>Updated At:</label>
                    <span>{formatDate(selectedJobDetails.updatedAt)}</span>
                  </div>
                  {selectedJobDetails.payloadPreview && (
                    <div className="jobs-detail-field">
                      <label>Payload Preview:</label>
                      <pre className="jobs-detail-payload">
                        {JSON.stringify(selectedJobDetails.payloadPreview, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedJobDetails.errorPreview && (
                    <div className="jobs-detail-field">
                      <label>Error Preview:</label>
                      <pre className="jobs-detail-error">
                        {selectedJobDetails.errorPreview}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p>Job details not available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSystemJobsPage;

/**
 * Admin Routes (Phase 6)
 * 
 * All routes in this file are protected by admin-level access control.
 * Requires: FOUNDER, CORE_TEAM, or ADMIN role (or MANAGE_USERS permission)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { adminDegradedMode } from '../middleware/adminDegradedMode.js';
import { createAuditLogsRateLimiter, createBulkStatusRateLimiter, createAuditExportRateLimiter, createAdminSettingsWriteRateLimiter, createSystemHealthRateLimiter, createSystemJobsReadRateLimiter, createSystemJobsWriteRateLimiter, createAdminSessionsReadRateLimiter, createAdminSessionsWriteRateLimiter } from '../middleware/rateLimit.js';
import {
  listAdminUsers,
  getAdminUserDetail,
  getAdminNavigation,
  assignAdminUserRole,
  updateAdminUserRole,
  updateAdminUserStatus,
  toggleAdminUserStatus,
  updateAdminUserFeatureFlags,
  getAdminUserActivity,
  getAdminUserDevices,
  getAdminUserSessions,
  revokeAdminUserSession,
  revokeAllAdminUserSessions,
  listAdminAuditLogs,
  exportAuditLogsCsv,
  getAllSettings,
  setSetting,
  getAdminRoles,
  updateAdminRole,
  bulkUpdateUserStatus,
  getSystemHealthStatus,
  listSystemJobs,
  getSystemJob,
  retrySystemJob,
  cancelSystemJob,
  listAdminSessions,
  revokeAdminSessionEndpoint,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// All admin routes require admin-level access (role containing ADMIN or equivalent)
// Uses consistent JSON error responses via requireAdmin middleware
router.use(requireAdmin);

// Degraded mode signaling middleware (adds X-Admin-Mode header)
router.use(adminDegradedMode);

// GET /api/v1/admin/navigation - Get admin navigation structure
router.get('/navigation', getAdminNavigation);

// GET /api/v1/admin/users - List users with pagination and filters
router.get('/users', listAdminUsers);

// GET /api/v1/admin/users/:userId - Get detailed user information
router.get('/users/:userId', getAdminUserDetail);

// PATCH /api/v1/admin/users/:userId/role - Assign or remove user role (A2.1)
router.patch('/users/:userId/role', assignAdminUserRole);

// PUT /api/v1/admin/users/:userId/role - Update user role (legacy endpoint)
router.put('/users/:userId/role', updateAdminUserRole);

// PUT /api/v1/admin/users/:userId/status - Update user account status
router.put('/users/:userId/status', updateAdminUserStatus);

// PATCH /api/v1/admin/users/:userId/toggle-status - Toggle user account status (ACTIVE ↔ DISABLED)
router.patch('/users/:userId/toggle-status', toggleAdminUserStatus);

// PUT /api/v1/admin/users/:userId/feature-flags - Update user feature flags
router.put('/users/:userId/feature-flags', updateAdminUserFeatureFlags);

// GET /api/v1/admin/users/:userId/activity - Get paginated activity log
router.get('/users/:userId/activity', getAdminUserActivity);

// GET /api/v1/admin/users/:userId/devices - Get user devices
router.get('/users/:userId/devices', getAdminUserDevices);

// GET /api/v1/admin/users/:userId/sessions - Get user sessions
router.get('/users/:userId/sessions', getAdminUserSessions);

// POST /api/v1/admin/users/:userId/sessions/revoke - Revoke a specific session
router.post('/users/:userId/sessions/revoke', revokeAdminUserSession);

// POST /api/v1/admin/users/:userId/sessions/revoke-all - Revoke all sessions
router.post('/users/:userId/sessions/revoke-all', revokeAllAdminUserSessions);

// GET /api/v1/admin/audit-logs - List admin audit logs with filtering and pagination
// Rate limited: 60 requests per minute per user (configurable via env)
router.get('/audit-logs', createAuditLogsRateLimiter(), listAdminAuditLogs);

// GET /api/v1/admin/audit-logs/export.csv - Export audit logs as CSV with filtering
// Rate limited: 3 exports per minute per admin user
router.get('/audit-logs/export.csv', createAuditExportRateLimiter(), exportAuditLogsCsv);

// GET /api/v1/admin/roles - Get roles overview with permissions (read-only)
router.get('/roles', getAdminRoles);

// PUT /api/v1/admin/roles/:roleName - Update role permission set (founder-only, B2)
router.put('/roles/:roleName', updateAdminRole);

// POST /api/v1/admin/users/bulk-status - Bulk user status changes (A3)
// Rate limited: 5 requests per minute per admin
router.post('/users/bulk-status', createBulkStatusRateLimiter(), bulkUpdateUserStatus);

// GET /api/v1/admin/settings - Get all platform settings (D1)
// Requires: ADMIN_SETTINGS_READ permission
router.get('/settings', getAllSettings);

// PUT /api/v1/admin/settings/:key - Update a platform setting (D1)
// Rate limited: 20 changes per minute per admin user
// Requires: ADMIN_SETTINGS_WRITE permission
router.put('/settings/:key', createAdminSettingsWriteRateLimiter(), setSetting);

// GET /api/v1/admin/health - Get system health status (E1)
// Rate limited: 60 requests per minute per admin user
// Requires: SYSTEM_HEALTH_READ permission
router.get('/health', createSystemHealthRateLimiter(), getSystemHealthStatus);

// GET /api/v1/admin/jobs - List system jobs with filtering (E2)
// Rate limited: 120 requests per minute per admin user
// Requires: SYSTEM_JOBS_READ permission
router.get('/jobs', createSystemJobsReadRateLimiter(), listSystemJobs);

// GET /api/v1/admin/jobs/:jobId - Get job details (E2)
// Rate limited: 120 requests per minute per admin user
// Requires: SYSTEM_JOBS_READ permission
router.get('/jobs/:jobId', createSystemJobsReadRateLimiter(), getSystemJob);

// POST /api/v1/admin/jobs/:jobId/retry - Retry a failed job (E2)
// Rate limited: 20 requests per minute per admin user
// Requires: SYSTEM_JOBS_WRITE permission
router.post('/jobs/:jobId/retry', createSystemJobsWriteRateLimiter(), retrySystemJob);

// POST /api/v1/admin/jobs/:jobId/cancel - Cancel a queued or running job (E2)
// Rate limited: 20 requests per minute per admin user
// Requires: SYSTEM_JOBS_WRITE permission
router.post('/jobs/:jobId/cancel', createSystemJobsWriteRateLimiter(), cancelSystemJob);

// GET /api/v1/admin/sessions - List admin sessions with filtering (F1)
// Rate limited: 120 requests per minute per admin user
// Requires: ADMIN_SESSIONS_READ permission
router.get('/sessions', createAdminSessionsReadRateLimiter(), listAdminSessions);

// POST /api/v1/admin/sessions/:sessionId/revoke - Revoke an admin session (F1)
// Rate limited: 20 requests per minute per admin user
// Requires: ADMIN_SESSIONS_WRITE permission
router.post('/sessions/:sessionId/revoke', createAdminSessionsWriteRateLimiter(), revokeAdminSessionEndpoint);

export default router;

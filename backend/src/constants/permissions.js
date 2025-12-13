// backend/src/constants/permissions.js

/**
 * Authoritative Permission Registry
 * 
 * This is the SINGLE SOURCE OF TRUTH for all permissions in the system.
 * No permission strings may be defined elsewhere.
 * 
 * Rules:
 * - All permissions must be defined here
 * - Registry is frozen (immutable)
 * - Backend is authoritative
 * - Frontend can only consume, not invent
 */

export const PERMISSIONS = Object.freeze({
  // Users Management Permissions
  ADMIN_USERS_READ: 'ADMIN_USERS_READ',
  ADMIN_USERS_WRITE: 'ADMIN_USERS_WRITE',

  // Roles Management Permissions
  ADMIN_ROLES_READ: 'ADMIN_ROLES_READ',
  ADMIN_ROLES_WRITE: 'ADMIN_ROLES_WRITE',

  // Audit Logs Permissions
  ADMIN_AUDIT_READ: 'ADMIN_AUDIT_READ',

  // Settings Permissions
  ADMIN_SETTINGS_READ: 'ADMIN_SETTINGS_READ',
  ADMIN_SETTINGS_WRITE: 'ADMIN_SETTINGS_WRITE',

  // System Health Permissions
  SYSTEM_HEALTH_READ: 'SYSTEM_HEALTH_READ',

  // System Jobs Permissions
  SYSTEM_JOBS_READ: 'SYSTEM_JOBS_READ',
  SYSTEM_JOBS_WRITE: 'SYSTEM_JOBS_WRITE',

  // Admin Sessions Permissions
  ADMIN_SESSIONS_READ: 'ADMIN_SESSIONS_READ',
  ADMIN_SESSIONS_WRITE: 'ADMIN_SESSIONS_WRITE',
});

/**
 * Get all permission values as an array
 * Useful for validation and iteration
 */
export const ALL_PERMISSIONS = Object.freeze(Object.values(PERMISSIONS));

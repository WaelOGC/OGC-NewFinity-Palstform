/**
 * Audit Event Constants
 * 
 * Centralized definitions of all audit log event types.
 * All event names should be defined here to ensure consistency.
 */

export const AUDIT_EVENTS = Object.freeze({
  ADMIN_USER_STATUS_CHANGE: 'ADMIN_USER_STATUS_CHANGE',
  ADMIN_USER_ROLES_CHANGE: 'ADMIN_USER_ROLES_CHANGE',
  ADMIN_SETTINGS_CHANGE: 'ADMIN_SETTINGS_CHANGE',
  ADMIN_SESSION_REVOKE: 'ADMIN_SESSION_REVOKE',
});

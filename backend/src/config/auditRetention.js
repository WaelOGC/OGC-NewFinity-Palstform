// backend/src/config/auditRetention.js

/**
 * Audit Log Retention Configuration
 * 
 * Single source of truth for audit log retention policy.
 * Defines how long audit logs should be retained before cleanup.
 * 
 * Purpose: Prevents uncontrolled database growth by automatically
 * removing audit logs older than the retention period.
 * 
 * Default: 180 days (6 months)
 * 
 * To change retention period, update AUDIT_LOG_RETENTION_DAYS below.
 */

export const AUDIT_LOG_RETENTION_DAYS = 180;

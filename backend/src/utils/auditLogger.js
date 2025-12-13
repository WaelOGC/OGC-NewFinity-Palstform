// backend/src/utils/auditLogger.js

/**
 * Admin Audit Logger Utility
 * 
 * Writes audit log entries to AdminAuditLog table.
 * Never throws errors - silently fails to avoid breaking request flow.
 * 
 * Future write endpoints must log ADMIN_USER_STATUS_CHANGE events.
 * Meta must include { oldStatus, newStatus, targetUserId }.
 */

import pool from '../db.js';
import { createAuditLog } from '../services/auditLogService.js';
import { AUDIT_EVENTS } from '../constants/auditEvents.js';

let tableExistsCache = null;
let tableExistsCheckTime = null;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Check if AdminAuditLog table exists (with caching)
 * @returns {Promise<boolean>} True if table exists
 */
async function checkTableExists() {
  const now = Date.now();
  
  // Use cached result if available and not expired
  if (tableExistsCache !== null && tableExistsCheckTime && (now - tableExistsCheckTime) < CACHE_TTL) {
    return tableExistsCache;
  }

  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'AdminAuditLog'`
    );
    const exists = rows[0]?.count > 0;
    tableExistsCache = exists;
    tableExistsCheckTime = now;
    return exists;
  } catch (err) {
    tableExistsCache = false;
    tableExistsCheckTime = now;
    return false;
  }
}

/**
 * Sanitize metadata to remove secrets/tokens
 * @param {Object} meta - Metadata object
 * @returns {Object} Sanitized metadata
 */
function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') {
    return meta;
  }

  const sanitized = { ...meta };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'session'];
  
  for (const key in sanitized) {
    const keyLower = key.toLowerCase();
    if (sensitiveKeys.some(sk => keyLower.includes(sk))) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

/**
 * Write an admin audit log entry
 * 
 * @param {Object} params - Audit log parameters
 * @param {Object} [params.req] - Express request object (for IP and requestId)
 * @param {number} [params.actorUserId] - Actor user ID
 * @param {string} [params.actorEmail] - Actor email
 * @param {string} params.action - Action type (required)
 * @param {string} [params.targetType] - Target entity type
 * @param {string|number} [params.targetId] - Target entity ID
 * @param {string} [params.status] - Status (e.g., SUCCESS, FAILED)
 * @param {string} [params.message] - Short message
 * @param {Object} [params.meta] - Additional metadata (will be sanitized)
 * @returns {Promise<Object|null>} Created log entry or null if failed
 */
export async function writeAdminAuditLog({
  req = null,
  actorUserId = null,
  actorEmail = null,
  action,
  targetType = null,
  targetId = null,
  status = null,
  message = null,
  meta = null,
}) {
  if (!action) {
    return null;
  }

  // Check if table exists
  const exists = await checkTableExists();
  if (!exists) {
    // Log warning only once per process
    if (!global._auditLogTableWarningLogged) {
      console.warn('[AUDIT_LOGGER] AdminAuditLog table does not exist. Audit logging disabled.');
      global._auditLogTableWarningLogged = true;
    }
    return null;
  }

  // Extract IP and requestId from request if available
  let ip = null;
  let requestId = null;

  if (req) {
    ip = req.ip || 
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         null;
    requestId = req.requestId || null;
  }

  // Sanitize metadata
  const sanitizedMeta = meta ? sanitizeMeta(meta) : null;
  const metaJson = sanitizedMeta ? JSON.stringify(sanitizedMeta) : null;

  // Convert targetId to string if it's a number
  const targetIdStr = targetId !== null && targetId !== undefined ? String(targetId) : null;

  try {
    const [result] = await pool.query(
      `INSERT INTO AdminAuditLog 
       (actorUserId, actorEmail, action, targetType, targetId, status, ip, requestId, message, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [actorUserId, actorEmail, action, targetType, targetIdStr, status, ip, requestId, message, metaJson]
    );

    return {
      id: result.insertId,
      actorUserId,
      actorEmail,
      action,
      targetType,
      targetId: targetIdStr,
      status,
      ip,
      requestId,
      message,
      meta: sanitizedMeta,
    };
  } catch (err) {
    // Never throw - silently fail
    // Only log error if it's not a table/column issue (those are expected during schema drift)
    if (err.code !== 'ER_NO_SUCH_TABLE' && 
        err.code !== 'ER_BAD_FIELD_ERROR' && 
        !err.message?.includes('Unknown column')) {
      console.error('[AUDIT_LOGGER] Failed to write audit log:', err.message);
    }
    return null;
  }
}

/**
 * Log admin user status change event
 * 
 * This function logs ADMIN_USER_STATUS_CHANGE events to the audit_logs table.
 * It is best-effort and defensive - never throws errors to avoid breaking request flow.
 * 
 * @param {Object} params - Status change parameters
 * @param {Object} params.actor - Actor object with id property (admin performing action)
 * @param {number} params.targetUserId - Target user ID whose status is being changed
 * @param {string} params.fromStatus - Previous status value
 * @param {string} params.toStatus - New status value
 * @param {string|null} [params.reason] - Optional reason for status change
 * @param {Object} [params.req] - Express request object (for IP and user agent extraction)
 * @returns {Promise<Object>} Result object with { ok: true } or { ok: false, error: string }
 */
export async function logAdminUserStatusChange({
  actor,
  targetUserId,
  fromStatus,
  toStatus,
  reason = null,
  req = null,
}) {
  try {
    // Extract actorId from actor object
    const actorId = actor?.id !== null && actor?.id !== undefined 
      ? parseInt(actor.id) 
      : null;

    // Validate required fields
    if (!targetUserId) {
      console.error('[AuditLog] logAdminUserStatusChange: targetUserId is required');
      return { ok: false, error: 'targetUserId is required' };
    }

    if (!fromStatus || !toStatus) {
      console.error('[AuditLog] logAdminUserStatusChange: fromStatus and toStatus are required');
      return { ok: false, error: 'fromStatus and toStatus are required' };
    }

    // Extract IP from request (best-effort)
    let ip = null;
    if (req) {
      ip = req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           null;
    }

    // Extract user agent from request (best-effort)
    const userAgent = req?.headers?.['user-agent'] || null;

    // Build metadata object with status change information
    const metaJson = {
      fromStatus,
      toStatus,
      reason: reason || null,
    };

    // Create audit log entry using the service
    const result = await createAuditLog({
      event: AUDIT_EVENTS.ADMIN_USER_STATUS_CHANGE,
      actorUserId: actorId,
      targetUserId: parseInt(targetUserId),
      metaJson,
      ip,
      userAgent,
    });

    // Return result (service already handles errors gracefully)
    return result;
  } catch (err) {
    // Defensive: catch any unexpected errors and never throw
    console.error('[AuditLog] logAdminUserStatusChange unexpected error:', err.message);
    return { ok: false, error: err.message || 'Unexpected error' };
  }
}

/**
 * Log admin user roles change event
 * 
 * This function logs ADMIN_USER_ROLES_CHANGE events to the audit_logs table.
 * It is best-effort and defensive - never throws errors to avoid breaking request flow.
 * 
 * @param {Object} params - Roles change parameters
 * @param {Object} params.actor - Actor object with id property (admin performing action)
 * @param {number} params.targetUserId - Target user ID whose role is being changed
 * @param {string|string[]} params.rolesBefore - Previous role(s) value(s) - will be normalized to lowercase
 * @param {string|string[]} params.rolesAfter - New role(s) value(s) - will be normalized to lowercase
 * @param {string|null} [params.reason] - Optional reason for role change
 * @param {Object} [params.req] - Express request object (for IP and user agent extraction)
 * @returns {Promise<Object>} Result object with { ok: true } or { ok: false, error: string }
 */
export async function logAdminUserRolesChange({
  actor,
  targetUserId,
  rolesBefore,
  rolesAfter,
  reason = null,
  req = null,
}) {
  try {
    // Extract actorId from actor object
    const actorId = actor?.id !== null && actor?.id !== undefined 
      ? parseInt(actor.id) 
      : null;

    // Validate required fields
    if (!targetUserId) {
      console.error('[AuditLog] logAdminUserRolesChange: targetUserId is required');
      return { ok: false, error: 'targetUserId is required' };
    }

    if (rolesBefore === null || rolesBefore === undefined) {
      console.error('[AuditLog] logAdminUserRolesChange: rolesBefore is required');
      return { ok: false, error: 'rolesBefore is required' };
    }

    if (rolesAfter === null || rolesAfter === undefined) {
      console.error('[AuditLog] logAdminUserRolesChange: rolesAfter is required');
      return { ok: false, error: 'rolesAfter is required' };
    }

    // Normalize role values to lowercase (single role string or array of roles)
    const normalizeRole = (role) => {
      if (Array.isArray(role)) {
        return role.map(r => (r || '').toString().toLowerCase().trim()).filter(r => r);
      }
      return (role || '').toString().toLowerCase().trim();
    };

    const normalizedRolesBefore = normalizeRole(rolesBefore);
    const normalizedRolesAfter = normalizeRole(rolesAfter);

    // Extract IP from request (best-effort)
    let ip = null;
    if (req) {
      ip = req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           null;
    }

    // Extract user agent from request (best-effort)
    const userAgent = req?.headers?.['user-agent'] || null;

    // Build metadata object with role change information
    const metaJson = {
      rolesBefore: normalizedRolesBefore,
      rolesAfter: normalizedRolesAfter,
      reason: reason || null,
    };

    // Create audit log entry using the service
    const result = await createAuditLog({
      event: AUDIT_EVENTS.ADMIN_USER_ROLES_CHANGE,
      actorUserId: actorId,
      targetUserId: parseInt(targetUserId),
      metaJson,
      ip,
      userAgent,
    });

    // Return result (service already handles errors gracefully)
    return result;
  } catch (err) {
    // Defensive: catch any unexpected errors and never throw
    console.error('[AuditLog] logAdminUserRolesChange unexpected error:', err.message);
    return { ok: false, error: err.message || 'Unexpected error' };
  }
}

/**
 * Log admin settings change event
 * 
 * This function logs ADMIN_SETTINGS_CHANGE events to the audit_logs table.
 * It is best-effort and defensive - never throws errors to avoid breaking request flow.
 * 
 * @param {Object} params - Settings change parameters
 * @param {Object} params.actor - Actor object with id property (admin performing action)
 * @param {string} params.key - Setting key that was changed
 * @param {*} params.valueBefore - Previous value
 * @param {*} params.valueAfter - New value
 * @param {string|null} [params.reason] - Optional reason for change
 * @param {Object} [params.req] - Express request object (for IP and user agent extraction)
 * @returns {Promise<Object>} Result object with { ok: true } or { ok: false, error: string }
 */
export async function logAdminSettingsChange({
  actor,
  key,
  valueBefore,
  valueAfter,
  reason = null,
  req = null,
}) {
  try {
    // Extract actorId from actor object
    const actorId = actor?.id !== null && actor?.id !== undefined 
      ? parseInt(actor.id) 
      : null;

    // Validate required fields
    if (!key) {
      console.error('[AuditLog] logAdminSettingsChange: key is required');
      return { ok: false, error: 'key is required' };
    }

    // Extract IP from request (best-effort)
    let ip = null;
    if (req) {
      ip = req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           null;
    }

    // Extract user agent from request (best-effort)
    const userAgent = req?.headers?.['user-agent'] || null;

    // Build metadata object with settings change information
    const metaJson = {
      key,
      valueBefore,
      valueAfter,
      reason: reason || null,
    };

    // Create audit log entry using the service
    const result = await createAuditLog({
      event: AUDIT_EVENTS.ADMIN_SETTINGS_CHANGE,
      actorUserId: actorId,
      targetUserId: null, // Settings changes don't have a target user
      metaJson,
      ip,
      userAgent,
    });

    // Return result (service already handles errors gracefully)
    return result;
  } catch (err) {
    // Defensive: catch any unexpected errors and never throw
    console.error('[AuditLog] logAdminSettingsChange unexpected error:', err.message);
    return { ok: false, error: err.message || 'Unexpected error' };
  }
}

/**
 * Log admin session revocation event
 * 
 * This function logs ADMIN_SESSION_REVOKE events to the audit_logs table.
 * It is best-effort and defensive - never throws errors to avoid breaking request flow.
 * 
 * @param {Object} params - Session revocation parameters
 * @param {Object} params.actor - Actor object with id property (admin performing action)
 * @param {string|number} params.sessionId - Session ID that was revoked
 * @param {number} params.targetUserId - User ID whose session was revoked
 * @param {string|null} [params.reason] - Optional reason for revocation
 * @param {Object} [params.req] - Express request object (for IP and user agent extraction)
 * @returns {Promise<Object>} Result object with { ok: true } or { ok: false, error: string }
 */
export async function logAdminSessionRevoke({
  actor,
  sessionId,
  targetUserId,
  reason = null,
  req = null,
}) {
  try {
    // Extract actorId from actor object
    const actorId = actor?.id !== null && actor?.id !== undefined 
      ? parseInt(actor.id) 
      : null;

    // Validate required fields
    if (!sessionId || !targetUserId) {
      console.error('[AuditLog] logAdminSessionRevoke: sessionId and targetUserId are required');
      return { ok: false, error: 'sessionId and targetUserId are required' };
    }

    // Extract IP from request (best-effort)
    let ip = null;
    if (req) {
      ip = req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           null;
    }

    // Extract user agent from request (best-effort)
    const userAgent = req?.headers?.['user-agent'] || null;

    // Build metadata object with session revocation information
    const metaJson = {
      sessionId: String(sessionId),
      reason: reason || null,
    };

    // Create audit log entry using the service
    const result = await createAuditLog({
      event: AUDIT_EVENTS.ADMIN_SESSION_REVOKE,
      actorUserId: actorId,
      targetUserId: parseInt(targetUserId),
      metaJson,
      ip,
      userAgent,
    });

    // Return result (service already handles errors gracefully)
    return result;
  } catch (err) {
    // Defensive: catch any unexpected errors and never throw
    console.error('[AuditLog] logAdminSessionRevoke unexpected error:', err.message);
    return { ok: false, error: err.message || 'Unexpected error' };
  }
}

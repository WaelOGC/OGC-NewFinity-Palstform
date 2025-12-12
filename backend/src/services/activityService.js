/**
 * Centralized Activity Logging Service (Phase 8.6)
 * 
 * Provides a unified interface for logging user activity, security events, and admin actions.
 * All activity logs are written to the UserActivityLog table with actor vs. target separation.
 */

import pool from "../db.js";

/**
 * Map activity types to human-readable descriptions
 */
const activityDescriptions = {
  // Authentication events
  LOGIN_SUCCESS: 'Successful login',
  LOGIN_FAILED: 'Failed login attempt',
  LOGIN_CHALLENGE_2FA: '2FA challenge required',
  LOGIN_SUCCESS_2FA: 'Successful login with 2FA',
  
  // Password events
  PASSWORD_CHANGED: 'Password changed',
  
  // 2FA events
  TWO_FACTOR_ENABLED: 'Two-factor authentication enabled',
  TWO_FACTOR_DISABLED: 'Two-factor authentication disabled',
  TWO_FACTOR_FAILED: 'Failed 2FA verification attempt',
  
  // Profile events
  PROFILE_UPDATED: 'Profile updated',
  
  // Device events
  DEVICE_REVOKED: 'Device revoked',
  
  // Session events
  SESSION_REVOKED: 'Session revoked',
  SESSIONS_REVOKED_ALL_OTHERS: 'All other sessions revoked',
  ADMIN_SESSION_REVOKED: 'Admin revoked session',
  ADMIN_SESSIONS_REVOKED_ALL: 'Admin revoked all sessions',
  
  // Admin events
  ROLE_CHANGED: 'User role changed',
  STATUS_CHANGED: 'Account status changed',
  FEATURE_FLAGS_UPDATED: 'Feature flags updated',
  ACCESS_DENIED_ADMIN: 'Access denied to admin console',
  
  // Account deletion events (Phase 9.1)
  ACCOUNT_DELETE_FAILED: 'Account deletion failed (invalid password)',
  ACCOUNT_DELETED: 'Account deleted',
};

/**
 * Log user activity to the UserActivityLog table
 * 
 * @param {Object} params - Activity parameters
 * @param {number} params.userId - The subject user (whose account this event is about) - REQUIRED
 * @param {number} [params.actorId] - Who performed the action (null for self, or admin ID for admin actions)
 * @param {string} params.type - Activity type (e.g., LOGIN_SUCCESS, PASSWORD_CHANGED) - REQUIRED
 * @param {string} [params.ipAddress] - IP address
 * @param {string} [params.userAgent] - User agent string
 * @param {Object} [params.metadata] - Additional structured metadata
 * @returns {Promise<void>}
 * 
 * @example
 * // Self action (user changes their own password)
 * await logUserActivity({
 *   userId: user.id,
 *   actorId: user.id, // or null (defaults to userId)
 *   type: 'PASSWORD_CHANGED',
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 *   metadata: { via: 'SELF_CHANGE' }
 * });
 * 
 * @example
 * // Admin action (admin changes user role)
 * await logUserActivity({
 *   userId: targetUser.id,
 *   actorId: adminUser.id,
 *   type: 'ROLE_CHANGED',
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 *   metadata: { oldRole: 'STANDARD_USER', newRole: 'ADMIN' }
 * });
 */
export async function logUserActivity({
  userId,
  actorId = null,
  type,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) {
  if (!userId || !type) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Activity] Missing userId or type for activity log", {
        userId,
        type,
      });
    }
    return;
  }

  // Default actorId to userId if not provided (self-action)
  const finalActorId = actorId !== null ? actorId : userId;

  const description = activityDescriptions[type] || type;

  try {
    await pool.query(
      `
      INSERT INTO UserActivityLog (userId, actorId, activityType, description, ipAddress, userAgent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        finalActorId,
        type,
        description,
        ipAddress,
        userAgent,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Activity] Failed to log user activity", {
        error: err,
        userId,
        type,
      });
    }
    // Never throw; logging must not break primary flows
  }
}

/**
 * Log a security event (alias for logUserActivity for semantic clarity)
 * 
 * @param {Object} params - Same as logUserActivity
 */
export async function logSecurityEvent(params) {
  return logUserActivity(params);
}

/**
 * Log an admin action (alias for logUserActivity with actorId validation)
 * 
 * @param {Object} params - Same as logUserActivity, but actorId should be provided
 */
export async function logAdminAction(params) {
  if (!params.actorId && process.env.NODE_ENV !== "production") {
    console.warn("[Activity] Admin action should include actorId", params);
  }
  return logUserActivity(params);
}

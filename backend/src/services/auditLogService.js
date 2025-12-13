/**
 * Audit Log Service
 * 
 * Provides non-throwing database insert operations for audit logs.
 * This service never throws errors - all failures are logged and swallowed
 * to ensure audit logging never breaks the main request flow.
 */

import pool from '../db.js';

/**
 * Create an audit log entry
 * 
 * @param {Object} entry - Audit log entry data
 * @param {string} entry.event - Event type (required)
 * @param {number|null} [entry.actorUserId] - Actor user ID
 * @param {number|null} [entry.targetUserId] - Target user ID
 * @param {Object|null} [entry.metaJson] - Metadata object (will be JSON stringified)
 * @param {string|null} [entry.ip] - IP address
 * @param {string|null} [entry.userAgent] - User agent string
 * @returns {Promise<Object>} Result object with { ok: true } or { ok: false, error: string }
 */
export async function createAuditLog(entry) {
  // Validate minimal structure
  if (!entry || typeof entry !== 'object') {
    console.error('[AuditLog] Invalid entry: entry must be an object');
    return { ok: false, error: 'Invalid entry structure' };
  }

  if (!entry.event || typeof entry.event !== 'string') {
    console.error('[AuditLog] Invalid entry: event is required and must be a string');
    return { ok: false, error: 'Event is required' };
  }

  // Extract and validate fields
  const event = entry.event;
  const actorUserId = entry.actorUserId !== null && entry.actorUserId !== undefined 
    ? parseInt(entry.actorUserId) 
    : null;
  const targetUserId = entry.targetUserId !== null && entry.targetUserId !== undefined 
    ? parseInt(entry.targetUserId) 
    : null;
  const ip = entry.ip && typeof entry.ip === 'string' ? entry.ip.substring(0, 64) : null;
  const userAgent = entry.userAgent && typeof entry.userAgent === 'string' 
    ? entry.userAgent.substring(0, 255) 
    : null;

  // Serialize metadata to JSON
  let metaJson = null;
  if (entry.metaJson !== null && entry.metaJson !== undefined) {
    try {
      metaJson = JSON.stringify(entry.metaJson);
    } catch (err) {
      console.error('[AuditLog] Failed to stringify metaJson:', err.message);
      // Continue without metadata rather than failing
      metaJson = null;
    }
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO audit_logs 
       (event, actor_user_id, target_user_id, meta_json, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [event, actorUserId, targetUserId, metaJson, ip, userAgent]
    );

    return { ok: true, insertId: result.insertId };
  } catch (err) {
    // Never throw - log error and return failure
    console.error('[AuditLog] insert failed:', err.message);
    
    // Log additional context for debugging (but don't expose sensitive data)
    if (err.code) {
      console.error('[AuditLog] Error code:', err.code);
    }
    
    return { ok: false, error: err.message || 'Unknown database error' };
  }
}

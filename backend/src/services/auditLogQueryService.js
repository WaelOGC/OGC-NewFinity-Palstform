// backend/src/services/auditLogQueryService.js

/**
 * Audit Log Query Service
 * 
 * Query audit logs from the audit_logs table with filtering support.
 * Used for CSV export functionality.
 * 
 * Defensive: Returns empty array if table doesn't exist or query fails.
 */

import pool from '../db.js';

/**
 * Query audit logs with filters
 * @param {Object} options - Query options
 * @param {string} [options.q] - Search query (searches event and meta_json as text)
 * @param {string} [options.event] - Exact event name filter
 * @param {number} [options.actorUserId] - Filter by actor user ID
 * @param {number} [options.targetUserId] - Filter by target user ID
 * @param {string} [options.dateFrom] - ISO date string (start date, inclusive)
 * @param {string} [options.dateTo] - ISO date string (end date, inclusive)
 * @param {number} [options.limit] - Maximum rows to return (default: 5000, max: 20000)
 * @returns {Promise<Array>} Array of audit log rows
 */
export async function queryAuditLogs({
  q = null,
  event = null,
  actorUserId = null,
  targetUserId = null,
  dateFrom = null,
  dateTo = null,
  limit = 5000,
} = {}) {
  try {
    // Normalize and clamp limit
    const normalizedLimit = Math.min(20000, Math.max(1, parseInt(limit) || 5000));

    // Build WHERE conditions with parameterized queries
    const conditions = [];
    const params = [];

    // Event filter (exact match)
    if (event && typeof event === 'string' && event.trim()) {
      conditions.push('event = ?');
      params.push(event.trim());
    }

    // Actor user ID filter
    if (actorUserId !== null && actorUserId !== undefined) {
      const actorId = parseInt(actorUserId);
      if (!isNaN(actorId) && actorId > 0) {
        conditions.push('actor_user_id = ?');
        params.push(actorId);
      }
    }

    // Target user ID filter
    if (targetUserId !== null && targetUserId !== undefined) {
      const targetId = parseInt(targetUserId);
      if (!isNaN(targetId) && targetId > 0) {
        conditions.push('target_user_id = ?');
        params.push(targetId);
      }
    }

    // Date range filters
    if (dateFrom) {
      try {
        // Validate and normalize date
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          conditions.push('created_at >= ?');
          params.push(fromDate.toISOString().slice(0, 19).replace('T', ' '));
        }
      } catch (e) {
        // Invalid date, skip filter
      }
    }

    if (dateTo) {
      try {
        // Validate and normalize date (set to end of day for inclusivity)
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          // Add 23:59:59 to make it inclusive of the entire day
          toDate.setHours(23, 59, 59, 999);
          conditions.push('created_at <= ?');
          params.push(toDate.toISOString().slice(0, 19).replace('T', ' '));
        }
      } catch (e) {
        // Invalid date, skip filter
      }
    }

    // Search query (q parameter) - search in event and meta_json
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      // Search in event column and meta_json as text (best-effort LIKE search)
      conditions.push('(event LIKE ? OR CAST(meta_json AS CHAR) LIKE ?)');
      params.push(searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Execute query - newest first
    const [rows] = await pool.query(
      `SELECT 
        id,
        created_at,
        event,
        actor_user_id,
        target_user_id,
        ip,
        user_agent,
        meta_json
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ?`,
      [...params, normalizedLimit]
    );

    // Return rows as-is (they'll be converted to CSV in controller)
    return Array.isArray(rows) ? rows : [];

  } catch (err) {
    // Defensive: If table doesn't exist or query fails, return empty array
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR' || 
        err.message?.includes('Unknown column') || err.message?.includes('doesn\'t exist')) {
      console.warn('[AUDIT_LOG_QUERY] Table or column not found:', err.message);
      return [];
    }
    
    // Log error but don't throw - return empty array
    console.error('[AUDIT_LOG_QUERY] Error querying audit logs:', err);
    return [];
  }
}
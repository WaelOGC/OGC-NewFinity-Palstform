/**
 * Admin Audit Log Service (Phase 7)
 * 
 * Provides immutable audit logging for all admin actions.
 * Logs are write-only and cannot be deleted or modified.
 */

import pool from '../db.js';

/**
 * Log an admin action to the audit log
 * @param {Object} params - Audit log parameters
 * @param {number} params.actorId - Admin user ID who performed the action
 * @param {string} params.actorRole - Role of actor at time of action
 * @param {string} params.action - Action type (e.g., ROLE_UPDATED, STATUS_UPDATED, FEATURE_FLAG_UPDATED, ACCESS_DENIED)
 * @param {string} [params.targetType] - Target entity type (e.g., USER, CONTENT, SYSTEM)
 * @param {string|number} [params.targetId] - Target entity ID
 * @param {Object} [params.metadata] - Action metadata including before/after state
 * @param {Object} [params.req] - Express request object (for IP and user agent)
 * @returns {Promise<Object>} Created audit log entry
 */
export async function logAdminAction({
  actorId,
  actorRole,
  action,
  targetType = null,
  targetId = null,
  metadata = null,
  req = null,
}) {
  if (!actorId || !actorRole || !action) {
    throw new Error('actorId, actorRole, and action are required');
  }

  // Extract IP and user agent from request if provided
  let ipAddress = null;
  let userAgent = null;

  if (req) {
    ipAddress = req.ip || 
                req.headers['x-forwarded-for']?.split(',')[0] || 
                req.connection?.remoteAddress || 
                null;
    userAgent = req.headers['user-agent'] || null;
  }

  // Convert targetId to string if it's a number
  const targetIdStr = targetId !== null && targetId !== undefined ? String(targetId) : null;

  // Serialize metadata to JSON
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  try {
    const [result] = await pool.query(
      `INSERT INTO admin_audit_logs 
       (actor_id, actor_role, action, target_type, target_id, metadata, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [actorId, actorRole, action, targetType, targetIdStr, metadataJson, ipAddress, userAgent]
    );

    return {
      id: result.insertId,
      actorId,
      actorRole,
      action,
      targetType,
      targetId: targetIdStr,
      metadata,
      ipAddress,
      userAgent,
      createdAt: new Date(),
    };
  } catch (err) {
    // If table doesn't exist, log warning but don't throw (graceful degradation)
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('admin_audit_logs table does not exist. Audit logging disabled.');
      return null;
    }
    
    // Log error but don't throw (audit logging should not break primary flows)
    console.error('Failed to log admin action:', err);
    return null;
  }
}

/**
 * List admin audit logs with filtering and pagination
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=20] - Items per page
 * @param {string} [params.action] - Filter by action type
 * @param {number} [params.actorId] - Filter by actor ID
 * @param {string} [params.targetType] - Filter by target type
 * @param {Date|string} [params.dateFrom] - Filter from date
 * @param {Date|string} [params.dateTo] - Filter to date
 * @param {string} [params.q] - Free-text search query (searches action, target_type, target_id, actor_role)
 * @returns {Promise<Object>} Paginated audit logs
 */
export async function listAdminAuditLogs({
  page = 1,
  pageSize = 20,
  action = null,
  actorId = null,
  targetType = null,
  dateFrom = null,
  dateTo = null,
  q = null,
} = {}) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];

  // Build WHERE clause
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }

  if (actorId) {
    conditions.push('actor_id = ?');
    params.push(actorId);
  }

  if (targetType) {
    conditions.push('target_type = ?');
    params.push(targetType);
  }

  if (dateFrom) {
    conditions.push('created_at >= ?');
    params.push(dateFrom instanceof Date ? dateFrom.toISOString() : dateFrom);
  }

  if (dateTo) {
    conditions.push('created_at <= ?');
    params.push(dateTo instanceof Date ? dateTo.toISOString() : dateTo);
  }

  // Free-text search (q parameter) - search across action, target_type, target_id, actor_role
  if (q && q.trim()) {
    const searchTerm = `%${q.trim()}%`;
    conditions.push(
      '(action LIKE ? OR target_type LIKE ? OR target_id LIKE ? OR actor_role LIKE ?)'
    );
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    // Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM admin_audit_logs ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Get paginated results
    const [rows] = await pool.query(
      `SELECT 
        id, actor_id, actor_role, action, target_type, target_id,
        metadata, ip_address, user_agent, created_at
       FROM admin_audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    // Parse metadata JSON
    const items = rows.map(row => ({
      id: row.id,
      actorId: row.actor_id,
      actorRole: row.actor_role,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    }));

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (err) {
    // If table doesn't exist, return empty result
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return {
        items: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    }
    throw err;
  }
}

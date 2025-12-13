// backend/src/services/adminSessionService.js

/**
 * Admin Session Service
 * 
 * Provides admin-level session management:
 * - List sessions for admin-capable users (founder, admin, support, viewer)
 * - Revoke sessions (force logout)
 * - All functions are defensive and never throw
 */

import pool from '../db.js';
import { getUserRoles } from './roleService.js';

// Admin-capable roles
const ADMIN_ROLES = ['founder', 'admin', 'support', 'viewer'];

/**
 * Check if a user has an admin-capable role
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user has admin role
 */
async function isAdminUser(userId) {
  if (!userId) return false;

  try {
    const roles = await getUserRoles(userId);
    const roleLower = roles.map(r => (r || '').toLowerCase());
    return ADMIN_ROLES.some(adminRole => roleLower.includes(adminRole));
  } catch (err) {
    console.error('[AdminSessionService] Error checking admin role:', err);
    return false;
  }
}

/**
 * Determine session status based on revokedAt and expiresAt
 * @param {Date|null} revokedAt - Revoked timestamp
 * @param {Date|null} expiresAt - Expiration timestamp
 * @returns {string} Status: 'active', 'revoked', or 'expired'
 */
function getSessionStatus(revokedAt, expiresAt) {
  if (revokedAt) {
    return 'revoked';
  }
  if (expiresAt && new Date(expiresAt) <= new Date()) {
    return 'expired';
  }
  return 'active';
}

/**
 * List admin sessions with filtering and pagination
 * @param {Object} options - Query options
 * @param {string} [options.status] - Filter by status (active, revoked, expired, all)
 * @param {string} [options.q] - Search query (email/username)
 * @param {number} [options.limit=25] - Maximum number of sessions to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<{ok: boolean, sessions: Array, total: number}>}
 */
export async function listAdminSessions({ status = 'all', q, limit = 25, offset = 0 } = {}) {
  try {
    // Validate limit
    const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 25));
    const validOffset = Math.max(0, parseInt(offset) || 0);

    // Build WHERE clause for admin users
    // First, get all admin user IDs
    const adminUserIds = [];
    try {
      // Get users with admin roles from user_roles table
      const [roleRows] = await pool.query(
        `SELECT DISTINCT user_id 
         FROM user_roles 
         WHERE role IN (?) 
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [ADMIN_ROLES.map(r => r.toUpperCase())]
      );
      roleRows.forEach(row => adminUserIds.push(row.user_id));

      // Also check legacy User.role column
      const [userRows] = await pool.query(
        `SELECT id FROM User WHERE role IN (?)`,
        [ADMIN_ROLES.map(r => r.toUpperCase())]
      );
      userRows.forEach(row => {
        if (!adminUserIds.includes(row.id)) {
          adminUserIds.push(row.id);
        }
      });
    } catch (err) {
      // If tables don't exist, continue with empty array
      console.warn('[AdminSessionService] Error fetching admin users:', err.message);
    }

    if (adminUserIds.length === 0) {
      return {
        ok: true,
        sessions: [],
        total: 0,
      };
    }

    // Build WHERE conditions
    const conditions = ['s.userId IN (?)'];
    const params = [adminUserIds];

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        conditions.push('s.revokedAt IS NULL AND (s.expiresAt IS NULL OR s.expiresAt > NOW())');
      } else if (status === 'revoked') {
        conditions.push('s.revokedAt IS NOT NULL');
      } else if (status === 'expired') {
        conditions.push('s.revokedAt IS NULL AND s.expiresAt IS NOT NULL AND s.expiresAt <= NOW()');
      }
    }

    // Search query (email/username)
    if (q && q.trim()) {
      conditions.push('(u.email LIKE ? OR u.username LIKE ? OR u.fullName LIKE ?)');
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total
       FROM AuthSession s
       INNER JOIN User u ON s.userId = u.id
       WHERE ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Get sessions
    const [rows] = await pool.query(
      `SELECT 
         s.id,
         s.userId,
         u.email,
         u.fullName,
         u.username,
         (SELECT GROUP_CONCAT(role SEPARATOR ',') 
          FROM user_roles 
          WHERE user_id = s.userId 
            AND (expires_at IS NULL OR expires_at > NOW())
          LIMIT 1) as roles,
         COALESCE(u.role, '') as legacyRole,
         s.ipAddress as ip,
         s.userAgent,
         s.createdAt,
         s.lastSeenAt,
         s.expiresAt,
         s.revokedAt
       FROM AuthSession s
       INNER JOIN User u ON s.userId = u.id
       WHERE ${whereClause}
       ORDER BY s.lastSeenAt DESC, s.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, validLimit, validOffset]
    );

    // Process rows to determine status and format response
    const sessions = rows.map(row => {
      const statusValue = getSessionStatus(row.revokedAt, row.expiresAt);
      
      // Determine role (use roles from user_roles if available, otherwise legacy role)
      let role = 'STANDARD_USER';
      if (row.roles) {
        const rolesArray = row.roles.split(',').filter(r => r);
        if (rolesArray.length > 0) {
          // Get highest priority role (founder > admin > support > viewer)
          if (rolesArray.some(r => r.toLowerCase() === 'founder')) {
            role = 'FOUNDER';
          } else if (rolesArray.some(r => r.toLowerCase() === 'admin')) {
            role = 'ADMIN';
          } else if (rolesArray.some(r => r.toLowerCase() === 'support')) {
            role = 'SUPPORT';
          } else if (rolesArray.some(r => r.toLowerCase() === 'viewer')) {
            role = 'VIEWER';
          } else {
            role = rolesArray[0].toUpperCase();
          }
        }
      } else if (row.legacyRole) {
        role = row.legacyRole.toUpperCase();
      }

      return {
        id: row.id,
        userId: row.userId,
        email: row.email || '',
        fullName: row.fullName || '',
        username: row.username || '',
        role,
        ip: row.ip || null,
        userAgent: row.userAgent || null,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
        lastSeenAt: row.lastSeenAt ? new Date(row.lastSeenAt).toISOString() : null,
        expiresAt: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
        status: statusValue,
      };
    });

    return {
      ok: true,
      sessions,
      total,
    };
  } catch (err) {
    console.error('[AdminSessionService] Error listing admin sessions:', err);
    // Defensive: return safe empty result on error
    return {
      ok: false,
      sessions: [],
      total: 0,
    };
  }
}

/**
 * Revoke an admin session (force logout)
 * @param {Object} options - Revocation options
 * @param {string|number} options.sessionId - Session ID to revoke
 * @param {number} options.actorUserId - Admin user ID performing the action
 * @param {string} [options.reason] - Optional reason for revocation
 * @returns {Promise<{ok: boolean, revoked: boolean, code?: string, reason?: string}>}
 */
export async function revokeSession({ sessionId, actorUserId, reason } = {}) {
  try {
    if (!sessionId) {
      return {
        ok: false,
        revoked: false,
        code: 'INVALID_SESSION_ID',
        reason: 'Session ID is required',
      };
    }

    // Get session details
    const [sessionRows] = await pool.query(
      `SELECT s.id, s.userId, s.revokedAt, s.expiresAt
       FROM AuthSession s
       INNER JOIN User u ON s.userId = u.id
       WHERE s.id = ?`,
      [sessionId]
    );

    if (sessionRows.length === 0) {
      return {
        ok: false,
        revoked: false,
        code: 'SESSION_NOT_FOUND',
        reason: 'Session not found',
      };
    }

    const session = sessionRows[0];

    // Check if already revoked
    if (session.revokedAt) {
      return {
        ok: true,
        revoked: false,
        code: 'ALREADY_REVOKED',
        reason: 'Session is already revoked',
      };
    }

    // Check if expired
    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
      return {
        ok: true,
        revoked: false,
        code: 'ALREADY_EXPIRED',
        reason: 'Session is already expired',
      };
    }

    // Revoke the session
    await pool.query(
      `UPDATE AuthSession 
       SET revokedAt = NOW(), isCurrent = 0 
       WHERE id = ? AND revokedAt IS NULL`,
      [sessionId]
    );

    return {
      ok: true,
      revoked: true,
      targetUserId: session.userId,
    };
  } catch (err) {
    console.error('[AdminSessionService] Error revoking session:', err);
    return {
      ok: false,
      revoked: false,
      code: 'REVOKE_ERROR',
      reason: err.message || 'Failed to revoke session',
    };
  }
}

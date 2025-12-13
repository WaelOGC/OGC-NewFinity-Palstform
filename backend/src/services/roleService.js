/**
 * Role Service (Phase 7)
 * 
 * Manages multi-role assignments with expiry support.
 * Falls back to legacy User.role column for backward compatibility.
 */

import pool from '../db.js';
import { ROLES, ROLE_PRIORITY } from '../config/permissionsMatrix.js';

/**
 * Get all active (non-expired) roles for a user
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} Array of role names
 */
export async function getUserRoles(userId) {
  if (!userId) {
    return [];
  }

  try {
    // Check if user_roles table exists and has data
    const [rows] = await pool.query(
      `SELECT role 
       FROM user_roles 
       WHERE user_id = ? 
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY assigned_at ASC`,
      [userId]
    );

    if (rows.length > 0) {
      return rows.map(row => row.role);
    }

    // Fallback to legacy User.role column
    const [userRows] = await pool.query(
      'SELECT role FROM User WHERE id = ?',
      [userId]
    );

    if (userRows.length > 0 && userRows[0].role) {
      return [userRows[0].role];
    }

    return [];
  } catch (err) {
    // If user_roles table doesn't exist yet, fallback to legacy
    if (err.code === 'ER_NO_SUCH_TABLE') {
      const [userRows] = await pool.query(
        'SELECT role FROM User WHERE id = ?',
        [userId]
      );
      if (userRows.length > 0 && userRows[0].role) {
        return [userRows[0].role];
      }
    }
    console.error('getUserRoles error:', err);
    return [];
  }
}

/**
 * Check if user has a specific role (including expired roles check)
 * @param {number} userId - User ID
 * @param {string} role - Role to check
 * @returns {Promise<boolean>} True if user has the role
 */
export async function userHasRole(userId, role) {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 * @param {number} userId - User ID
 * @param {string[]} rolesArray - Array of roles to check
 * @returns {Promise<boolean>} True if user has at least one role
 */
export async function userHasAnyRole(userId, rolesArray) {
  if (!Array.isArray(rolesArray) || rolesArray.length === 0) {
    return false;
  }
  const userRoles = await getUserRoles(userId);
  return rolesArray.some(role => userRoles.includes(role));
}

/**
 * Get primary role based on priority order
 * @param {string[]} roles - Array of role names
 * @returns {string} Primary role (highest priority)
 */
export function getPrimaryRole(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return ROLES.STANDARD_USER;
  }

  // Find the highest priority role
  for (const priorityRole of ROLE_PRIORITY) {
    if (roles.includes(priorityRole)) {
      return priorityRole;
    }
  }

  // If no match, return first role or STANDARD_USER
  return roles[0] || ROLES.STANDARD_USER;
}

/**
 * Assign a role to a user (upsert behavior - prevents duplicates)
 * @param {Object} params - Assignment parameters
 * @param {number} params.userId - User ID
 * @param {string} params.role - Role name
 * @param {number} [params.assignedBy] - Admin user ID who assigned the role
 * @param {Date|string|null} [params.expiresAt] - Expiration timestamp (null = permanent)
 * @returns {Promise<Object>} Created/updated role assignment
 */
export async function assignRole({ userId, role, assignedBy = null, expiresAt = null }) {
  if (!userId || !role) {
    throw new Error('userId and role are required');
  }

  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  try {
    // Check if role already exists for this user
    const [existing] = await pool.query(
      'SELECT id FROM user_roles WHERE user_id = ? AND role = ?',
      [userId, role]
    );

    if (existing.length > 0) {
      // Update existing assignment
      const [result] = await pool.query(
        `UPDATE user_roles 
         SET assigned_by = ?, 
             expires_at = ?,
             assigned_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND role = ?`,
        [assignedBy, expiresAt, userId, role]
      );
      return { id: existing[0].id, userId, role, assignedBy, expiresAt };
    } else {
      // Insert new assignment
      const [result] = await pool.query(
        `INSERT INTO user_roles (user_id, role, assigned_by, expires_at)
         VALUES (?, ?, ?, ?)`,
        [userId, role, assignedBy, expiresAt]
      );
      return { id: result.insertId, userId, role, assignedBy, expiresAt };
    }
  } catch (err) {
    // If table doesn't exist, silently fail (migration not run yet)
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('user_roles table does not exist. Migration may not have been run.');
      return null;
    }
    throw err;
  }
}

/**
 * Revoke a role from a user
 * @param {Object} params - Revocation parameters
 * @param {number} params.userId - User ID
 * @param {string} params.role - Role name to revoke
 * @param {number} [params.revokedBy] - Admin user ID who revoked the role
 * @returns {Promise<boolean>} True if role was revoked
 */
export async function revokeRole({ userId, role, revokedBy = null }) {
  if (!userId || !role) {
    throw new Error('userId and role are required');
  }

  try {
    const [result] = await pool.query(
      'DELETE FROM user_roles WHERE user_id = ? AND role = ?',
      [userId, role]
    );
    return result.affectedRows > 0;
  } catch (err) {
    // If table doesn't exist, silently fail
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return false;
    }
    throw err;
  }
}

/**
 * Get user's primary role (for backward compatibility)
 * @param {number} userId - User ID
 * @returns {Promise<string>} Primary role name
 */
export async function getUserPrimaryRole(userId) {
  const roles = await getUserRoles(userId);
  return getPrimaryRole(roles);
}

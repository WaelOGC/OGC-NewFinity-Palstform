// backend/src/services/authMeService.js

/**
 * Safe service for /auth/me endpoint
 * Handles schema drift gracefully by only querying guaranteed columns
 * and providing safe defaults for optional fields
 */

import pool from '../db.js';

/**
 * Get normalized user object for /auth/me endpoint
 * This function is schema-drift tolerant and will never crash due to missing columns
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Normalized user object with safe defaults
 */
export async function getAuthMe(userId) {
  if (!userId) {
    return null;
  }

  try {
    // Step 1: Query minimal safe column set that we're confident exists
    // Start with absolutely minimal set: id and email (these are guaranteed to exist)
    let rows;
    let user = {};
    
    try {
      [rows] = await pool.query(
        `SELECT id, email FROM User WHERE id = ?`,
        [userId]
      );
      
      if (!rows || rows.length === 0) {
        return null;
      }
      
      user = rows[0];
    } catch (err) {
      // Even the minimal query failed - return safe defaults
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.error(`[AUTH_ME] Schema mismatch: core columns (id, email) not found`);
        // Return minimal user payload
        return {
          id: userId,
          email: null,
          username: null,
          displayName: null,
          avatarUrl: null,
          accountStatus: null,
          provider: null,
          roles: [],
          permissions: [],
        };
      }
      throw err; // Re-throw non-schema errors
    }
    
    // Step 2: Try to get additional core fields (fullName, role, status/accountStatus)
    // These are queried separately to handle schema drift gracefully
    try {
      const [extendedRows] = await pool.query(
        `SELECT 
          COALESCE(fullName, NULL) as fullName,
          COALESCE(role, 'STANDARD_USER') as role,
          COALESCE(status, NULL) as status,
          COALESCE(accountStatus, status, NULL) as accountStatus
        FROM User 
        WHERE id = ?`,
        [userId]
      );
      if (extendedRows && extendedRows[0]) {
        Object.assign(user, extendedRows[0]);
      }
    } catch (err) {
      // These columns don't exist - use safe defaults
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.log(`[AUTH_ME] Schema mismatch: extended columns (fullName, role, status) not found (using defaults)`);
        // Continue with defaults
      } else {
        console.warn(`[AUTH_ME] Error fetching extended fields:`, err.message);
      }
    }
    
    // Step 3: Build normalized user object with safe defaults
    const normalizedUser = {
      id: user.id || null,
      email: user.email || null,
      username: null, // Will be set below if column exists
      displayName: user.fullName || null,
      avatarUrl: null, // Will be set below if column exists
      accountStatus: user.accountStatus || user.status || null,
      provider: null, // Will be set below if column exists
      roles: [], // Will be populated below if role exists
      permissions: [], // Will be populated below if column exists
    };
    
    // Populate roles from role field (if it exists)
    if (user.role) {
      normalizedUser.roles = [user.role];
      // Also set role field for backward compatibility with frontend
      normalizedUser.role = user.role;
    }

    // Step 3: Try to fetch optional fields in separate try/catch blocks
    // If any query fails due to missing columns, we continue with safe defaults
    
    // Try to get username (optional field)
    try {
      const [usernameRows] = await pool.query(
        'SELECT username FROM User WHERE id = ?',
        [userId]
      );
      if (usernameRows && usernameRows[0] && usernameRows[0].username) {
        normalizedUser.username = usernameRows[0].username;
      }
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.log(`[AUTH_ME] Schema mismatch: username column not found (using null)`);
      } else {
        // Log other errors but continue
        console.warn(`[AUTH_ME] Error fetching username:`, err.message);
      }
    }

    // Try to get avatarUrl (optional field)
    try {
      const [avatarRows] = await pool.query(
        'SELECT avatarUrl FROM User WHERE id = ?',
        [userId]
      );
      if (avatarRows && avatarRows[0] && avatarRows[0].avatarUrl) {
        normalizedUser.avatarUrl = avatarRows[0].avatarUrl;
      }
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.log(`[AUTH_ME] Schema mismatch: avatarUrl column not found (using null)`);
      } else {
        console.warn(`[AUTH_ME] Error fetching avatarUrl:`, err.message);
      }
    }

    // Try to get authProvider/provider (optional field)
    try {
      const [providerRows] = await pool.query(
        'SELECT authProvider FROM User WHERE id = ?',
        [userId]
      );
      if (providerRows && providerRows[0] && providerRows[0].authProvider) {
        normalizedUser.provider = providerRows[0].authProvider;
      }
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.log(`[AUTH_ME] Schema mismatch: authProvider column not found (using null)`);
      } else {
        console.warn(`[AUTH_ME] Error fetching authProvider:`, err.message);
      }
    }

    // Try to get permissions (optional JSON field)
    try {
      const [permRows] = await pool.query(
        'SELECT permissions FROM User WHERE id = ?',
        [userId]
      );
      if (permRows && permRows[0] && permRows[0].permissions) {
        try {
          const permissions = typeof permRows[0].permissions === 'string'
            ? JSON.parse(permRows[0].permissions)
            : permRows[0].permissions;
          normalizedUser.permissions = Array.isArray(permissions) ? permissions : [];
        } catch (parseErr) {
          // Invalid JSON, use empty array
          normalizedUser.permissions = [];
        }
      }
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.log(`[AUTH_ME] Schema mismatch: permissions column not found (using [])`);
      } else {
        console.warn(`[AUTH_ME] Error fetching permissions:`, err.message);
      }
    }

    // Admin email fallback: If roles array is empty and user is admin@ogc.local,
    // ensure they have ADMIN role (pragmatic stabilization until DB roles are fully enforced)
    // This check happens AFTER all optional fields are loaded, so we have the email
    const ADMIN_EMAIL = 'admin@ogc.local';
    if (normalizedUser.roles.length === 0 && normalizedUser.email && 
        normalizedUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      console.log(`[AUTH_ME] Admin email fallback: ${ADMIN_EMAIL} → ADMIN role`);
      normalizedUser.roles = ['ADMIN'];
      // Also set role field for backward compatibility with frontend
      normalizedUser.role = 'ADMIN';
    }

    return normalizedUser;
  } catch (err) {
    // Catch any database errors (including "Unknown column" errors)
    if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
      console.error(`[AUTH_ME] Schema mismatch error for userId ${userId}:`, {
        code: err.code,
        message: err.message,
        sqlMessage: err.sqlMessage,
      });
      // Return minimal user payload instead of crashing
      return {
        id: userId,
        email: null,
        username: null,
        displayName: null,
        avatarUrl: null,
        accountStatus: null,
        provider: null,
        roles: [],
        permissions: [],
      };
    }
    
    // For other database errors, log and return null
    console.error(`[AUTH_ME] Database error for userId ${userId}:`, {
      code: err.code,
      message: err.message,
    });
    throw err; // Re-throw non-schema errors so they can be handled by caller
  }
}

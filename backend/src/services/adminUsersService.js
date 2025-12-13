// backend/src/services/adminUsersService.js

/**
 * Schema-drift tolerant service for admin users listing
 * Handles missing columns gracefully by querying minimal guaranteed set first,
 * then attempting extended fields with safe fallbacks
 */

import pool from '../db.js';
import { getUserSchema } from '../utils/userSchemaResolver.js';
import { USER_STATUS, isValidUserStatus } from '../constants/userStatus.js';

/**
 * Normalize user status from database with schema-drift tolerance
 * 
 * Rules:
 * - Prefer `status` column value
 * - Fallback to `accountStatus` column value
 * - If neither exists or both are null, default to ACTIVE
 * - Invalid stored values → treated as ACTIVE (defensive behavior)
 * 
 * @param {string|null|undefined} statusValue - Value from `status` column
 * @param {string|null|undefined} accountStatusValue - Value from `accountStatus` column
 * @returns {string} Normalized status: ACTIVE, SUSPENDED, or BANNED
 */
function normalizeUserStatus(statusValue, accountStatusValue) {
  // Prefer status column, fallback to accountStatus
  const rawValue = statusValue || accountStatusValue;
  
  // If no value exists, default to ACTIVE
  if (!rawValue || typeof rawValue !== 'string') {
    return USER_STATUS.ACTIVE;
  }
  
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return USER_STATUS.ACTIVE;
  }
  
  const upper = trimmed.toUpperCase();
  
  // Check if it's a valid canonical status
  if (isValidUserStatus(upper)) {
    return upper;
  }
  
  // Map legacy/common values to canonical statuses
  // Invalid stored values → treated as ACTIVE (defensive behavior)
  const legacyMap = {
    'PENDING': USER_STATUS.ACTIVE, // Treat pending as active for admin purposes
    'PENDING_VERIFICATION': USER_STATUS.ACTIVE,
    'DISABLED': USER_STATUS.SUSPENDED, // Map disabled to suspended
    'DELETED': USER_STATUS.BANNED, // Map deleted to banned
  };
  
  if (legacyMap[upper]) {
    return legacyMap[upper];
  }
  
  // Unknown/invalid value → default to ACTIVE (defensive)
  return USER_STATUS.ACTIVE;
}

/**
 * Get admin users list with pagination and search
 * This function is schema-drift tolerant and will never crash due to missing columns
 * 
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 25, max: 100)
 * @param {string} [options.q] - Search query (searches email, username, displayName if available)
 * @returns {Promise<Object>} Paginated user list with stable shape
 */
export async function getAdminUsers({ page = 1, limit = 25, q = '' } = {}) {
  try {
    // Validate and normalize pagination
    const normalizedPage = Math.max(1, parseInt(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 25));
    const offset = (normalizedPage - 1) * normalizedLimit;
    const searchTerm = (q || '').trim();

    // Step 1: Query minimal guaranteed set (id, email, createdAt)
    // These columns should always exist
    let minimalRows = [];
    let total = 0;
    
    try {
      // Build minimal WHERE clause for count
      const countConditions = [];
      const countParams = [];
      
      if (searchTerm) {
        // For minimal query, only search email (guaranteed to exist)
        countConditions.push('email LIKE ?');
        countParams.push(`%${searchTerm}%`);
      }
      
      const countWhereClause = countConditions.length > 0 
        ? `WHERE ${countConditions.join(' AND ')}` 
        : '';
      
      // Get table name from schema resolver
      const schema = getUserSchema();
      const tableName = schema?.table || 'User';

      // Get total count using minimal columns
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM \`${tableName}\` ${countWhereClause}`,
        countParams
      );
      total = countRows[0]?.total || 0;

      // Get paginated minimal results
      const [minimalResult] = await pool.query(
        `SELECT id, email, createdAt 
         FROM \`${tableName}\` 
         ${countWhereClause}
         ORDER BY createdAt DESC 
         LIMIT ? OFFSET ?`,
        [...countParams, normalizedLimit, offset]
      );
      
      minimalRows = minimalResult || [];
    } catch (err) {
      // Even minimal query failed - return empty result
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.error(`[ADMIN_USERS] Schema mismatch: core columns (id, email, createdAt) not found`);
        return {
          users: [],
          page: normalizedPage,
          limit: normalizedLimit,
          total: 0,
        };
      }
      throw err; // Re-throw non-schema errors
    }

    // Step 2: Try to enrich with extended fields
    // Attempt to query optional columns in a try/catch
    let extendedFieldsAvailable = false;
    let extendedRows = [];
    
    try {
      // Build extended WHERE clause (try to search email, username, displayName/fullName)
      const extendedConditions = [];
      const extendedParams = [];
      
      if (searchTerm) {
        // Try to search multiple fields if they exist
        // We'll use a query that handles missing columns gracefully
        extendedConditions.push('(email LIKE ? OR username LIKE ? OR fullName LIKE ? OR displayName LIKE ?)');
        const searchPattern = `%${searchTerm}%`;
        extendedParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
      
      const extendedWhereClause = extendedConditions.length > 0 
        ? `WHERE ${extendedConditions.join(' AND ')}` 
        : '';
      
      // Build SELECT clause using resolved schema columns
      const schema = getUserSchema();
      const tableName = schema?.table || 'User';
      
      // Build column selections based on resolved schema
      const selectParts = [
        'id',
        'email',
        'COALESCE(username, NULL) as username',
        'COALESCE(displayName, fullName, NULL) as displayName',
        'COALESCE(avatarUrl, NULL) as avatarUrl',
        'COALESCE(authProvider, provider, NULL) as provider',
      ];
      
      // Add status columns if available (prefer status, fallback to accountStatus)
      // We'll read both and normalize in code for schema-drift tolerance
      if (schema?.columns?.status) {
        selectParts.push(`\`${schema.columns.status}\` as statusRaw`);
      } else {
        selectParts.push('NULL as statusRaw');
      }
      // Also try accountStatus as fallback
      if (schema?.columns?.status === 'accountStatus' || schema?.columns?.status === 'account_status') {
        // If status column IS accountStatus, don't duplicate
        selectParts.push('NULL as accountStatusRaw');
      } else {
        // Try to read accountStatus separately if status column exists but is different
        selectParts.push('COALESCE(accountStatus, account_status, NULL) as accountStatusRaw');
      }
      
      // Add role column if available
      if (schema?.columns?.role) {
        selectParts.push(`\`${schema.columns.role}\` as role`);
      } else {
        selectParts.push('NULL as role');
      }
      
      // Add lastLogin column if available, otherwise fallback to updatedAt
      if (schema?.columns?.lastLogin) {
        selectParts.push(`\`${schema.columns.lastLogin}\` as lastLoginAt`);
      } else {
        selectParts.push('COALESCE(updatedAt, NULL) as lastLoginAt');
      }
      
      selectParts.push('createdAt');
      
      // Try extended query with optional fields (including lastLoginAt)
      const [extendedResult] = await pool.query(
        `SELECT ${selectParts.join(', ')}
         FROM \`${tableName}\` 
         ${extendedWhereClause}
         ORDER BY createdAt DESC 
         LIMIT ? OFFSET ?`,
        [...extendedParams, normalizedLimit, offset]
      );
      
      extendedRows = extendedResult || [];
      extendedFieldsAvailable = true;
      
      // If extended query worked, update total count with extended search
      if (searchTerm && extendedConditions.length > 0) {
        const schema = getUserSchema();
        const tableName = schema?.table || 'User';
        const [extendedCountRows] = await pool.query(
          `SELECT COUNT(*) as total FROM \`${tableName}\` ${extendedWhereClause}`,
          extendedParams
        );
        total = extendedCountRows[0]?.total || 0;
      }
    } catch (err) {
      // Extended fields don't exist or query failed - use minimal data
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.log(`[ADMIN_USERS] Schema mismatch: extended columns not found (using minimal fields)`);
        extendedFieldsAvailable = false;
      } else {
        console.warn(`[ADMIN_USERS] Error fetching extended fields:`, err.message);
        extendedFieldsAvailable = false;
      }
    }

    // Step 3: Build normalized user objects with stable shape
    // If extended query succeeded, use those results; otherwise use minimal rows
    const sourceRows = extendedFieldsAvailable && extendedRows.length > 0 ? extendedRows : minimalRows;
    
    const users = sourceRows.map((row) => {
      // Start with minimal guaranteed fields
      const user = {
        id: row.id || null,
        email: row.email || null,
        username: null,
        displayName: null,
        avatarUrl: null,
        provider: null,
        accountStatus: USER_STATUS.ACTIVE, // Default to ACTIVE if no status available
        roles: [],
        lastLoginAt: null,
        createdAt: row.createdAt || null,
      };

      // If extended fields are available, enrich with optional fields
      if (extendedFieldsAvailable) {
        user.username = row.username || null;
        user.displayName = row.displayName || null;
        user.avatarUrl = row.avatarUrl || null;
        user.provider = row.provider || null;
        // Normalize status: prefer statusRaw, fallback to accountStatusRaw, default to ACTIVE
        user.accountStatus = normalizeUserStatus(row.statusRaw, row.accountStatusRaw);
        user.lastLoginAt = row.lastLoginAt || null;
        
        // Populate roles array from role field (convert single role to array)
        // Always return array (never null)
        if (row.role) {
          user.roles = Array.isArray(row.role) ? row.role : [row.role];
        } else {
          user.roles = [];
        }
      }

      return user;
    });

    return {
      users,
      page: normalizedPage,
      limit: normalizedLimit,
      total,
    };
  } catch (err) {
    // Catch any unexpected database errors
    if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
      console.error(`[ADMIN_USERS] Schema mismatch error:`, {
        code: err.code,
        message: err.message,
        sqlMessage: err.sqlMessage,
      });
      // Return empty result instead of crashing
      return {
        users: [],
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit) || 25)),
        total: 0,
      };
    }
    
    // For other database errors, log and re-throw
    console.error(`[ADMIN_USERS] Database error:`, {
      code: err.code,
      message: err.message,
    });
    throw err;
  }
}

/**
 * Get admin user details by ID (schema-drift tolerant)
 * Returns admin-safe user shape with stable fields
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Admin user object or null if not found
 */
export async function getAdminUserDetail(userId) {
  try {
    const normalizedUserId = parseInt(userId);
    if (!normalizedUserId || isNaN(normalizedUserId)) {
      return null;
    }

    // Try to get user with extended fields first
    let user = null;
    try {
      const schema = getUserSchema();
      const tableName = schema?.table || 'User';
      
      // Build SELECT clause using resolved schema columns
      const selectParts = [
        'id',
        'email',
        'COALESCE(username, NULL) as username',
        'COALESCE(displayName, fullName, NULL) as displayName',
        'COALESCE(avatarUrl, NULL) as avatarUrl',
        'COALESCE(authProvider, provider, NULL) as provider',
      ];
      
      // Add status columns if available (prefer status, fallback to accountStatus)
      // We'll read both and normalize in code for schema-drift tolerance
      if (schema?.columns?.status) {
        selectParts.push(`\`${schema.columns.status}\` as statusRaw`);
      } else {
        selectParts.push('NULL as statusRaw');
      }
      // Also try accountStatus as fallback
      if (schema?.columns?.status === 'accountStatus' || schema?.columns?.status === 'account_status') {
        // If status column IS accountStatus, don't duplicate
        selectParts.push('NULL as accountStatusRaw');
      } else {
        // Try to read accountStatus separately if status column exists but is different
        selectParts.push('COALESCE(accountStatus, account_status, NULL) as accountStatusRaw');
      }
      
      // Add role column if available
      if (schema?.columns?.role) {
        selectParts.push(`\`${schema.columns.role}\` as role`);
      } else {
        selectParts.push('NULL as role');
      }
      
      // Add lastLogin column if available, otherwise fallback to updatedAt
      if (schema?.columns?.lastLogin) {
        selectParts.push(`\`${schema.columns.lastLogin}\` as lastLoginAt`);
      } else {
        selectParts.push('COALESCE(updatedAt, NULL) as lastLoginAt');
      }
      
      selectParts.push('createdAt');
      
      const [rows] = await pool.query(
        `SELECT ${selectParts.join(', ')}
         FROM \`${tableName}\` 
         WHERE id = ?`,
        [normalizedUserId]
      );
      
      if (rows && rows.length > 0) {
        const row = rows[0];
        user = {
          id: row.id || null,
          email: row.email || null,
          username: row.username || null,
          displayName: row.displayName || null,
          avatarUrl: row.avatarUrl || null,
          provider: row.provider || null,
          // Normalize status: prefer statusRaw, fallback to accountStatusRaw, default to ACTIVE
          accountStatus: normalizeUserStatus(row.statusRaw, row.accountStatusRaw),
          lastLoginAt: row.lastLoginAt || null,
          roles: row.role ? (Array.isArray(row.role) ? row.role : [row.role]) : [], // Always array, never null
          createdAt: row.createdAt || null,
        };
      }
    } catch (err) {
      // If extended query fails due to schema mismatch, try minimal fields
      if (err.code === 'ER_BAD_FIELD_ERROR' || err.message?.includes('Unknown column')) {
        console.log(`[ADMIN_USERS] Schema mismatch: using minimal fields for user detail`);
        try {
          const schema = getUserSchema();
          const tableName = schema?.table || 'User';
          const [minimalRows] = await pool.query(
            `SELECT id, email, createdAt FROM \`${tableName}\` WHERE id = ?`,
            [normalizedUserId]
          );
          
          if (minimalRows && minimalRows.length > 0) {
            const row = minimalRows[0];
            user = {
              id: row.id || null,
              email: row.email || null,
              username: null,
              displayName: null,
              avatarUrl: null,
              provider: null,
              accountStatus: USER_STATUS.ACTIVE, // Default to ACTIVE if no status available
              lastLoginAt: null,
              roles: [],
              createdAt: row.createdAt || null,
            };
          }
        } catch (minimalErr) {
          // Even minimal query failed - return null
          console.error(`[ADMIN_USERS] Minimal query failed for user detail:`, minimalErr.message);
          return null;
        }
      } else {
        // Non-schema error - re-throw
        throw err;
      }
    }

    return user;
  } catch (err) {
    console.error(`[ADMIN_USERS] Error fetching user detail:`, {
      userId,
      code: err.code,
      message: err.message,
    });
    throw err;
  }
}

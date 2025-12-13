// backend/src/services/adminUsersService.js

/**
 * Schema-drift tolerant service for admin users listing
 * Handles missing columns gracefully by querying minimal guaranteed set first,
 * then attempting extended fields with safe fallbacks
 */

import pool from '../db.js';

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
      
      // Get total count using minimal columns
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM User ${countWhereClause}`,
        countParams
      );
      total = countRows[0]?.total || 0;

      // Get paginated minimal results
      const [minimalResult] = await pool.query(
        `SELECT id, email, createdAt 
         FROM User 
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
      
      // Try extended query with optional fields
      const [extendedResult] = await pool.query(
        `SELECT 
          id,
          email,
          COALESCE(username, NULL) as username,
          COALESCE(displayName, fullName, NULL) as displayName,
          COALESCE(avatarUrl, NULL) as avatarUrl,
          COALESCE(authProvider, provider, NULL) as provider,
          COALESCE(accountStatus, status, NULL) as accountStatus,
          COALESCE(role, NULL) as role,
          createdAt
         FROM User 
         ${extendedWhereClause}
         ORDER BY createdAt DESC 
         LIMIT ? OFFSET ?`,
        [...extendedParams, normalizedLimit, offset]
      );
      
      extendedRows = extendedResult || [];
      extendedFieldsAvailable = true;
      
      // If extended query worked, update total count with extended search
      if (searchTerm && extendedConditions.length > 0) {
        const [extendedCountRows] = await pool.query(
          `SELECT COUNT(*) as total FROM User ${extendedWhereClause}`,
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
        accountStatus: null,
        roles: [],
        createdAt: row.createdAt || null,
      };

      // If extended fields are available, enrich with optional fields
      if (extendedFieldsAvailable) {
        user.username = row.username || null;
        user.displayName = row.displayName || null;
        user.avatarUrl = row.avatarUrl || null;
        user.provider = row.provider || null;
        user.accountStatus = row.accountStatus || null;
        
        // Populate roles array from role field
        if (row.role) {
          user.roles = [row.role];
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

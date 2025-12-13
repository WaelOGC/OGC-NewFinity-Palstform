/**
 * User Schema Resolver
 * 
 * Runtime schema introspection to detect table name and column variants.
 * Caches results to avoid repeated INFORMATION_SCHEMA queries.
 */

import pool from '../db.js';

let cachedSchema = null;

/**
 * Resolve user schema by detecting table name and column names
 * 
 * @returns {Promise<Object>} Schema config object:
 *   {
 *     table: "users" | "User",
 *     columns: {
 *       lastLogin: "lastLoginAt" | "last_login_at" | "lastLogin" | "last_login" | null,
 *       status: "status" | "accountStatus" | "account_status" | null,
 *       role: "role" | "roles" | "userRole" | null
 *     }
 *   }
 */
export async function resolveUserSchema() {
  // Return cached result if available
  if (cachedSchema) {
    return cachedSchema;
  }

  const dbname = process.env.DB_NAME || process.env.MYSQL_DATABASE;
  if (!dbname) {
    console.warn('[UserSchemaResolver] DB_NAME not set, using DATABASE()');
  }

  try {
    // Step 1: Detect which table exists (prefer 'users', fallback to 'User')
    const [tableRows] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = COALESCE(?, DATABASE())
        AND TABLE_NAME IN ('users', 'User')
      ORDER BY CASE TABLE_NAME WHEN 'users' THEN 1 WHEN 'User' THEN 2 END
      LIMIT 1
    `, [dbname]);

    if (!tableRows || tableRows.length === 0) {
      console.warn('[UserSchemaResolver] No user table found (neither "users" nor "User")');
      // Return default schema (will cause graceful degradation)
      cachedSchema = {
        table: 'User', // Default fallback
        columns: {
          lastLogin: null,
          status: null,
          role: null,
        },
      };
      return cachedSchema;
    }

    const tableName = tableRows[0].TABLE_NAME;

    // Step 2: Detect available columns
    const [columnRows] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = COALESCE(?, DATABASE())
        AND TABLE_NAME = ?
        AND COLUMN_NAME IN (
          'lastLoginAt', 'last_login_at', 'lastLogin', 'last_login',
          'status', 'accountStatus', 'account_status',
          'role', 'roles', 'userRole'
        )
    `, [dbname, tableName]);

    const availableColumns = new Set(
      columnRows.map(row => row.COLUMN_NAME)
    );

    // Map column variants to our standard names
    const columns = {
      lastLogin: null,
      status: null,
      role: null,
    };

    // Resolve lastLogin column (prefer camelCase variants)
    if (availableColumns.has('lastLoginAt')) {
      columns.lastLogin = 'lastLoginAt';
    } else if (availableColumns.has('last_login_at')) {
      columns.lastLogin = 'last_login_at';
    } else if (availableColumns.has('lastLogin')) {
      columns.lastLogin = 'lastLogin';
    } else if (availableColumns.has('last_login')) {
      columns.lastLogin = 'last_login';
    }

    // Resolve status column (prefer short name, then camelCase)
    if (availableColumns.has('status')) {
      columns.status = 'status';
    } else if (availableColumns.has('accountStatus')) {
      columns.status = 'accountStatus';
    } else if (availableColumns.has('account_status')) {
      columns.status = 'account_status';
    }

    // Resolve role column (prefer singular 'role')
    if (availableColumns.has('role')) {
      columns.role = 'role';
    } else if (availableColumns.has('userRole')) {
      columns.role = 'userRole';
    } else if (availableColumns.has('roles')) {
      columns.role = 'roles';
    }

    cachedSchema = {
      table: tableName,
      columns,
    };

    console.log(`[UserSchemaResolver] Resolved schema: table=${tableName}, columns=`, columns);
    return cachedSchema;
  } catch (err) {
    console.error('[UserSchemaResolver] Error resolving schema:', err.message);
    // Return default schema on error (graceful degradation)
    cachedSchema = {
      table: 'User',
      columns: {
        lastLogin: null,
        status: null,
        role: null,
      },
    };
    return cachedSchema;
  }
}

/**
 * Get cached user schema (must call resolveUserSchema() first)
 * 
 * @returns {Object|null} Cached schema config or null if not resolved
 */
export function getUserSchema() {
  return cachedSchema;
}

/**
 * Clear cached schema (useful for testing or forced re-resolution)
 */
export function clearSchemaCache() {
  cachedSchema = null;
}

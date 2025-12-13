// backend/src/services/adminAuditLogsService.js

/**
 * Admin Audit Logs Service
 * 
 * Schema-drift tolerant service for reading admin audit logs.
 * Returns empty results if table doesn't exist or columns are missing.
 */

import pool from '../db.js';

/**
 * Check if AdminAuditLog table exists
 * @returns {Promise<boolean>} True if table exists
 */
async function tableExists() {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'AdminAuditLog'`
    );
    return rows[0]?.count > 0;
  } catch (err) {
    return false;
  }
}

/**
 * Get available columns in AdminAuditLog table
 * @returns {Promise<Set<string>>} Set of available column names
 */
async function getAvailableColumns() {
  try {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'AdminAuditLog'`
    );
    return new Set(rows.map(row => row.COLUMN_NAME));
  } catch (err) {
    return new Set();
  }
}

/**
 * Get audit logs with pagination and filtering
 * Schema-drift tolerant: returns empty results if table doesn't exist
 * 
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 25, max: 100)
 * @param {string} [options.q] - Search query (searches action, message, targetId if available)
 * @param {number} [options.actorUserId] - Filter by actor user ID
 * @param {string} [options.action] - Filter by action type
 * @param {string} [options.status] - Filter by status (if available)
 * @returns {Promise<Object>} Paginated audit logs with stable shape
 */
export async function getAuditLogs({ 
  page = 1, 
  limit = 25, 
  q = null, 
  actorUserId = null,
  action = null,
  status = null 
} = {}) {
  try {
    // Validate and normalize pagination (controller should have already validated, but ensure here too)
    const normalizedPage = Math.max(1, parseInt(page) || 1);
    const normalizedLimit = Math.min(100, Math.max(1, parseInt(limit) || 25));
    const offset = (normalizedPage - 1) * normalizedLimit;
    const searchTerm = q || null;

    // Check if table exists
    const exists = await tableExists();
    if (!exists) {
      return {
        logs: [],
        page: normalizedPage,
        limit: normalizedLimit,
        total: 0,
      };
    }

    // Get available columns
    const availableColumns = await getAvailableColumns();
    
    // Build WHERE conditions
    const conditions = [];
    const params = [];

    if (actorUserId) {
      if (availableColumns.has('actorUserId')) {
        conditions.push('actorUserId = ?');
        params.push(actorUserId);
      }
    }

    if (action) {
      if (availableColumns.has('action')) {
        conditions.push('action = ?');
        params.push(action);
      }
    }

    if (status) {
      if (availableColumns.has('status')) {
        conditions.push('status = ?');
        params.push(status);
      }
    }

    // Search query - try to search in available text fields
    if (searchTerm && searchTerm.length > 0) {
      const searchConditions = [];
      const searchPattern = `%${searchTerm}%`;
      
      if (availableColumns.has('action')) {
        searchConditions.push('action LIKE ?');
        params.push(searchPattern);
      }
      if (availableColumns.has('message')) {
        searchConditions.push('message LIKE ?');
        params.push(searchPattern);
      }
      if (availableColumns.has('targetId')) {
        searchConditions.push('CAST(targetId AS CHAR) LIKE ?');
        params.push(searchPattern);
      }
      
      if (searchConditions.length > 0) {
        conditions.push(`(${searchConditions.join(' OR ')})`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build SELECT clause with available columns
    const selectParts = [];
    
    // Required fields
    if (availableColumns.has('id')) {
      selectParts.push('id');
    }
    
    if (availableColumns.has('createdAt')) {
      selectParts.push('createdAt');
    } else {
      selectParts.push('NULL as createdAt');
    }
    
    // Actor fields
    if (availableColumns.has('actorUserId')) {
      selectParts.push('actorUserId');
    } else {
      selectParts.push('NULL as actorUserId');
    }
    
    if (availableColumns.has('actorEmail')) {
      selectParts.push('actorEmail');
    } else {
      selectParts.push('NULL as actorEmail');
    }
    
    // Action
    if (availableColumns.has('action')) {
      selectParts.push('action');
    } else {
      selectParts.push('NULL as action');
    }
    
    // Target fields
    if (availableColumns.has('targetType')) {
      selectParts.push('targetType');
    } else {
      selectParts.push('NULL as targetType');
    }
    
    if (availableColumns.has('targetId')) {
      selectParts.push('targetId');
    } else {
      selectParts.push('NULL as targetId');
    }
    
    // Status
    if (availableColumns.has('status')) {
      selectParts.push('status');
    } else {
      selectParts.push('NULL as status');
    }
    
    // IP address
    if (availableColumns.has('ip')) {
      selectParts.push('ip');
    } else {
      selectParts.push('NULL as ip');
    }
    
    // Request ID
    if (availableColumns.has('requestId')) {
      selectParts.push('requestId');
    } else {
      selectParts.push('NULL as requestId');
    }
    
    // Message
    if (availableColumns.has('message')) {
      selectParts.push('message');
    } else {
      selectParts.push('NULL as message');
    }
    
    // Metadata
    if (availableColumns.has('meta')) {
      selectParts.push('meta');
    } else {
      selectParts.push('NULL as meta');
    }

    // Get total count using same filters
    let total = 0;
    try {
      // Use same WHERE clause and params for count query
      const countParams = [];
      const countConditions = [];
      
      if (actorUserId && availableColumns.has('actorUserId')) {
        countConditions.push('actorUserId = ?');
        countParams.push(actorUserId);
      }
      
      if (action && availableColumns.has('action')) {
        countConditions.push('action = ?');
        countParams.push(action);
      }
      
      if (status && availableColumns.has('status')) {
        countConditions.push('status = ?');
        countParams.push(status);
      }
      
      if (searchTerm && searchTerm.length > 0) {
        const searchConditions = [];
        const searchPattern = `%${searchTerm}%`;
        
        if (availableColumns.has('action')) {
          searchConditions.push('action LIKE ?');
          countParams.push(searchPattern);
        }
        if (availableColumns.has('message')) {
          searchConditions.push('message LIKE ?');
          countParams.push(searchPattern);
        }
        if (availableColumns.has('targetId')) {
          searchConditions.push('CAST(targetId AS CHAR) LIKE ?');
          countParams.push(searchPattern);
        }
        
        if (searchConditions.length > 0) {
          countConditions.push(`(${searchConditions.join(' OR ')})`);
        }
      }
      
      const countWhereClause = countConditions.length > 0 ? `WHERE ${countConditions.join(' AND ')}` : '';
      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM AdminAuditLog ${countWhereClause}`,
        countParams
      );
      total = countRows[0]?.total || 0;
    } catch (err) {
      // If count fails, return empty
      console.warn('[ADMIN_AUDIT_LOGS] Count query failed:', err.message);
      return {
        logs: [],
        page: normalizedPage,
        limit: normalizedLimit,
        total: 0,
      };
    }

    // Get paginated results
    let rows = [];
    try {
      // Build ORDER BY clause - always use createdAt DESC, id DESC for stable ordering
      let orderByClause = 'ORDER BY ';
      if (availableColumns.has('createdAt') && availableColumns.has('id')) {
        orderByClause += 'createdAt DESC, id DESC';
      } else if (availableColumns.has('createdAt')) {
        orderByClause += 'createdAt DESC';
      } else if (availableColumns.has('id')) {
        orderByClause += 'id DESC';
      } else {
        orderByClause += '1 DESC'; // Fallback if neither exists
      }
      
      const [result] = await pool.query(
        `SELECT ${selectParts.join(', ')}
         FROM AdminAuditLog
         ${whereClause}
         ${orderByClause}
         LIMIT ? OFFSET ?`,
        [...params, normalizedLimit, offset]
      );
      rows = result || [];
    } catch (err) {
      // If select fails, return empty
      console.warn('[ADMIN_AUDIT_LOGS] Select query failed:', err.message);
      return {
        logs: [],
        page: normalizedPage,
        limit: normalizedLimit,
        total: 0,
      };
    }

    // Map rows to stable log object shape
    const logs = rows.map((row) => {
      // Parse metadata if it's a string
      let meta = null;
      if (row.meta || row.metadata) {
        try {
          const metaValue = row.meta || row.metadata;
          if (typeof metaValue === 'string') {
            meta = JSON.parse(metaValue);
          } else {
            meta = metaValue;
          }
        } catch (e) {
          meta = null;
        }
      }

      return {
        id: row.id || null,
        createdAt: row.createdAt || null,
        actorUserId: row.actorUserId || null,
        actorEmail: row.actorEmail || null,
        action: row.action || null,
        targetType: row.targetType || null,
        targetId: row.targetId || null,
        status: row.status || null,
        ip: row.ip || null,
        requestId: row.requestId || null,
        message: row.message || null,
        meta: meta,
      };
    });

    return {
      logs,
      page: normalizedPage,
      limit: normalizedLimit,
      total,
    };
  } catch (err) {
    // Catch any unexpected errors and return empty result
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR' || 
        err.message?.includes('Unknown column') || err.message?.includes('doesn\'t exist')) {
      console.warn('[ADMIN_AUDIT_LOGS] Schema mismatch:', err.message);
      return {
        logs: [],
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit) || 25)),
        total: 0,
      };
    }
    
    // For other errors, log and return empty
    console.error('[ADMIN_AUDIT_LOGS] Error fetching audit logs:', err);
    return {
      logs: [],
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit) || 25)),
      total: 0,
    };
  }
}

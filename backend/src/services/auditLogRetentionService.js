// backend/src/services/auditLogRetentionService.js

/**
 * Audit Log Retention Service
 * 
 * Provides cleanup functionality for audit logs based on retention policy.
 * Deletes audit logs older than the configured retention period.
 * 
 * Safety Rules:
 * - Never throws errors
 * - Uses parameterized SQL (injection-safe)
 * - Only affects audit_logs table
 * - No locking or cascading deletes
 * - Logs all operations with [AuditRetention] prefix
 */

import pool from '../db.js';
import { AUDIT_LOG_RETENTION_DAYS } from '../config/auditRetention.js';

/**
 * Cleanup expired audit logs based on retention policy
 * Deletes rows from audit_logs where created_at < (NOW - AUDIT_LOG_RETENTION_DAYS)
 * 
 * @returns {Promise<{ok: boolean, deletedCount?: number, error?: string}>}
 *   - ok: true if cleanup succeeded, false if it failed
 *   - deletedCount: Number of rows deleted (only present if ok is true)
 *   - error: Error message (only present if ok is false)
 * 
 * Behavior:
 * - Calculates cutoff date: NOW - AUDIT_LOG_RETENTION_DAYS
 * - Deletes rows where created_at < cutoff
 * - Uses parameterized SQL for safety
 * - Never throws - returns error in result object
 * - Logs result to console with [AuditRetention] prefix
 */
export async function cleanupExpiredAuditLogs() {
  try {
    // Calculate cutoff date: NOW - retention days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUDIT_LOG_RETENTION_DAYS);
    
    // Format as MySQL DATETIME string (YYYY-MM-DD HH:MM:SS)
    const cutoffDateStr = cutoffDate.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(`[AuditRetention] Starting cleanup: deleting audit logs older than ${AUDIT_LOG_RETENTION_DAYS} days (before ${cutoffDateStr})`);
    
    // Execute DELETE query with parameterized SQL
    // Only affects audit_logs table
    const [result] = await pool.query(
      `DELETE FROM audit_logs 
       WHERE created_at < ?`,
      [cutoffDateStr]
    );
    
    const deletedCount = result.affectedRows || 0;
    
    console.log(`[AuditRetention] Cleanup completed: ${deletedCount} rows deleted`);
    
    return {
      ok: true,
      deletedCount,
    };
    
  } catch (error) {
    // Never throw - return error in result object
    const errorMessage = error.message || String(error);
    console.error(`[AuditRetention] Cleanup failed:`, errorMessage);
    
    // Handle table doesn't exist gracefully
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn(`[AuditRetention] Table 'audit_logs' does not exist - skipping cleanup`);
      return {
        ok: true,
        deletedCount: 0,
      };
    }
    
    return {
      ok: false,
      error: errorMessage,
    };
  }
}
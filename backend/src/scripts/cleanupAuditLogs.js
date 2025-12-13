#!/usr/bin/env node

/**
 * Manual Audit Log Cleanup Script
 * 
 * Runs cleanup of expired audit logs based on retention policy.
 * 
 * Usage:
 *   node backend/src/scripts/cleanupAuditLogs.js
 * 
 * Behavior:
 * - Imports and runs cleanupExpiredAuditLogs()
 * - Logs start, retention days, deleted count, and completion
 * - Exits cleanly (process.exit(0) on success, process.exit(1) on failure)
 * 
 * Scheduling Options:
 * 
 * 1. System Cron (Linux/Mac):
 *    Add to crontab (crontab -e):
 *    0 2 * * * cd /path/to/project && node backend/src/scripts/cleanupAuditLogs.js >> /var/log/audit-cleanup.log 2>&1
 *    (Runs daily at 2 AM)
 * 
 * 2. PM2 Cron:
 *    Add to PM2 ecosystem.config.js:
 *    {
 *      name: "audit-cleanup",
 *      script: "backend/src/scripts/cleanupAuditLogs.js",
 *      cron_restart: "0 2 * * *",
 *      autorestart: false
 *    }
 * 
 * 3. Windows Task Scheduler:
 *    Create a task that runs:
 *    node.exe backend\src\scripts\cleanupAuditLogs.js
 *    Schedule: Daily at 2:00 AM
 *    Start in: C:\path\to\OGC-NewFinity-Platform
 * 
 * Note: This script does NOT automatically schedule itself.
 * You must configure scheduling using one of the above methods.
 */

import { cleanupExpiredAuditLogs } from '../services/auditLogRetentionService.js';
import { AUDIT_LOG_RETENTION_DAYS } from '../config/auditRetention.js';

async function main() {
  console.log('[AuditRetention] ========================================');
  console.log('[AuditRetention] Starting manual audit log cleanup');
  console.log(`[AuditRetention] Retention period: ${AUDIT_LOG_RETENTION_DAYS} days`);
  console.log('[AuditRetention] ========================================');
  
  try {
    const result = await cleanupExpiredAuditLogs();
    
    if (result.ok) {
      console.log(`[AuditRetention] Cleanup successful: ${result.deletedCount} rows deleted`);
      console.log('[AuditRetention] ========================================');
      process.exit(0);
    } else {
      console.error(`[AuditRetention] Cleanup failed: ${result.error}`);
      console.log('[AuditRetention] ========================================');
      process.exit(1);
    }
  } catch (error) {
    // This should never happen (service never throws), but handle it defensively
    console.error('[AuditRetention] Unexpected error:', error);
    console.log('[AuditRetention] ========================================');
    process.exit(1);
  }
}

// Run the cleanup
main();
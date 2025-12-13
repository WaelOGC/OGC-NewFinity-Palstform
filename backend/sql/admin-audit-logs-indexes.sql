-- Admin Audit Logs Index Migration
-- Safe to run multiple times (checks INFORMATION_SCHEMA before creating indexes)
-- Ensures optimal query performance for audit logs pagination and filtering

-- Check if table exists
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'AdminAuditLog'
);

-- Exit gracefully if table doesn't exist
SET @exit_message = IF(
  @table_exists = 0,
  'SELECT "Table AdminAuditLog does not exist - skipping index creation" AS message',
  'SELECT "Proceeding with index creation checks" AS message'
);

PREPARE exit_stmt FROM @exit_message;
EXECUTE exit_stmt;
DEALLOCATE PREPARE exit_stmt;

-- Only proceed if table exists
SET @proceed = IF(@table_exists = 0, 0, 1);

-- Index 1: idx_admin_audit_created_at on (createdAt)
-- Supports ORDER BY createdAt DESC queries
SET @index1_exists = IF(
  @proceed = 1,
  (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'AdminAuditLog' 
    AND INDEX_NAME = 'idx_admin_audit_created_at'
  ),
  1  -- Mark as exists to skip if table doesn't exist
);

SET @create_index1 = IF(
  @index1_exists = 0 AND @proceed = 1,
  'CREATE INDEX idx_admin_audit_created_at ON AdminAuditLog (createdAt)',
  'SELECT "Index idx_admin_audit_created_at already exists or skipped" AS message'
);

PREPARE stmt1 FROM @create_index1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Index 2: idx_admin_audit_created_id on (createdAt, id)
-- Supports stable pagination with ORDER BY createdAt DESC, id DESC
SET @index2_exists = IF(
  @proceed = 1,
  (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'AdminAuditLog' 
    AND INDEX_NAME = 'idx_admin_audit_created_id'
  ),
  1  -- Mark as exists to skip if table doesn't exist
);

SET @create_index2 = IF(
  @index2_exists = 0 AND @proceed = 1,
  'CREATE INDEX idx_admin_audit_created_id ON AdminAuditLog (createdAt, id)',
  'SELECT "Index idx_admin_audit_created_id already exists or skipped" AS message'
);

PREPARE stmt2 FROM @create_index2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Index 3: idx_admin_audit_actor_user on (actorUserId)
-- Supports filtering by actorUserId
SET @index3_exists = IF(
  @proceed = 1,
  (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'AdminAuditLog' 
    AND INDEX_NAME = 'idx_admin_audit_actor_user'
  ),
  1  -- Mark as exists to skip if table doesn't exist
);

SET @create_index3 = IF(
  @index3_exists = 0 AND @proceed = 1,
  'CREATE INDEX idx_admin_audit_actor_user ON AdminAuditLog (actorUserId)',
  'SELECT "Index idx_admin_audit_actor_user already exists or skipped" AS message'
);

PREPARE stmt3 FROM @create_index3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Index 4: idx_admin_audit_action on (action)
-- Supports filtering by action type
SET @index4_exists = IF(
  @proceed = 1,
  (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'AdminAuditLog' 
    AND INDEX_NAME = 'idx_admin_audit_action'
  ),
  1  -- Mark as exists to skip if table doesn't exist
);

SET @create_index4 = IF(
  @index4_exists = 0 AND @proceed = 1,
  'CREATE INDEX idx_admin_audit_action ON AdminAuditLog (action)',
  'SELECT "Index idx_admin_audit_action already exists or skipped" AS message'
);

PREPARE stmt4 FROM @create_index4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

-- Index 5: idx_admin_audit_status on (status)
-- Supports filtering by status (optional but recommended)
SET @index5_exists = IF(
  @proceed = 1,
  (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'AdminAuditLog' 
    AND INDEX_NAME = 'idx_admin_audit_status'
  ),
  1  -- Mark as exists to skip if table doesn't exist
);

SET @create_index5 = IF(
  @index5_exists = 0 AND @proceed = 1,
  'CREATE INDEX idx_admin_audit_status ON AdminAuditLog (status)',
  'SELECT "Index idx_admin_audit_status already exists or skipped" AS message'
);

PREPARE stmt5 FROM @create_index5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- Verification query (commented out - uncomment to verify indexes after running)
-- SHOW INDEX FROM AdminAuditLog;

SELECT 'Index migration completed successfully' AS message;

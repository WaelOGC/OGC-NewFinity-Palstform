-- Audit Logs Schema Migration
-- Creates audit_logs table for A1.3 - Admin User Status Changes
-- Safe to run multiple times (checks INFORMATION_SCHEMA before creating)

-- Check if table exists before creating
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'audit_logs'
);

-- Create table only if it doesn't exist
SET @create_table = IF(
  @table_exists = 0,
  'CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event VARCHAR(100) NOT NULL,
    actor_user_id BIGINT NULL,
    target_user_id BIGINT NULL,
    meta_json JSON NULL,
    ip VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_created_at (event, created_at),
    INDEX idx_actor_created_at (actor_user_id, created_at),
    INDEX idx_target_created_at (target_user_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT "Table audit_logs already exists" AS message'
);

PREPARE stmt FROM @create_table;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

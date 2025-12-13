-- Platform Settings Schema Migration
-- Creates platform_settings table for D1 - Global Settings Store
-- Safe to run multiple times (checks INFORMATION_SCHEMA before creating)

-- Check if table exists before creating
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'platform_settings'
);

-- Create table only if it doesn't exist
SET @create_table = IF(
  @table_exists = 0,
  'CREATE TABLE platform_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(120) NOT NULL UNIQUE,
    value_type VARCHAR(20) NOT NULL,
    value_json JSON NULL,
    updated_by_user_id BIGINT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_key_name (key_name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT "Table platform_settings already exists" AS message'
);

PREPARE stmt FROM @create_table;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

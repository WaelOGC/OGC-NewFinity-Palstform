-- Admin Audit Logs Schema
-- Safe to run multiple times (checks INFORMATION_SCHEMA before creating)

-- Check if table exists before creating
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'AdminAuditLog'
);

-- Create table only if it doesn't exist
SET @create_table = IF(
  @table_exists = 0,
  'CREATE TABLE AdminAuditLog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actorUserId INT NULL,
    actorEmail VARCHAR(255) NULL,
    action VARCHAR(120) NOT NULL,
    targetType VARCHAR(80) NULL,
    targetId VARCHAR(120) NULL,
    status VARCHAR(40) NULL,
    ip VARCHAR(64) NULL,
    requestId VARCHAR(64) NULL,
    message VARCHAR(255) NULL,
    meta JSON NULL,
    INDEX idx_createdAt (createdAt),
    INDEX idx_actorUserId (actorUserId),
    INDEX idx_action (action)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT "Table AdminAuditLog already exists" AS message'
);

PREPARE stmt FROM @create_table;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

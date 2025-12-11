-- ============================================================================
-- OGC NewFinity Platform - User Table Migration Fix
-- ============================================================================
-- 
-- PURPOSE:
-- This migration fixes the authentication database schema by ensuring the User
-- table contains all required columns for registration, login, and activation.
-- 
-- PROBLEM FIXED:
-- The backend expects columns (status, termsAccepted, termsAcceptedAt, 
-- termsVersion, termsSource) that may not exist in the MySQL User table,
-- causing errors like "Unknown column 'status' in 'field list'".
--
-- ============================================================================
-- HOW TO APPLY THIS MIGRATION
-- ============================================================================
--
-- OPTION 1: MySQL Command Line
-- ----------------------------
-- mysql -u <USERNAME> -p -h <HOST> <DATABASE_NAME> < backend/sql/fix-user-table-migration.sql
--
-- Example:
-- mysql -u root -p -h localhost ogc_newfinity < backend/sql/fix-user-table-migration.sql
--
-- OPTION 2: MySQL Workbench / phpMyAdmin
-- ---------------------------------------
-- 1. Open MySQL Workbench or phpMyAdmin
-- 2. Select your database (e.g., ogc_newfinity)
-- 3. Open the SQL tab/editor
-- 4. Copy and paste the entire contents of this file
-- 5. Execute the script
--
-- OPTION 3: MySQL Interactive Shell
-- ---------------------------------
-- mysql -u <USERNAME> -p -h <HOST> <DATABASE_NAME>
-- source backend/sql/fix-user-table-migration.sql;
--
-- ============================================================================
-- VERIFICATION AFTER MIGRATION
-- ============================================================================
--
-- After running this migration, verify the schema:
--
-- DESCRIBE User;
-- DESCRIBE ActivationToken;
--
-- Expected User columns:
-- - id, email, password, role, fullName
-- - status, termsAccepted, termsAcceptedAt, termsVersion, termsSource
-- - createdAt, updatedAt
--
-- Expected ActivationToken columns:
-- - id, userId, token, used, expiresAt, createdAt
--
-- ============================================================================

-- Ensure User table exists (create if it doesn't)
CREATE TABLE IF NOT EXISTS User (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' COMMENT 'User role: user, admin, etc',
  fullName VARCHAR(255) NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Add role column to User table (if it doesn't exist)
-- ============================================================================

-- Check if role column exists, add if missing
SET @dbname = DATABASE();
SET @tablename = 'User';
SET @columnname = 'role';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NOT NULL DEFAULT ''user'' COMMENT ''User role: user, admin, etc''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add status column to User table (if it doesn't exist)
-- ============================================================================

-- Check if status column exists, add if missing
SET @columnname = 'status';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NOT NULL DEFAULT ''pending_verification'' COMMENT ''Account status: pending_verification, active, disabled''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add termsAccepted column to User table (if it doesn't exist)
-- ============================================================================

SET @columnname = 'termsAccepted';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) NOT NULL DEFAULT 0')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add termsAcceptedAt column to User table (if it doesn't exist)
-- ============================================================================

SET @columnname = 'termsAcceptedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATETIME NULL DEFAULT NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add termsVersion column to User table (if it doesn't exist)
-- ============================================================================

SET @columnname = 'termsVersion';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(20) NULL DEFAULT NULL COMMENT ''Version of terms accepted (e.g., v1.0)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add termsSource column to User table (if it doesn't exist)
-- ============================================================================

SET @columnname = 'termsSource';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL DEFAULT NULL COMMENT ''Source of terms acceptance: email_password, google, x, linkedin, discord, github''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add index on status column (if it doesn't exist)
-- ============================================================================

-- Check if index exists before adding
SET @indexname = 'idx_user_status';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @indexname, ' (status)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Create ActivationToken table (if it doesn't exist)
-- ============================================================================
-- This table stores activation tokens for email verification.
-- Columns must match what activationService.js expects:
-- - id: Primary key (INT UNSIGNED)
-- - userId: Foreign key to user.id (INT to match user.id type)
-- - token: Hashed activation token (VARCHAR(255))
-- - used: Boolean flag (TINYINT(1))
-- - expiresAt: Expiration datetime (DATETIME)
-- - createdAt: Creation timestamp (TIMESTAMP)

-- Check if ActivationToken table exists before creating
SET @dbname = DATABASE();
SET @tablename = 'ActivationToken';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
  ) > 0,
  'SELECT 1', -- Table exists, do nothing
  CONCAT('CREATE TABLE ', @tablename, ' (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE COMMENT ''Hashed activation token (SHA-256)'',
  used TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Whether token has been used'',
  expiresAt DATETIME NOT NULL COMMENT ''Token expiration datetime'',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT ''Token creation timestamp'',
  PRIMARY KEY (id),
  CONSTRAINT fk_activation_user
    FOREIGN KEY (userId) REFERENCES user(id)
    ON DELETE CASCADE,
  INDEX idx_activation_userId (userId),
  INDEX idx_activation_token (token),
  INDEX idx_activation_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci')
));
PREPARE createIfNotExists FROM @preparedStatement;
EXECUTE createIfNotExists;
DEALLOCATE PREPARE createIfNotExists;

-- ============================================================================
-- Update existing users to active status (if status is NULL or empty)
-- ============================================================================
-- This is safe to run multiple times - it only updates users with NULL/empty status

UPDATE User 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- The User table now has all required columns:
-- ✅ role (VARCHAR(50), NOT NULL, default 'user')
-- ✅ status (VARCHAR(50), default 'pending_verification')
-- ✅ termsAccepted (TINYINT(1), default 0)
-- ✅ termsAcceptedAt (DATETIME, nullable)
-- ✅ termsVersion (VARCHAR(20), nullable)
-- ✅ termsSource (VARCHAR(50), nullable)
--
-- The ActivationToken table is ready for email verification:
-- ✅ id (INT UNSIGNED, primary key)
-- ✅ userId (INT, foreign key to user.id)
-- ✅ token (VARCHAR(255), hashed activation token, unique)
-- ✅ used (TINYINT(1), default 0)
-- ✅ expiresAt (DATETIME)
-- ✅ createdAt (TIMESTAMP, default CURRENT_TIMESTAMP)
--
-- Registration, login, and activation should now work without database errors.
-- ============================================================================

-- ============================================================================
-- HOW TO APPLY THIS MIGRATION:
-- ============================================================================
-- 1) Open in MySQL Workbench
-- 2) Select schema: ogc_newfinity
-- 3) Execute script
-- 4) Verify using:
--      USE ogc_newfinity;
--      SHOW TABLES LIKE 'ActivationToken';
--      DESCRIBE ActivationToken;
-- ============================================================================


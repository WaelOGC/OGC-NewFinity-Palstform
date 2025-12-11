-- ============================================================================
-- OGC NewFinity Platform - Password Reset Migration
-- ============================================================================
-- 
-- PURPOSE:
-- This migration adds password reset functionality by adding resetPasswordToken
-- and resetPasswordExpires columns to the User table.
--
-- ============================================================================
-- HOW TO APPLY THIS MIGRATION
-- ============================================================================
--
-- OPTION 1: MySQL Command Line
-- ----------------------------
-- mysql -u <USERNAME> -p -h <HOST> <DATABASE_NAME> < backend/sql/password-reset-migration.sql
--
-- Example:
-- mysql -u root -p -h localhost ogc_newfinity < backend/sql/password-reset-migration.sql
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
-- source backend/sql/password-reset-migration.sql;
--
-- ============================================================================

SET @dbname = DATABASE();
SET @tablename = 'User';

-- ============================================================================
-- Add resetPasswordToken column to User table (if it doesn't exist)
-- ============================================================================

SET @columnname = 'resetPasswordToken';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) NULL DEFAULT NULL COMMENT ''Password reset token (hashed)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add resetPasswordExpires column to User table (if it doesn't exist)
-- ============================================================================

SET @columnname = 'resetPasswordExpires';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATETIME NULL DEFAULT NULL COMMENT ''Password reset token expiration datetime''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add index on resetPasswordToken for faster lookups (if it doesn't exist)
-- ============================================================================

SET @indexname = 'idx_reset_password_token';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1', -- Index exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @indexname, ' (resetPasswordToken)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- The User table now has password reset columns:
-- ✅ resetPasswordToken (VARCHAR(255), nullable)
-- ✅ resetPasswordExpires (DATETIME, nullable)
-- ✅ Index on resetPasswordToken for fast lookups
--
-- Password reset functionality is now ready to use.
-- ============================================================================


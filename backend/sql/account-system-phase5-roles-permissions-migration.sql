-- ============================================================================
-- OGC NewFinity Platform - Account System Expansion (Phase 5) Migration
-- ============================================================================
-- 
-- PURPOSE:
-- This migration adds role-based access control (RBAC), permissions, and
-- feature flags to the User table, implementing Phase 4 specification.
-- 
-- PHASE 5 OBJECTIVES:
-- - Add role column with default 'STANDARD_USER'
-- - Add permissions JSON column for custom permission overrides
-- - Add featureFlags JSON column for feature flag management
-- - Migrate existing users to STANDARD_USER role
-- - Ensure backward compatibility
--
-- ============================================================================
-- HOW TO APPLY THIS MIGRATION
-- ============================================================================
--
-- OPTION 1: MySQL Command Line
-- ----------------------------
-- mysql -u <USERNAME> -p -h <HOST> <DATABASE_NAME> < backend/sql/account-system-phase5-roles-permissions-migration.sql
--
-- Example:
-- mysql -u root -p -h localhost ogc_newfinity < backend/sql/account-system-phase5-roles-permissions-migration.sql
--
-- OPTION 2: MySQL Workbench / phpMyAdmin
-- ---------------------------------------
-- 1. Open MySQL Workbench or phpMyAdmin
-- 2. Select your database (e.g., ogc_newfinity)
-- 3. Open the SQL tab/editor
-- 4. Copy and paste the entire contents of this file
-- 5. Execute the script
--
-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
--
-- To rollback this migration:
-- ALTER TABLE User DROP COLUMN IF EXISTS permissions;
-- ALTER TABLE User DROP COLUMN IF EXISTS featureFlags;
-- ALTER TABLE User MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';
-- UPDATE User SET role = 'user' WHERE role = 'STANDARD_USER';
--
-- Note: This will remove permissions and feature flags data.
-- Ensure no code depends on these columns before rolling back.
--
-- ============================================================================

SET @dbname = DATABASE();
SET @tablename = 'User';

-- ============================================================================
-- Update role column to use STANDARD_USER as default
-- ============================================================================
-- The role column may already exist from previous migrations.
-- We need to update it to use 'STANDARD_USER' as the default value
-- and migrate existing 'user' values to 'STANDARD_USER'.

-- First, update existing 'user' role values to 'STANDARD_USER'
UPDATE User SET role = 'STANDARD_USER' WHERE role = 'user' OR role IS NULL;

-- Check if role column exists and update it
SET @columnname = 'role';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  -- Column exists: modify it to have correct default
  CONCAT('ALTER TABLE ', @tablename, ' MODIFY COLUMN ', @columnname, ' VARCHAR(50) NOT NULL DEFAULT ''STANDARD_USER'' COMMENT ''User role: FOUNDER, CORE_TEAM, ADMIN, MODERATOR, CREATOR, STANDARD_USER, SUSPENDED, BANNED'''),
  -- Column doesn't exist: add it
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NOT NULL DEFAULT ''STANDARD_USER'' COMMENT ''User role: FOUNDER, CORE_TEAM, ADMIN, MODERATOR, CREATOR, STANDARD_USER, SUSPENDED, BANNED''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ensure all existing users have STANDARD_USER role
UPDATE User SET role = 'STANDARD_USER' WHERE role IS NULL OR role = '';

-- ============================================================================
-- Add permissions column (JSON)
-- ============================================================================
SET @columnname = 'permissions';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' JSON NULL COMMENT ''Custom permissions array (overrides role defaults). NULL means use role defaults, empty array [] means no permissions.''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add featureFlags column (JSON)
-- ============================================================================
SET @columnname = 'featureFlags';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' JSON NULL COMMENT ''Feature flags object. NULL means all flags are false, missing keys default to false.''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add index on role column for performance
-- ============================================================================
SET @indexname = 'idx_role';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1', -- Index exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @indexname, ' (role)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- The User table now includes:
-- ✅ role (VARCHAR(50), NOT NULL, DEFAULT 'STANDARD_USER')
-- ✅ permissions (JSON, NULL) - Custom permissions array
-- ✅ featureFlags (JSON, NULL) - Feature flags object
-- ✅ Index on role column for query performance
--
-- All existing users have been migrated to STANDARD_USER role.
-- Permissions and featureFlags are NULL by default (use role defaults).
--
-- ============================================================================

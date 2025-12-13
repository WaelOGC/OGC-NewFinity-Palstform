-- ============================================================================
-- Migration: admin-users-last-login-and-roles.sql
-- Purpose: Add lastLoginAt column and ensure status/role columns exist
-- Schema-drift tolerant: Safe to run multiple times
-- Handles both 'users' and 'User' table names
-- ============================================================================

SET @dbname = DATABASE();

-- Helper procedure to apply migration to a specific table
DELIMITER $$

DROP PROCEDURE IF EXISTS apply_migration_to_table$$

CREATE PROCEDURE apply_migration_to_table(IN tablename VARCHAR(64))
BEGIN
  DECLARE tableExists INT DEFAULT 0;
  DECLARE lastLoginExists INT DEFAULT 0;
  DECLARE statusExists INT DEFAULT 0;
  DECLARE accountStatusExists INT DEFAULT 0;
  DECLARE roleExists INT DEFAULT 0;
  
  -- Check if table exists
  SELECT COUNT(*) INTO tableExists
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @dbname 
    AND TABLE_NAME = tablename;
  
  IF tableExists > 0 THEN
    -- Check if lastLoginAt column exists
    SELECT COUNT(*) INTO lastLoginExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname 
      AND TABLE_NAME = tablename 
      AND COLUMN_NAME = 'lastLoginAt';
    
    -- Add lastLoginAt if missing
    IF lastLoginExists = 0 THEN
      SET @sql = CONCAT('ALTER TABLE `', tablename, '` ADD COLUMN lastLoginAt DATETIME NULL COMMENT ''Last successful login timestamp''');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    END IF;
    
    -- Check status columns
    SELECT COUNT(*) INTO statusExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname 
      AND TABLE_NAME = tablename 
      AND COLUMN_NAME = 'status';
    
    SELECT COUNT(*) INTO accountStatusExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname 
      AND TABLE_NAME = tablename 
      AND COLUMN_NAME = 'accountStatus';
    
    -- Add status column if neither exists
    IF statusExists = 0 AND accountStatusExists = 0 THEN
      SET @sql = CONCAT('ALTER TABLE `', tablename, '` ADD COLUMN status VARCHAR(50) NULL COMMENT ''Account status: PENDING, ACTIVE, DISABLED''');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    END IF;
    
    -- Check if role column exists
    SELECT COUNT(*) INTO roleExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname 
      AND TABLE_NAME = tablename 
      AND COLUMN_NAME = 'role';
    
    -- Add role if missing
    IF roleExists = 0 THEN
      SET @sql = CONCAT('ALTER TABLE `', tablename, '` ADD COLUMN role VARCHAR(50) NULL COMMENT ''User role: FOUNDER, CORE_TEAM, ADMIN, MODERATOR, CREATOR, STANDARD_USER, SUSPENDED, BANNED''');
      PREPARE stmt FROM @sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;
    END IF;
  END IF;
END$$

DELIMITER ;

-- Apply migration to 'users' table (preferred)
CALL apply_migration_to_table('users');

-- Apply migration to 'User' table (fallback)
CALL apply_migration_to_table('User');

-- Cleanup
DROP PROCEDURE IF EXISTS apply_migration_to_table;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- This migration ensures for both 'users' and 'User' tables:
-- - lastLoginAt column exists (nullable DATETIME for tracking last login)
-- - status column exists (nullable VARCHAR for account status tracking)
-- - role column exists (nullable VARCHAR for user role tracking)
--
-- All changes are schema-drift tolerant and safe to run multiple times.
-- If a table doesn't exist, it's skipped without error.
-- ============================================================================

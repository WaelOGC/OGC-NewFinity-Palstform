-- ============================================================================
-- Migration: 004-normalize-account-status.sql
-- Purpose: Normalize accountStatus values to canonical uppercase values
-- Canonical values: PENDING, ACTIVE, DISABLED
-- 
-- This migration is idempotent and can be run multiple times safely.
-- ============================================================================

SET @dbname = DATABASE();
SET @tablename = 'User';

-- ============================================================================
-- STEP 1: Ensure accountStatus column exists
-- ============================================================================

SET @columnname = 'accountStatus';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NOT NULL DEFAULT ''PENDING'' COMMENT ''Account status: PENDING, ACTIVE, DISABLED''')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 2: Normalize existing accountStatus values
-- ============================================================================

-- Normalize accountStatus column (if it exists)
-- Map: active/ACTIVE → ACTIVE
-- Map: disabled/DISABLED → DISABLED  
-- Map: pending/pending_verification/PENDING → PENDING
-- Map: null/empty → PENDING
-- Map: SUSPENDED/BANNED/DELETED → DISABLED

UPDATE `User` 
SET accountStatus = CASE
  WHEN accountStatus IS NULL OR accountStatus = '' THEN 'PENDING'
  WHEN UPPER(TRIM(accountStatus)) = 'ACTIVE' THEN 'ACTIVE'
  WHEN UPPER(TRIM(accountStatus)) = 'DISABLED' THEN 'DISABLED'
  WHEN UPPER(TRIM(accountStatus)) = 'PENDING' THEN 'PENDING'
  WHEN UPPER(TRIM(accountStatus)) = 'PENDING_VERIFICATION' THEN 'PENDING'
  WHEN UPPER(TRIM(accountStatus)) IN ('SUSPENDED', 'BANNED', 'DELETED') THEN 'DISABLED'
  ELSE 'PENDING' -- Unknown values default to PENDING
END
WHERE accountStatus IS NOT NULL;

-- Handle NULL/empty accountStatus by checking status column and emailVerified
UPDATE `User`
SET accountStatus = CASE
  WHEN emailVerified = 1 AND (status IS NULL OR status = '' OR UPPER(TRIM(status)) IN ('ACTIVE', 'active')) THEN 'ACTIVE'
  WHEN emailVerified = 0 OR status IS NULL OR status = '' OR UPPER(TRIM(status)) IN ('PENDING', 'pending', 'PENDING_VERIFICATION', 'pending_verification') THEN 'PENDING'
  WHEN UPPER(TRIM(status)) IN ('DISABLED', 'disabled', 'SUSPENDED', 'BANNED', 'DELETED') THEN 'DISABLED'
  ELSE 'PENDING'
END
WHERE accountStatus IS NULL OR accountStatus = '';

-- ============================================================================
-- STEP 3: Normalize status column to match accountStatus (for compatibility)
-- ============================================================================

UPDATE `User`
SET status = accountStatus
WHERE status IS NOT NULL 
  AND accountStatus IS NOT NULL
  AND UPPER(TRIM(status)) != UPPER(TRIM(accountStatus));

-- ============================================================================
-- STEP 4: Set default for future inserts (if supported by MySQL version)
-- ============================================================================

-- Note: MySQL doesn't support ALTER COLUMN SET DEFAULT easily, so we rely on code
-- to set PENDING as default. But we can ensure existing NULLs are set.

UPDATE `User`
SET accountStatus = 'PENDING'
WHERE accountStatus IS NULL OR accountStatus = '';

-- ============================================================================
-- STEP 5: Verification queries (for manual inspection)
-- ============================================================================

-- Count by status (run this to verify):
-- SELECT accountStatus, COUNT(*) as count FROM `User` GROUP BY accountStatus;

-- Expected result should show only: PENDING, ACTIVE, DISABLED

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- All accountStatus values have been normalized to canonical uppercase values:
-- - PENDING: Registered but not activated / email not verified
-- - ACTIVE: Allowed to login/use platform
-- - DISABLED: Blocked by admin / restricted
--
-- This migration is idempotent and can be run multiple times safely.
-- ============================================================================

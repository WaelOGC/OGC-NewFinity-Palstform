-- ============================================================================
-- OGC NewFinity Platform - Account System Expansion (Phase 1) Migration
-- ============================================================================
-- 
-- PURPOSE:
-- This migration expands the User table to support a comprehensive account
-- system with profile attributes, security layers, and future scalability.
-- 
-- PHASE 1 OBJECTIVES:
-- - Expand user table with profile fields (username, country, bio, phone, avatarUrl)
-- - Add account status and onboarding tracking
-- - Prepare table structures for future modules (2FA, UserDevices, UserSessions)
--
-- ============================================================================
-- HOW TO APPLY THIS MIGRATION
-- ============================================================================
--
-- OPTION 1: MySQL Command Line
-- ----------------------------
-- mysql -u <USERNAME> -p -h <HOST> <DATABASE_NAME> < backend/sql/account-system-phase1-migration.sql
--
-- Example:
-- mysql -u root -p -h localhost ogc_newfinity < backend/sql/account-system-phase1-migration.sql
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

SET @dbname = DATABASE();
SET @tablename = 'User';

-- ============================================================================
-- Add username column (unique handle)
-- ============================================================================
SET @columnname = 'username';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL UNIQUE COMMENT ''Unique user handle/username''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index on username if it doesn't exist
SET @indexname = 'idx_username';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (INDEX_NAME = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD UNIQUE INDEX ', @indexname, ' (username)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add country column
-- ============================================================================
SET @columnname = 'country';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) NULL COMMENT ''User country''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add bio column
-- ============================================================================
SET @columnname = 'bio';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL COMMENT ''User biography/about text''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add phone column (nullable)
-- ============================================================================
SET @columnname = 'phone';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(20) NULL COMMENT ''User phone number''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add avatarUrl column
-- ============================================================================
SET @columnname = 'avatarUrl';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL COMMENT ''URL to user avatar image''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add accountStatus column (if status doesn't exist, use accountStatus)
-- Note: We check if 'status' exists first, if it does we'll use it
-- Otherwise we add accountStatus
-- ============================================================================
SET @columnname = 'accountStatus';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = 'status')
  ) > 0,
  'SELECT 1', -- status column exists, we'll use it
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NOT NULL DEFAULT ''active'' COMMENT ''Account status: active, suspended, pending''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add onboardingStep column
-- ============================================================================
SET @columnname = 'onboardingStep';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NOT NULL DEFAULT 0 COMMENT ''Onboarding progress step (0 = not started, higher = completed steps)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Add lastLoginAt column
-- ============================================================================
SET @columnname = 'lastLoginAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATETIME NULL COMMENT ''Last login timestamp''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Ensure createdAt and updatedAt exist (they should already exist)
-- ============================================================================
SET @columnname = 'createdAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'updatedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Create UserDevices table (structure only - for Phase 2)
-- ============================================================================
-- TODO: Expand in Phase 2 (device tracking, browser fingerprinting, session management)
CREATE TABLE IF NOT EXISTS UserDevices (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  deviceFingerprint VARCHAR(255) NULL COMMENT 'Browser/device fingerprint',
  deviceName VARCHAR(255) NULL COMMENT 'User-friendly device name',
  userAgent TEXT NULL,
  ipAddress VARCHAR(45) NULL,
  lastSeenAt DATETIME NULL,
  isTrusted TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'User has marked device as trusted',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_deviceFingerprint (deviceFingerprint),
  CONSTRAINT fk_userdevices_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Create UserSessions table (structure only - for Phase 2)
-- ============================================================================
-- TODO: Expand in Phase 2 (session management, token tracking, device binding)
CREATE TABLE IF NOT EXISTS UserSessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  sessionToken VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hashed session token',
  refreshToken VARCHAR(255) NULL COMMENT 'Hashed refresh token',
  deviceId BIGINT UNSIGNED NULL COMMENT 'Reference to UserDevices.id',
  ipAddress VARCHAR(45) NULL,
  userAgent TEXT NULL,
  expiresAt DATETIME NOT NULL,
  revokedAt DATETIME NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_sessionToken (sessionToken),
  INDEX idx_expiresAt (expiresAt),
  CONSTRAINT fk_usersessions_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  CONSTRAINT fk_usersessions_device FOREIGN KEY (deviceId) REFERENCES UserDevices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Create TwoFactorAuth table (structure only - for Phase 2)
-- ============================================================================
-- TODO: Expand in Phase 2 (2FA setup, TOTP secrets, backup codes, recovery methods)
CREATE TABLE IF NOT EXISTS TwoFactorAuth (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL UNIQUE,
  secret VARCHAR(255) NULL COMMENT 'TOTP secret (encrypted)',
  backupCodes TEXT NULL COMMENT 'JSON array of hashed backup codes',
  isEnabled TINYINT(1) NOT NULL DEFAULT 0,
  enabledAt DATETIME NULL,
  lastVerifiedAt DATETIME NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  CONSTRAINT fk_twofactorauth_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Create UserActivityLog table (for account activity tracking)
-- ============================================================================
-- TODO: Expand in Phase 2 (permissions, device tracking, verification, wallet linking)
CREATE TABLE IF NOT EXISTS UserActivityLog (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  activityType VARCHAR(100) NOT NULL COMMENT 'e.g., login, profile_update, password_change',
  description TEXT NULL,
  ipAddress VARCHAR(45) NULL,
  userAgent TEXT NULL,
  metadata JSON NULL COMMENT 'Additional activity metadata',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_activityType (activityType),
  INDEX idx_createdAt (createdAt),
  CONSTRAINT fk_useractivitylog_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- The User table now includes:
-- ✅ username (VARCHAR(50), unique, nullable)
-- ✅ country (VARCHAR(100), nullable)
-- ✅ bio (TEXT, nullable)
-- ✅ phone (VARCHAR(20), nullable)
-- ✅ avatarUrl (VARCHAR(500), nullable)
-- ✅ accountStatus (VARCHAR(50), default 'active') or status (if exists)
-- ✅ onboardingStep (INT, default 0)
-- ✅ lastLoginAt (DATETIME, nullable)
-- ✅ createdAt, updatedAt (timestamps)
--
-- Future tables created (structure only):
-- ✅ UserDevices (for Phase 2 device tracking)
-- ✅ UserSessions (for Phase 2 session management)
-- ✅ TwoFactorAuth (for Phase 2 2FA support)
-- ✅ UserActivityLog (for account activity tracking)
--
-- ============================================================================

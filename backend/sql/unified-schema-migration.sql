-- ============================================================================
-- OGC NewFinity Platform - Unified Schema Migration
-- ============================================================================
-- 
-- PURPOSE:
-- This is a comprehensive, idempotent migration that ensures all expected
-- database schema elements exist. It can be run multiple times safely.
-- 
-- COVERS:
-- - User table: all columns (accountStatus, emailVerified, OAuth providers, etc.)
-- - Token tables: PasswordResetToken, ActivationToken
-- - 2FA tables: TwoFactorAuth, UserTwoFactor, UserTwoFactorRecovery
-- - Session tables: AuthSession
-- - Activity tables: UserActivityLog
-- - Wallet tables: WalletTransaction
-- - Device tables: UserDevices (if needed)
--
-- ============================================================================
-- HOW TO APPLY
-- ============================================================================
-- Run via migration runner:
--   npm run db:migrate
-- 
-- Or manually via MySQL:
--   mysql -u <USER> -p <DATABASE> < backend/sql/unified-schema-migration.sql
-- ============================================================================

SET @dbname = DATABASE();
SET @tablename = 'User';

-- ============================================================================
-- STEP 1: Ensure User table exists with core structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS `User` (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NULL DEFAULT NULL COMMENT 'Nullable for OAuth-only users',
  fullName VARCHAR(255) NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'STANDARD_USER' COMMENT 'User role: FOUNDER, CORE_TEAM, ADMIN, MODERATOR, CREATOR, STANDARD_USER, SUSPENDED, BANNED',
  status VARCHAR(50) NOT NULL DEFAULT 'pending_verification' COMMENT 'Account status: pending_verification, active, disabled',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 2: Add User table columns (idempotent - only if missing)
-- ============================================================================

-- accountStatus column (used alongside status for compatibility)
SET @columnname = 'accountStatus';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NOT NULL DEFAULT ''active'' COMMENT ''Account status: active, suspended, banned, deleted''')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- emailVerified column
SET @columnname = 'emailVerified';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''Whether email is verified by provider''')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- OAuth provider columns
SET @columns = JSON_ARRAY(
  JSON_OBJECT('name', 'googleId', 'def', 'VARCHAR(255) NULL DEFAULT NULL COMMENT ''Google OAuth user ID'''),
  JSON_OBJECT('name', 'githubId', 'def', 'VARCHAR(255) NULL DEFAULT NULL COMMENT ''GitHub OAuth user ID'''),
  JSON_OBJECT('name', 'twitterId', 'def', 'VARCHAR(255) NULL DEFAULT NULL COMMENT ''Twitter/X OAuth user ID'''),
  JSON_OBJECT('name', 'linkedinId', 'def', 'VARCHAR(255) NULL DEFAULT NULL COMMENT ''LinkedIn OAuth user ID'''),
  JSON_OBJECT('name', 'discordId', 'def', 'VARCHAR(255) NULL DEFAULT NULL COMMENT ''Discord OAuth user ID'''),
  JSON_OBJECT('name', 'authProvider', 'def', 'VARCHAR(50) NULL DEFAULT NULL COMMENT ''Authentication provider: local, google, github, twitter, linkedin, discord'''),
  JSON_OBJECT('name', 'avatarUrl', 'def', 'VARCHAR(500) NULL DEFAULT NULL COMMENT ''User avatar URL from OAuth provider'''),
  JSON_OBJECT('name', 'username', 'def', 'VARCHAR(50) NULL COMMENT ''Unique user handle/username'''),
  JSON_OBJECT('name', 'country', 'def', 'VARCHAR(100) NULL COMMENT ''User country'''),
  JSON_OBJECT('name', 'bio', 'def', 'TEXT NULL COMMENT ''User biography/about text'''),
  JSON_OBJECT('name', 'phone', 'def', 'VARCHAR(20) NULL COMMENT ''User phone number'''),
  JSON_OBJECT('name', 'termsAccepted', 'def', 'TINYINT(1) NOT NULL DEFAULT 0'),
  JSON_OBJECT('name', 'termsAcceptedAt', 'def', 'DATETIME NULL DEFAULT NULL'),
  JSON_OBJECT('name', 'termsVersion', 'def', 'VARCHAR(20) NULL DEFAULT NULL COMMENT ''Version of terms accepted (e.g., v1.0)'''),
  JSON_OBJECT('name', 'termsSource', 'def', 'VARCHAR(50) NULL DEFAULT NULL COMMENT ''Source of terms acceptance: email_password, google, x, linkedin, discord, github'''),
  JSON_OBJECT('name', 'permissions', 'def', 'JSON NULL COMMENT ''Custom permissions array (overrides role defaults). NULL means use role defaults, empty array [] means no permissions.'''),
  JSON_OBJECT('name', 'featureFlags', 'def', 'JSON NULL COMMENT ''Feature flags object. NULL means all flags are false, missing keys default to false.'''),
  JSON_OBJECT('name', 'deletedAt', 'def', 'DATETIME NULL COMMENT ''Timestamp when account was soft-deleted'''),
  JSON_OBJECT('name', 'deletedReason', 'def', 'VARCHAR(255) NULL COMMENT ''Reason for account deletion (e.g., USER_SELF_DELETE, ADMIN_DELETE)'''),
  JSON_OBJECT('name', 'onboardingStep', 'def', 'INT NOT NULL DEFAULT 0 COMMENT ''Onboarding progress step (0 = not started, higher = completed steps)'''),
  JSON_OBJECT('name', 'lastLoginAt', 'def', 'DATETIME NULL COMMENT ''Last login timestamp''')
);

-- Add each column if it doesn't exist
SET @i = 0;
WHILE @i < JSON_LENGTH(@columns) DO
  SET @col = JSON_EXTRACT(@columns, CONCAT('$[', @i, ']'));
  SET @colname = JSON_UNQUOTE(JSON_EXTRACT(@col, '$.name'));
  SET @coldef = JSON_UNQUOTE(JSON_EXTRACT(@col, '$.def'));
  
  SET @preparedStatement = (SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @colname, ' ', @coldef)
  ));
  PREPARE stmt FROM @preparedStatement;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  SET @i = @i + 1;
END WHILE;

-- ============================================================================
-- STEP 3: Add indexes for User table
-- ============================================================================

-- Unique index for username
SET @indexname = 'idx_username_unique';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = @indexname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD UNIQUE INDEX ', @indexname, ' (username)')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Indexes for OAuth provider IDs
SET @oauthIndexes = JSON_ARRAY('googleId', 'githubId', 'twitterId', 'linkedinId', 'discordId');
SET @i = 0;
WHILE @i < JSON_LENGTH(@oauthIndexes) DO
  SET @colname = JSON_UNQUOTE(JSON_EXTRACT(@oauthIndexes, CONCAT('$[', @i, ']')));
  SET @idxname = CONCAT('idx_', @colname);
  
  SET @preparedStatement = (SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = @idxname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX ', @idxname, ' (', @colname, ')')
  ));
  PREPARE stmt FROM @preparedStatement;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  SET @i = @i + 1;
END WHILE;

-- ============================================================================
-- STEP 4: Ensure password column is nullable (for OAuth-only users)
-- ============================================================================

-- Check if password is nullable, if not make it nullable
SET @preparedStatement = (SELECT IF(
  (
    SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'password'
    AND IS_NULLABLE = 'YES'
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 5: Create PasswordResetToken table
-- ============================================================================

CREATE TABLE IF NOT EXISTS PasswordResetToken (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL COMMENT 'Hashed password reset token (SHA-256)',
  tokenPlain VARCHAR(255) NULL COMMENT 'Plain token (dev-only, for debugging)',
  expiresAt DATETIME NOT NULL COMMENT 'Token expiration datetime',
  usedAt DATETIME NULL COMMENT 'When token was used (NULL if not used)',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_passwordresettoken_userId (userId),
  INDEX idx_passwordresettoken_token (token),
  CONSTRAINT fk_passwordresettoken_user FOREIGN KEY (userId) REFERENCES `User`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 6: Create ActivationToken table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ActivationToken (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hashed activation token (SHA-256)',
  used TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether token has been used',
  expiresAt DATETIME NOT NULL COMMENT 'Token expiration datetime',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Token creation timestamp',
  PRIMARY KEY (id),
  INDEX idx_activation_userId (userId),
  INDEX idx_activation_token (token),
  INDEX idx_activation_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 7: Create TwoFactorAuth table
-- ============================================================================

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
  CONSTRAINT fk_twofactorauth_user FOREIGN KEY (userId) REFERENCES `User`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 8: Create UserTwoFactor table (alternative 2FA table name)
-- ============================================================================

CREATE TABLE IF NOT EXISTS UserTwoFactor (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  secret VARCHAR(128) NOT NULL,
  isEnabled TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmedAt DATETIME NULL,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_2fa_user (userId),
  CONSTRAINT fk_2fa_user FOREIGN KEY (userId) REFERENCES `User`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 9: Create UserTwoFactorRecovery table
-- ============================================================================

CREATE TABLE IF NOT EXISTS UserTwoFactorRecovery (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  codeHash VARCHAR(128) NOT NULL,
  label VARCHAR(64) NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  usedAt DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_userId (userId),
  CONSTRAINT fk_recovery_user FOREIGN KEY (userId) REFERENCES `User`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 10: Create AuthSession table
-- ============================================================================

-- Detect User.id type dynamically
SET @userIdType = 'BIGINT UNSIGNED';
SELECT DATA_TYPE, COLUMN_TYPE INTO @dt, @ct
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'id'
LIMIT 1;

IF @ct IS NOT NULL THEN
  SET @userIdType = @ct;
END IF;

SET @createAuthSession = CONCAT('
CREATE TABLE IF NOT EXISTS AuthSession (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId ', @userIdType, ' NOT NULL,
  sessionToken VARCHAR(64) NOT NULL COMMENT ''Opaque session token'',
  userAgent TEXT NULL COMMENT ''Raw user agent string'',
  ipAddress VARCHAR(100) NULL COMMENT ''IPv4/IPv6'',
  deviceFingerprint VARCHAR(255) NULL COMMENT ''Hashed device fingerprint'',
  deviceLabel VARCHAR(255) NULL COMMENT ''Optional human-friendly device name'',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastSeenAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME NOT NULL,
  revokedAt DATETIME NULL,
  isCurrent TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''Mark current device session'',
  PRIMARY KEY (id),
  UNIQUE KEY idx_authsession_token (sessionToken),
  KEY idx_authsession_userId (userId),
  KEY idx_authsession_expiresAt (expiresAt),
  CONSTRAINT fk_authsession_user
    FOREIGN KEY (userId) REFERENCES `User`(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
');

PREPARE stmt FROM @createAuthSession;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add missing columns to AuthSession if table already exists
SET @sessionColumns = JSON_ARRAY(
  JSON_OBJECT('name', 'deviceFingerprint', 'def', 'VARCHAR(255) NULL COMMENT ''Hashed device fingerprint'''),
  JSON_OBJECT('name', 'expiresAt', 'def', 'DATETIME NOT NULL DEFAULT (DATE_ADD(NOW(), INTERVAL 30 DAY))'),
  JSON_OBJECT('name', 'revokedAt', 'def', 'DATETIME NULL'),
  JSON_OBJECT('name', 'deviceLabel', 'def', 'VARCHAR(255) NULL COMMENT ''Optional human-friendly device name'''),
  JSON_OBJECT('name', 'isCurrent', 'def', 'TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''Mark current device session''')
);

SET @i = 0;
WHILE @i < JSON_LENGTH(@sessionColumns) DO
  SET @col = JSON_EXTRACT(@sessionColumns, CONCAT('$[', @i, ']'));
  SET @colname = JSON_UNQUOTE(JSON_EXTRACT(@col, '$.name'));
  SET @coldef = JSON_UNQUOTE(JSON_EXTRACT(@col, '$.def'));
  
  SET @preparedStatement = (SELECT IF(
    (
      SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'AuthSession' AND COLUMN_NAME = @colname
    ) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE AuthSession ADD COLUMN ', @colname, ' ', @coldef)
  ));
  PREPARE stmt FROM @preparedStatement;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  SET @i = @i + 1;
END WHILE;

-- ============================================================================
-- STEP 11: Create UserActivityLog table
-- ============================================================================

CREATE TABLE IF NOT EXISTS UserActivityLog (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL COMMENT 'The subject user (whose account this event is about)',
  actorId BIGINT UNSIGNED NULL COMMENT 'Who performed the action (same as userId for self, or admin ID)',
  activityType VARCHAR(100) NOT NULL COMMENT 'e.g., LOGIN_SUCCESS, PASSWORD_CHANGED, ROLE_CHANGED',
  description TEXT NULL,
  ipAddress VARCHAR(45) NULL,
  userAgent TEXT NULL,
  metadata JSON NULL COMMENT 'Additional activity metadata',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_actorId (actorId),
  INDEX idx_activityType (activityType),
  INDEX idx_createdAt (createdAt),
  INDEX idx_userId_createdAt (userId, createdAt DESC),
  CONSTRAINT fk_useractivitylog_user FOREIGN KEY (userId) REFERENCES `User`(id) ON DELETE CASCADE,
  CONSTRAINT fk_useractivitylog_actor FOREIGN KEY (actorId) REFERENCES `User`(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add actorId column if missing
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'UserActivityLog' AND COLUMN_NAME = 'actorId'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE UserActivityLog ADD COLUMN actorId BIGINT UNSIGNED NULL COMMENT ''Who performed the action (same as userId for self, or admin ID)'' AFTER userId'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- STEP 12: Create WalletTransaction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS WalletTransaction (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId BIGINT UNSIGNED NOT NULL,
  type ENUM('DEPOSIT','WITHDRAW','TRANSFER','REWARD') NOT NULL,
  direction ENUM('IN','OUT','INTERNAL') NOT NULL,
  amount DECIMAL(18, 4) NOT NULL,
  tokenSymbol VARCHAR(16) NOT NULL DEFAULT 'OGC',
  status ENUM('PENDING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  txHash VARCHAR(100) NULL,
  chain VARCHAR(50) NULL,
  notes VARCHAR(255) NULL,
  occurredAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_WalletTransaction_userId (userId),
  INDEX idx_WalletTransaction_occurredAt (occurredAt),
  CONSTRAINT fk_WalletTransaction_user
    FOREIGN KEY (userId) REFERENCES `User`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 13: Create UserDevices table (if needed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS UserDevices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId BIGINT UNSIGNED NOT NULL,
  deviceFingerprint VARCHAR(255) NOT NULL,
  deviceName VARCHAR(255) NULL,
  userAgent TEXT NULL,
  ipAddress VARCHAR(100) NULL,
  lastSeenAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_user_device (userId, deviceFingerprint),
  CONSTRAINT fk_userdevices_user FOREIGN KEY (userId) REFERENCES `User`(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 14: Update existing data (set defaults where needed)
-- ============================================================================

-- Ensure all users have STANDARD_USER role if role is NULL/empty
UPDATE `User` SET role = 'STANDARD_USER' WHERE role IS NULL OR role = '' OR role = 'user';

-- Set accountStatus from status if accountStatus is NULL
UPDATE `User` SET accountStatus = status WHERE accountStatus IS NULL OR accountStatus = '';

-- ============================================================================
-- STEP: Normalize accountStatus values to canonical uppercase
-- ============================================================================

-- Normalize accountStatus column
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

-- Normalize status column to match accountStatus (for compatibility)
UPDATE `User`
SET status = accountStatus
WHERE status IS NOT NULL 
  AND accountStatus IS NOT NULL
  AND UPPER(TRIM(status)) != UPPER(TRIM(accountStatus));

-- Ensure all NULL accountStatus are set to PENDING
UPDATE `User`
SET accountStatus = 'PENDING'
WHERE accountStatus IS NULL OR accountStatus = '';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- All expected schema elements have been created or verified.
-- This migration is idempotent and can be run multiple times safely.
-- ============================================================================

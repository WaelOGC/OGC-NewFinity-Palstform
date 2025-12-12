/**
 * Unified Schema Migration Runner
 * 
 * This script ensures all expected database schema elements exist.
 * It's idempotent and can be run multiple times safely.
 * 
 * Usage:
 *   npm run db:migrate
 *   node scripts/run-unified-migration.js
 */

import pool from '../src/db.js';
import env from '../src/config/env.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_NAME = env.DB_NAME;

/**
 * Check if a column exists in a table
 */
async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DB_NAME, tableName, columnName]
  );
  return rows[0].count > 0;
}

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DB_NAME, tableName]
  );
  return rows[0].count > 0;
}

/**
 * Check if an index exists
 */
async function indexExists(tableName, indexName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [DB_NAME, tableName, indexName]
  );
  return rows[0].count > 0;
}

/**
 * Get User.id column type with full definition (including UNSIGNED if applicable)
 */
async function getUserIdType() {
  try {
    const [rows] = await pool.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'User' AND COLUMN_NAME = 'id'`,
      [DB_NAME]
    );
    if (rows && rows.length > 0) {
      const typeDefinition = rows[0].COLUMN_TYPE;
      console.log(`[Migration] Detected User.id type: ${typeDefinition}`);
      return typeDefinition;
    }
  } catch (err) {
    console.warn('[Migration] Could not detect User.id type, using default:', err.message);
  }
  // Default fallback (should match what User table actually uses)
  return 'BIGINT UNSIGNED';
}

/**
 * Ensure User table exists with all required columns
 */
async function ensureUserTable() {
  console.log('[Migration] Ensuring User table...');
  
  // Create User table if it doesn't exist
  if (!(await tableExists('User'))) {
    console.log('[Migration] Creating User table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`User\` (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ User table created');
  }

  // Define all columns that should exist
  const columns = [
    { name: 'accountStatus', def: "VARCHAR(50) NOT NULL DEFAULT 'active' COMMENT 'Account status: active, suspended, banned, deleted'" },
    { name: 'emailVerified', def: 'TINYINT(1) NOT NULL DEFAULT 0 COMMENT \'Whether email is verified by provider\'' },
    { name: 'googleId', def: "VARCHAR(255) NULL DEFAULT NULL COMMENT 'Google OAuth user ID'" },
    { name: 'githubId', def: "VARCHAR(255) NULL DEFAULT NULL COMMENT 'GitHub OAuth user ID'" },
    { name: 'twitterId', def: "VARCHAR(255) NULL DEFAULT NULL COMMENT 'Twitter/X OAuth user ID'" },
    { name: 'linkedinId', def: "VARCHAR(255) NULL DEFAULT NULL COMMENT 'LinkedIn OAuth user ID'" },
    { name: 'discordId', def: "VARCHAR(255) NULL DEFAULT NULL COMMENT 'Discord OAuth user ID'" },
    { name: 'authProvider', def: "VARCHAR(50) NULL DEFAULT NULL COMMENT 'Authentication provider: local, google, github, twitter, linkedin, discord'" },
    { name: 'avatarUrl', def: "VARCHAR(500) NULL DEFAULT NULL COMMENT 'User avatar URL from OAuth provider'" },
    { name: 'username', def: "VARCHAR(50) NULL COMMENT 'Unique user handle/username'" },
    { name: 'country', def: "VARCHAR(100) NULL COMMENT 'User country'" },
    { name: 'bio', def: "TEXT NULL COMMENT 'User biography/about text'" },
    { name: 'phone', def: "VARCHAR(20) NULL COMMENT 'User phone number'" },
    { name: 'termsAccepted', def: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'termsAcceptedAt', def: 'DATETIME NULL DEFAULT NULL' },
    { name: 'termsVersion', def: "VARCHAR(20) NULL DEFAULT NULL COMMENT 'Version of terms accepted (e.g., v1.0)'" },
    { name: 'termsSource', def: "VARCHAR(50) NULL DEFAULT NULL COMMENT 'Source of terms acceptance: email_password, google, x, linkedin, discord, github'" },
    { name: 'permissions', def: "JSON NULL COMMENT 'Custom permissions array (overrides role defaults). NULL means use role defaults, empty array [] means no permissions.'" },
    { name: 'featureFlags', def: "JSON NULL COMMENT 'Feature flags object. NULL means all flags are false, missing keys default to false.'" },
    { name: 'deletedAt', def: "DATETIME NULL COMMENT 'Timestamp when account was soft-deleted'" },
    { name: 'deletedReason', def: "VARCHAR(255) NULL COMMENT 'Reason for account deletion (e.g., USER_SELF_DELETE, ADMIN_DELETE)'" },
    { name: 'onboardingStep', def: "INT NOT NULL DEFAULT 0 COMMENT 'Onboarding progress step (0 = not started, higher = completed steps)'" },
    { name: 'lastLoginAt', def: "DATETIME NULL COMMENT 'Last login timestamp'" },
  ];

  // Add missing columns
  for (const col of columns) {
    if (!(await columnExists('User', col.name))) {
      console.log(`[Migration] Adding column: ${col.name}`);
      try {
        await pool.query(`ALTER TABLE \`User\` ADD COLUMN ${col.name} ${col.def}`);
        console.log(`[Migration] ✓ Added column: ${col.name}`);
      } catch (err) {
        console.error(`[Migration] ✗ Failed to add column ${col.name}:`, err.message);
      }
    }
  }

  // Ensure password is nullable
  try {
    const [rows] = await pool.query(
      `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'password'`,
      [DB_NAME, 'User']
    );
    if (rows.length > 0 && rows[0].IS_NULLABLE === 'NO') {
      console.log('[Migration] Making password column nullable...');
      await pool.query(`ALTER TABLE \`User\` MODIFY COLUMN password VARCHAR(255) NULL DEFAULT NULL`);
      console.log('[Migration] ✓ Password column is now nullable');
    }
  } catch (err) {
    console.warn('[Migration] Could not check/modify password column:', err.message);
  }

  // Add indexes
  const indexes = [
    { name: 'idx_username_unique', column: 'username', unique: true },
    { name: 'idx_googleId', column: 'googleId', unique: false },
    { name: 'idx_githubId', column: 'githubId', unique: false },
    { name: 'idx_twitterId', column: 'twitterId', unique: false },
    { name: 'idx_linkedinId', column: 'linkedinId', unique: false },
    { name: 'idx_discordId', column: 'discordId', unique: false },
  ];

  for (const idx of indexes) {
    // Check if column exists first
    if (await columnExists('User', idx.column)) {
      if (!(await indexExists('User', idx.name))) {
        console.log(`[Migration] Adding index: ${idx.name}`);
        try {
          const indexType = idx.unique ? 'UNIQUE INDEX' : 'INDEX';
          await pool.query(`ALTER TABLE \`User\` ADD ${indexType} ${idx.name} (${idx.column})`);
          console.log(`[Migration] ✓ Added index: ${idx.name}`);
        } catch (err) {
          // Index might fail if there are duplicate values
          console.warn(`[Migration] Could not add index ${idx.name}:`, err.message);
        }
      }
    }
  }

  // Update existing data
  try {
    await pool.query(`UPDATE \`User\` SET role = 'STANDARD_USER' WHERE role IS NULL OR role = '' OR role = 'user'`);
    await pool.query(`UPDATE \`User\` SET accountStatus = status WHERE accountStatus IS NULL OR accountStatus = ''`);
  } catch (err) {
    console.warn('[Migration] Could not update existing data:', err.message);
  }

  console.log('[Migration] ✓ User table migration complete');
}

/**
 * Check if a foreign key constraint exists
 */
async function foreignKeyExists(tableName, constraintName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [DB_NAME, tableName, constraintName]
  );
  return rows[0].count > 0;
}

/**
 * Ensure token tables exist with correct userId type matching User.id
 */
async function ensureTokenTables() {
  console.log('[Migration] Ensuring token tables...');

  const userIdType = await getUserIdType();
  console.log(`[Migration] Using User.id type: ${userIdType}`);

  // PasswordResetToken
  if (!(await tableExists('PasswordResetToken'))) {
    console.log('[Migration] Creating PasswordResetToken table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS PasswordResetToken (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        userId ${userIdType} NOT NULL,
        token VARCHAR(255) NOT NULL COMMENT 'Hashed password reset token (SHA-256)',
        tokenPlain VARCHAR(255) NULL COMMENT 'Plain token (dev-only, for debugging)',
        expiresAt DATETIME NOT NULL COMMENT 'Token expiration datetime',
        usedAt DATETIME NULL COMMENT 'When token was used (NULL if not used)',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_passwordresettoken_userId (userId),
        INDEX idx_passwordresettoken_token (token),
        CONSTRAINT fk_passwordresettoken_user FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ PasswordResetToken table created');
  } else {
    // Check and fix userId column type if it doesn't match User.id
    const [colRows] = await pool.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'PasswordResetToken' AND COLUMN_NAME = 'userId'`,
      [DB_NAME]
    );
    
    if (colRows.length > 0) {
      const currentType = colRows[0].COLUMN_TYPE.toUpperCase();
      const expectedType = userIdType.toUpperCase();
      
      if (currentType !== expectedType) {
        console.log(`[Migration] Fixing PasswordResetToken.userId type: ${currentType} → ${expectedType}`);
        
        // Drop FK if it exists
        if (await foreignKeyExists('PasswordResetToken', 'fk_passwordresettoken_user')) {
          console.log('[Migration] Dropping existing FK constraint...');
          await pool.query(`ALTER TABLE PasswordResetToken DROP FOREIGN KEY fk_passwordresettoken_user`);
        }
        
        // Alter column type
        await pool.query(`ALTER TABLE PasswordResetToken MODIFY COLUMN userId ${userIdType} NOT NULL`);
        console.log('[Migration] ✓ Updated userId column type');
        
        // Re-add FK
        await pool.query(`
          ALTER TABLE PasswordResetToken 
          ADD CONSTRAINT fk_passwordresettoken_user 
          FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE
        `);
        console.log('[Migration] ✓ Re-added FK constraint');
      }
    }
  }

  // ActivationToken
  if (!(await tableExists('ActivationToken'))) {
    console.log('[Migration] Creating ActivationToken table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ActivationToken (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        userId ${userIdType} NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hashed activation token (SHA-256)',
        used TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether token has been used',
        expiresAt DATETIME NOT NULL COMMENT 'Token expiration datetime',
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Token creation timestamp',
        PRIMARY KEY (id),
        INDEX idx_activation_userId (userId),
        INDEX idx_activation_token (token),
        INDEX idx_activation_expiresAt (expiresAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ ActivationToken table created');
  } else {
    // Check and fix userId column type if it doesn't match User.id
    const [colRows] = await pool.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ActivationToken' AND COLUMN_NAME = 'userId'`,
      [DB_NAME]
    );
    
    if (colRows.length > 0) {
      const currentType = colRows[0].COLUMN_TYPE.toUpperCase();
      const expectedType = userIdType.toUpperCase();
      
      if (currentType !== expectedType) {
        console.log(`[Migration] Fixing ActivationToken.userId type: ${currentType} → ${expectedType}`);
        
        // Drop FK if it exists (check all possible FK names)
        const fkNames = ['fk_activationtoken_user', 'fk_activation_user'];
        for (const fkName of fkNames) {
          if (await foreignKeyExists('ActivationToken', fkName)) {
            console.log(`[Migration] Dropping existing FK constraint: ${fkName}`);
            await pool.query(`ALTER TABLE ActivationToken DROP FOREIGN KEY ${fkName}`);
            break;
          }
        }
        
        // Alter column type
        await pool.query(`ALTER TABLE ActivationToken MODIFY COLUMN userId ${userIdType} NOT NULL`);
        console.log('[Migration] ✓ Updated userId column type');
      }
    }
  }

  console.log('[Migration] ✓ Token tables migration complete');
}

/**
 * Ensure 2FA tables exist
 */
async function ensure2FATables() {
  console.log('[Migration] Ensuring 2FA tables...');

  const userIdType = await getUserIdType();

  // TwoFactorAuth
  if (!(await tableExists('TwoFactorAuth'))) {
    console.log('[Migration] Creating TwoFactorAuth table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS TwoFactorAuth (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        userId ${userIdType} NOT NULL UNIQUE,
        secret VARCHAR(255) NULL COMMENT 'TOTP secret (encrypted)',
        backupCodes TEXT NULL COMMENT 'JSON array of hashed backup codes',
        isEnabled TINYINT(1) NOT NULL DEFAULT 0,
        enabledAt DATETIME NULL,
        lastVerifiedAt DATETIME NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        CONSTRAINT fk_twofactorauth_user FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ TwoFactorAuth table created');
  }

  // UserTwoFactor
  if (!(await tableExists('UserTwoFactor'))) {
    console.log('[Migration] Creating UserTwoFactor table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS UserTwoFactor (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        userId ${userIdType} NOT NULL,
        secret VARCHAR(128) NOT NULL,
        isEnabled TINYINT(1) NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        confirmedAt DATETIME NULL,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY idx_2fa_user (userId),
        CONSTRAINT fk_2fa_user FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ UserTwoFactor table created');
  }

  // UserTwoFactorRecovery
  if (!(await tableExists('UserTwoFactorRecovery'))) {
    console.log('[Migration] Creating UserTwoFactorRecovery table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS UserTwoFactorRecovery (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        userId ${userIdType} NOT NULL,
        codeHash VARCHAR(128) NOT NULL,
        label VARCHAR(64) NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        usedAt DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_userId (userId),
        CONSTRAINT fk_recovery_user FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ UserTwoFactorRecovery table created');
  }

  console.log('[Migration] ✓ 2FA tables migration complete');
}

/**
 * Ensure session tables exist
 */
async function ensureSessionTables() {
  console.log('[Migration] Ensuring session tables...');

  const userIdType = await getUserIdType();

  // AuthSession
  if (!(await tableExists('AuthSession'))) {
    console.log('[Migration] Creating AuthSession table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS AuthSession (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        userId ${userIdType} NOT NULL,
        sessionToken VARCHAR(64) NOT NULL COMMENT 'Opaque session token',
        userAgent TEXT NULL COMMENT 'Raw user agent string',
        ipAddress VARCHAR(100) NULL COMMENT 'IPv4/IPv6',
        deviceFingerprint VARCHAR(255) NULL COMMENT 'Hashed device fingerprint',
        deviceLabel VARCHAR(255) NULL COMMENT 'Optional human-friendly device name',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        lastSeenAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME NOT NULL,
        revokedAt DATETIME NULL,
        isCurrent TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Mark current device session',
        PRIMARY KEY (id),
        UNIQUE KEY idx_authsession_token (sessionToken),
        KEY idx_authsession_userId (userId),
        KEY idx_authsession_expiresAt (expiresAt),
        CONSTRAINT fk_authsession_user
          FOREIGN KEY (userId) REFERENCES \`User\`(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ AuthSession table created');
  } else {
    // Add missing columns if table exists
    const sessionColumns = [
      { name: 'deviceFingerprint', def: "VARCHAR(255) NULL COMMENT 'Hashed device fingerprint'" },
      { name: 'expiresAt', def: "DATETIME NOT NULL DEFAULT (DATE_ADD(NOW(), INTERVAL 30 DAY))" },
      { name: 'revokedAt', def: "DATETIME NULL" },
      { name: 'deviceLabel', def: "VARCHAR(255) NULL COMMENT 'Optional human-friendly device name'" },
      { name: 'isCurrent', def: "TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Mark current device session'" },
    ];

    for (const col of sessionColumns) {
      if (!(await columnExists('AuthSession', col.name))) {
        console.log(`[Migration] Adding column to AuthSession: ${col.name}`);
        try {
          await pool.query(`ALTER TABLE AuthSession ADD COLUMN ${col.name} ${col.def}`);
          console.log(`[Migration] ✓ Added column: ${col.name}`);
        } catch (err) {
          console.error(`[Migration] ✗ Failed to add column ${col.name}:`, err.message);
        }
      }
    }
  }

  // UserDevices
  if (!(await tableExists('UserDevices'))) {
    console.log('[Migration] Creating UserDevices table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS UserDevices (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        userId ${userIdType} NOT NULL,
        deviceFingerprint VARCHAR(255) NOT NULL,
        deviceName VARCHAR(255) NULL,
        userAgent TEXT NULL,
        ipAddress VARCHAR(100) NULL,
        lastSeenAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY idx_user_device (userId, deviceFingerprint),
        CONSTRAINT fk_userdevices_user FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ UserDevices table created');
  }

  console.log('[Migration] ✓ Session tables migration complete');
}

/**
 * Ensure activity and wallet tables exist
 */
async function ensureActivityAndWalletTables() {
  console.log('[Migration] Ensuring activity and wallet tables...');

  const userIdType = await getUserIdType();

  // UserActivityLog
  if (!(await tableExists('UserActivityLog'))) {
    console.log('[Migration] Creating UserActivityLog table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS UserActivityLog (
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        userId ${userIdType} NOT NULL COMMENT 'The subject user (whose account this event is about)',
        actorId ${userIdType} NULL COMMENT 'Who performed the action (same as userId for self, or admin ID)',
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
        CONSTRAINT fk_useractivitylog_user FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE,
        CONSTRAINT fk_useractivitylog_actor FOREIGN KEY (actorId) REFERENCES \`User\`(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ UserActivityLog table created');
  } else {
    // Add actorId if missing
    if (!(await columnExists('UserActivityLog', 'actorId'))) {
      console.log('[Migration] Adding actorId column to UserActivityLog...');
      try {
        await pool.query(`
          ALTER TABLE UserActivityLog 
          ADD COLUMN actorId ${userIdType} NULL COMMENT 'Who performed the action (same as userId for self, or admin ID)' AFTER userId
        `);
        await pool.query(`
          ALTER TABLE UserActivityLog 
          ADD CONSTRAINT fk_useractivitylog_actor FOREIGN KEY (actorId) REFERENCES \`User\`(id) ON DELETE SET NULL
        `);
        await pool.query(`ALTER TABLE UserActivityLog ADD INDEX idx_actorId (actorId)`);
        await pool.query(`ALTER TABLE UserActivityLog ADD INDEX idx_userId_createdAt (userId, createdAt DESC)`);
        console.log('[Migration] ✓ Added actorId column');
      } catch (err) {
        console.error('[Migration] ✗ Failed to add actorId:', err.message);
      }
    }
  }

  // WalletTransaction
  if (!(await tableExists('WalletTransaction'))) {
    console.log('[Migration] Creating WalletTransaction table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS WalletTransaction (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        userId ${userIdType} NOT NULL,
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
          FOREIGN KEY (userId) REFERENCES \`User\`(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('[Migration] ✓ WalletTransaction table created');
  }

  console.log('[Migration] ✓ Activity and wallet tables migration complete');
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('\n========================================');
  console.log('OGC NewFinity - Unified Schema Migration');
  console.log('========================================\n');

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('[Migration] ✓ Database connection successful\n');

    // Run migrations
    await ensureUserTable();
    await ensureTokenTables();
    await ensure2FATables();
    await ensureSessionTables();
    await ensureActivityAndWalletTables();

    console.log('\n========================================');
    console.log('✓ Migration completed successfully!');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('✗ Migration failed!');
    console.error('========================================\n');
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();

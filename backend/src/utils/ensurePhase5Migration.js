/**
 * Dev-only automatic Phase 5 migration
 * On startup, checks if Phase 5 schema is applied and applies it if missing.
 * Runs only when NODE_ENV !== 'production'
 */

import pool from '../db.js';

/**
 * Ensures Phase 5 migration is applied to the database
 * Checks for required columns and creates them if missing
 */
export async function ensurePhase5Migration() {
  // Only run in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    const dbname = process.env.DB_NAME;
    const tablename = 'User';

    // 1) Check if User table exists, create if missing
    const [tables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, tablename]
    );

    if (tables[0].count === 0) {
      console.log('[Phase5Migration] User table does not exist, creating...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS User (
          id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'STANDARD_USER',
          fullName VARCHAR(255) NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
          termsAccepted TINYINT(1) NOT NULL DEFAULT 0,
          termsAcceptedAt DATETIME NULL DEFAULT NULL,
          termsVersion VARCHAR(20) NULL DEFAULT NULL,
          termsSource VARCHAR(50) NULL DEFAULT NULL,
          permissions JSON NULL,
          featureFlags JSON NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_role (role),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Phase5Migration] User table created');
    }

    // 2) Check and add required columns if missing
    const requiredColumns = [
      {
        name: 'status',
        definition: "VARCHAR(50) NOT NULL DEFAULT 'pending_verification' COMMENT 'Account status: pending_verification, active, disabled'"
      },
      {
        name: 'role',
        definition: "VARCHAR(50) NOT NULL DEFAULT 'STANDARD_USER' COMMENT 'User role: FOUNDER, CORE_TEAM, ADMIN, MODERATOR, CREATOR, STANDARD_USER, SUSPENDED, BANNED'"
      },
      {
        name: 'termsAccepted',
        definition: 'TINYINT(1) NOT NULL DEFAULT 0'
      },
      {
        name: 'termsAcceptedAt',
        definition: 'DATETIME NULL DEFAULT NULL'
      },
      {
        name: 'termsVersion',
        definition: "VARCHAR(20) NULL DEFAULT NULL COMMENT 'Version of terms accepted (e.g., v1.0)'"
      },
      {
        name: 'termsSource',
        definition: "VARCHAR(50) NULL DEFAULT NULL COMMENT 'Source of terms acceptance: email_password, google, x, linkedin, discord, github'"
      },
      {
        name: 'permissions',
        definition: "JSON NULL COMMENT 'Custom permissions array (overrides role defaults). NULL means use role defaults, empty array [] means no permissions.'"
      },
      {
        name: 'featureFlags',
        definition: "JSON NULL COMMENT 'Feature flags object. NULL means all flags are false, missing keys default to false.'"
      }
    ];

    for (const column of requiredColumns) {
      const [columns] = await pool.query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [dbname, tablename, column.name]
      );

      if (columns[0].count === 0) {
        console.log(`[Phase5Migration] Adding missing column: ${column.name}`);
        await pool.query(
          `ALTER TABLE ${tablename} ADD COLUMN ${column.name} ${column.definition}`
        );
      }
    }

    // 3) Update existing 'user' role values to 'STANDARD_USER' (Phase 5 migration)
    await pool.query(
      `UPDATE ${tablename} SET role = 'STANDARD_USER' WHERE role = 'user' OR role IS NULL OR role = ''`
    );

    // 4) Ensure all existing users have STANDARD_USER role if role is NULL/empty
    await pool.query(
      `UPDATE ${tablename} SET role = 'STANDARD_USER' WHERE role IS NULL OR role = ''`
    );

    // 5) Check and add indexes if missing
    const indexes = [
      { name: 'idx_role', column: 'role' },
      { name: 'idx_status', column: 'status' }
    ];

    for (const index of indexes) {
      const [indexes] = await pool.query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [dbname, tablename, index.name]
      );

      if (indexes[0].count === 0) {
        console.log(`[Phase5Migration] Adding missing index: ${index.name}`);
        await pool.query(
          `ALTER TABLE ${tablename} ADD INDEX ${index.name} (${index.column})`
        );
      }
    }

    // 6) Check if ActivationToken table exists, create if missing
    const [activationTables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, 'ActivationToken']
    );

    if (activationTables[0].count === 0) {
      console.log('[Phase5Migration] ActivationToken table does not exist, creating...');
      await pool.query(`
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Phase5Migration] ActivationToken table created');
    }

    // 7) Check if TwoFactorAuth table exists, create if missing
    const [twoFactorTables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, 'TwoFactorAuth']
    );

    if (twoFactorTables[0].count === 0) {
      console.log('[Phase5Migration] TwoFactorAuth table does not exist, creating...');
      await pool.query(`
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Phase5Migration] TwoFactorAuth table created');
    } else {
      console.log('[Phase5Migration] TwoFactorAuth table already exists');
    }

    // 8) Check if AuthSession table exists, create if missing (Phase 7.1)
    const [sessionTables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, 'AuthSession']
    );

    if (sessionTables[0].count === 0) {
      console.log('[Phase5Migration] AuthSession table does not exist, creating...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS AuthSession (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT,
          userId BIGINT UNSIGNED NOT NULL,
          sessionToken VARCHAR(255) NOT NULL COMMENT 'Hashed JWT access token (SHA-256)',
          userAgent VARCHAR(512) NULL COMMENT 'User agent string',
          ipAddress VARCHAR(64) NULL COMMENT 'IP address',
          deviceLabel VARCHAR(255) NULL COMMENT 'Optional human-friendly device name',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          lastSeenAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          isCurrent TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Mark current device session',
          PRIMARY KEY (id),
          INDEX idx_authsession_userId (userId),
          INDEX idx_authsession_token (sessionToken),
          INDEX idx_authsession_lastSeenAt (lastSeenAt),
          CONSTRAINT fk_authsession_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Phase5Migration] AuthSession table created');
    } else {
      console.log('[Phase5Migration] AuthSession table already exists');
    }

    console.log('[Phase5Migration] Phase 5 migration check complete');
  } catch (err) {
    console.error('[Phase5Migration] Failed to ensure Phase 5 migration:', err);
    // Don't throw - we don't want to block server startup if this fails
  }
}

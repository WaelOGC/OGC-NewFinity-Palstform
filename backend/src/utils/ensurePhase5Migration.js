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
      },
      {
        name: 'deletedAt',
        definition: "DATETIME NULL COMMENT 'Timestamp when account was soft-deleted'"
      },
      {
        name: 'deletedReason',
        definition: "VARCHAR(255) NULL COMMENT 'Reason for account deletion (e.g., USER_SELF_DELETE, ADMIN_DELETE)'"
      },
      {
        name: 'username',
        definition: "VARCHAR(50) NULL COMMENT 'Unique user handle'"
      },
      {
        name: 'country',
        definition: "VARCHAR(100) NULL COMMENT 'User country'"
      },
      {
        name: 'bio',
        definition: "TEXT NULL COMMENT 'User biography'"
      },
      {
        name: 'phone',
        definition: "VARCHAR(20) NULL COMMENT 'Phone number'"
      },
      {
        name: 'avatarUrl',
        definition: "VARCHAR(500) NULL COMMENT 'Avatar image URL'"
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
    
    // Add unique index for username if it exists and doesn't have one
    const [usernameIndex] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'username' AND NON_UNIQUE = 0`,
      [dbname, tablename]
    );
    
    if (usernameIndex[0].count === 0) {
      // Check if username column exists first
      const [usernameCol] = await pool.query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'username'`,
        [dbname, tablename]
      );
      
      if (usernameCol[0].count > 0) {
        try {
          console.log('[Phase5Migration] Adding unique index for username');
          await pool.query(
            `ALTER TABLE ${tablename} ADD UNIQUE INDEX idx_username_unique (username)`
          );
        } catch (err) {
          // Index might already exist or there might be duplicate usernames
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[Phase5Migration] Could not add unique index for username:', err.message);
          }
        }
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
    const [twoFactorAuthTables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, 'TwoFactorAuth']
    );

    if (twoFactorAuthTables[0].count === 0) {
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

    // 8) Check if AuthSession table exists, create if missing (Phase S2 - Enhanced)
    const [sessionTables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, 'AuthSession']
    );

    // PHASE S2: Detect User.id type dynamically to avoid FK compatibility issues
    let userIdType = 'BIGINT UNSIGNED'; // Default fallback
    try {
      const [userColumns] = await pool.query(
        `SHOW COLUMNS FROM \`User\` WHERE Field = 'id'`
      );
      if (userColumns && userColumns.length > 0) {
        userIdType = userColumns[0].Type;
        console.log(`[Phase5Migration] Detected User.id type: ${userIdType}`);
      }
    } catch (err) {
      console.warn(`[Phase5Migration] Could not detect User.id type, using default: ${userIdType}`, err.message);
    }

    if (sessionTables[0].count === 0) {
      console.log('[Phase5Migration] AuthSession table does not exist, creating...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS AuthSession (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          userId ${userIdType} NOT NULL,
          sessionToken VARCHAR(64) NOT NULL COMMENT 'Opaque session token',
          userAgent VARCHAR(255) NULL COMMENT 'Raw user agent string',
          ipAddress VARCHAR(45) NULL COMMENT 'IPv4/IPv6',
          deviceFingerprint VARCHAR(255) NULL COMMENT 'Hashed device fingerprint',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          lastSeenAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expiresAt DATETIME NOT NULL,
          revokedAt DATETIME NULL,
          isCurrent TINYINT(1) NOT NULL DEFAULT 1,
          PRIMARY KEY (id),
          UNIQUE KEY idx_authsession_token (sessionToken),
          KEY idx_authsession_userId (userId),
          KEY idx_authsession_expiresAt (expiresAt),
          CONSTRAINT fk_authsession_user
            FOREIGN KEY (userId) REFERENCES \`User\`(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      await pool.query(createTableSQL);
      console.log('[Phase5Migration] AuthSession table created');
      
      // Cleanup old expired sessions (keep last 30 days)
      try {
        await pool.query(
          'DELETE FROM AuthSession WHERE expiresAt < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
      } catch (cleanupErr) {
        // Ignore cleanup errors on initial creation
        console.warn('[Phase5Migration] Could not run initial cleanup:', cleanupErr.message);
      }
    } else {
      console.log('[Phase5Migration] AuthSession table already exists');
      
      // PHASE S2: Check and add missing columns if needed
      const sessionColumns = [
        {
          name: 'deviceFingerprint',
          definition: "VARCHAR(255) NULL COMMENT 'Hashed device fingerprint'"
        },
        {
          name: 'expiresAt',
          definition: "DATETIME NOT NULL DEFAULT (DATE_ADD(NOW(), INTERVAL 30 DAY))"
        },
        {
          name: 'revokedAt',
          definition: "DATETIME NULL"
        },
        {
          name: 'deviceLabel',
          definition: "VARCHAR(255) NULL COMMENT 'Optional human-friendly device name'"
        },
        {
          name: 'isCurrent',
          definition: "TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Mark current device session'"
        }
      ];
      
      for (const column of sessionColumns) {
        const [columns] = await pool.query(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
          [dbname, 'AuthSession', column.name]
        );
        
        if (columns[0].count === 0) {
          console.log(`[Phase5Migration] Adding missing column to AuthSession: ${column.name}`);
          try {
            await pool.query(
              `ALTER TABLE AuthSession ADD COLUMN ${column.name} ${column.definition}`
            );
            
            // If expiresAt was just added, set default for existing rows
            if (column.name === 'expiresAt') {
              await pool.query(
                `UPDATE AuthSession SET expiresAt = DATE_ADD(createdAt, INTERVAL 30 DAY) WHERE expiresAt IS NULL OR expiresAt = '0000-00-00 00:00:00'`
              );
            }
          } catch (alterErr) {
            console.error(`[Phase5Migration] Failed to add column ${column.name}:`, alterErr.message);
          }
        }
      }
      
      // Ensure lastSeenAt has default CURRENT_TIMESTAMP if it doesn't
      const [lastSeenAtCheck] = await pool.query(
        `SELECT COLUMN_DEFAULT, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'lastSeenAt'`,
        [dbname, 'AuthSession']
      );
      
      if (lastSeenAtCheck.length > 0) {
        const colDef = lastSeenAtCheck[0];
        if (colDef.IS_NULLABLE === 'NO' && !colDef.COLUMN_DEFAULT) {
          // Update to allow NULL or set default
          try {
            await pool.query(
              `ALTER TABLE AuthSession MODIFY COLUMN lastSeenAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
            );
          } catch (modifyErr) {
            console.warn('[Phase5Migration] Could not update lastSeenAt:', modifyErr.message);
          }
        }
      }
      
      // Update sessionToken column if it's still VARCHAR(255) - change to VARCHAR(64) for opaque tokens
      const [tokenColCheck] = await pool.query(
        `SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'sessionToken'`,
        [dbname, 'AuthSession']
      );
      
      if (tokenColCheck.length > 0 && tokenColCheck[0].CHARACTER_MAXIMUM_LENGTH !== 64) {
        console.log('[Phase5Migration] Updating sessionToken column to VARCHAR(64)');
        try {
          await pool.query(
            `ALTER TABLE AuthSession MODIFY COLUMN sessionToken VARCHAR(64) NOT NULL COMMENT 'Opaque session token'`
          );
        } catch (modifyErr) {
          console.warn('[Phase5Migration] Could not update sessionToken column:', modifyErr.message);
        }
      }
      
      // Cleanup expired sessions (keep last 30 days)
      try {
        await pool.query(
          'DELETE FROM AuthSession WHERE expiresAt < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
      } catch (cleanupErr) {
        console.warn('[Phase5Migration] Could not run cleanup:', cleanupErr.message);
      }
    }

    // --- Ensure UserTwoFactor table (for 2FA) ---
    try {
      // Check if UserTwoFactor already exists
      const [twoFactorTables] = await pool.query(
        'SHOW TABLES LIKE "UserTwoFactor"'
      );
      const hasTwoFactorTable = twoFactorTables.length > 0;

      if (!hasTwoFactorTable) {
        // Detect User.id column type (same pattern as AuthSession)
        const [userIdCols2] = await pool.query(
          'SHOW COLUMNS FROM `User` WHERE Field = "id"'
        );
        const userIdTypeFor2FA =
          userIdCols2 && userIdCols2[0] ? userIdCols2[0].Type : 'BIGINT UNSIGNED';

        const createTwoFactorTableSql = `
          CREATE TABLE IF NOT EXISTS UserTwoFactor (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            userId ${userIdTypeFor2FA} NOT NULL,
            secret VARCHAR(128) NOT NULL,
            isEnabled TINYINT(1) NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            confirmedAt DATETIME NULL,
            updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY idx_2fa_user (userId),
            CONSTRAINT fk_2fa_user
              FOREIGN KEY (userId) REFERENCES \`User\`(id)
              ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.query(createTwoFactorTableSql);
        console.log('[PhaseMigration] UserTwoFactor table created.');
      } else {
        console.log('[PhaseMigration] UserTwoFactor table already exists.');
      }
    } catch (err) {
      console.error('[PhaseMigration] Failed to ensure UserTwoFactor table:', err);
    }

    // --- Ensure UserTwoFactorRecovery table (Phase S5) ---
    try {
      const [recoveryTables] = await pool.query(
        'SHOW TABLES LIKE "UserTwoFactorRecovery"'
      );
      const hasRecoveryTable = recoveryTables.length > 0;

      if (!hasRecoveryTable) {
        // Detect User.id column type (same pattern as UserTwoFactor)
        const [userIdColsRecovery] = await pool.query(
          'SHOW COLUMNS FROM `User` WHERE Field = "id"'
        );
        const userIdTypeForRecovery =
          userIdColsRecovery && userIdColsRecovery[0] ? userIdColsRecovery[0].Type : 'BIGINT UNSIGNED';

        const createRecoveryTableSql = `
          CREATE TABLE IF NOT EXISTS UserTwoFactorRecovery (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            userId ${userIdTypeForRecovery} NOT NULL,
            codeHash VARCHAR(128) NOT NULL,
            label VARCHAR(64) NULL,
            used TINYINT(1) NOT NULL DEFAULT 0,
            usedAt DATETIME NULL,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_userId (userId),
            CONSTRAINT fk_recovery_user
              FOREIGN KEY (userId) REFERENCES \`User\`(id)
              ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await pool.query(createRecoveryTableSql);
        console.log('[PhaseMigration] UserTwoFactorRecovery table created.');
      } else {
        console.log('[PhaseMigration] UserTwoFactorRecovery table already exists.');
      }
    } catch (err) {
      console.error('[PhaseMigration] Failed to ensure UserTwoFactorRecovery table:', err);
    }

    // 9) Check if PasswordResetToken table exists, create if missing (Phase 8.1)
    const [resetTokenTables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, 'PasswordResetToken']
    );

    if (resetTokenTables[0].count === 0) {
      console.log('[Phase5Migration] PasswordResetToken table does not exist, creating...');
      await pool.query(`
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
          CONSTRAINT fk_passwordresettoken_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Phase5Migration] PasswordResetToken table created');
    } else {
      console.log('[Phase5Migration] PasswordResetToken table already exists');
    }

    // 10) Check if UserActivityLog table exists, create if missing (Phase 2)
    const [activityLogTables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, 'UserActivityLog']
    );

    if (activityLogTables[0].count === 0) {
      console.log('[Phase5Migration] UserActivityLog table does not exist, creating...');
      await pool.query(`
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
          CONSTRAINT fk_useractivitylog_user FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
          CONSTRAINT fk_useractivitylog_actor FOREIGN KEY (actorId) REFERENCES User(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Phase5Migration] UserActivityLog table created');
    } else {
      console.log('[Phase5Migration] UserActivityLog table already exists');
      
      // Check and add actorId column if missing (Phase 8.6)
      const [actorIdColumns] = await pool.query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [dbname, 'UserActivityLog', 'actorId']
      );

      if (actorIdColumns[0].count === 0) {
        console.log('[Phase5Migration] Adding actorId column to UserActivityLog table...');
        await pool.query(`
          ALTER TABLE UserActivityLog 
          ADD COLUMN actorId BIGINT UNSIGNED NULL COMMENT 'Who performed the action (same as userId for self, or admin ID)' AFTER userId
        `);
        
        // Add foreign key constraint
        await pool.query(`
          ALTER TABLE UserActivityLog 
          ADD CONSTRAINT fk_useractivitylog_actor FOREIGN KEY (actorId) REFERENCES User(id) ON DELETE SET NULL
        `);
        
        // Add index
        await pool.query(`
          ALTER TABLE UserActivityLog 
          ADD INDEX idx_actorId (actorId)
        `);
        
        // Add composite index if it doesn't exist
        const [compositeIndex] = await pool.query(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.STATISTICS
           WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
          [dbname, 'UserActivityLog', 'idx_userId_createdAt']
        );
        
        if (compositeIndex[0].count === 0) {
          await pool.query(`
            ALTER TABLE UserActivityLog 
            ADD INDEX idx_userId_createdAt (userId, createdAt DESC)
          `);
        }
        
        console.log('[Phase5Migration] actorId column added to UserActivityLog');
      }
    }

    // 11) Check if WalletTransaction table exists, create if missing (Phase W2.3)
    const [walletTxTables] = await pool.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbname, 'WalletTransaction']
    );

    if (walletTxTables[0].count === 0) {
      console.log('[Phase5Migration] WalletTransaction table does not exist, creating...');
      await pool.query(`
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
            FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Phase5Migration] WalletTransaction table created');

      // Seed mock transactions for non-production environments if table is empty
      if (process.env.NODE_ENV !== 'production') {
        try {
          // Check if there are any transactions already
          const [existingTx] = await pool.query('SELECT COUNT(*) as count FROM WalletTransaction');
          if (existingTx[0].count === 0) {
            // Try to find admin/demo user (admin@ogc.local or any user with email)
            const [users] = await pool.query('SELECT id FROM User LIMIT 1');
            if (users.length > 0) {
              const demoUserId = users[0].id;
              const now = new Date();
              const mockTransactions = [
                {
                  userId: demoUserId,
                  type: 'DEPOSIT',
                  direction: 'IN',
                  amount: 500.00,
                  tokenSymbol: 'OGC',
                  status: 'COMPLETED',
                  txHash: `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
                  chain: 'Polygon',
                  notes: 'Initial deposit',
                  occurredAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
                },
                {
                  userId: demoUserId,
                  type: 'REWARD',
                  direction: 'IN',
                  amount: 34.56,
                  tokenSymbol: 'OGC',
                  status: 'COMPLETED',
                  txHash: `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
                  chain: 'Polygon',
                  notes: 'Staking reward',
                  occurredAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
                },
                {
                  userId: demoUserId,
                  type: 'TRANSFER',
                  direction: 'OUT',
                  amount: 100.00,
                  tokenSymbol: 'OGC',
                  status: 'COMPLETED',
                  txHash: `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
                  chain: 'Polygon',
                  notes: 'Transfer to external wallet',
                  occurredAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
                },
                {
                  userId: demoUserId,
                  type: 'REWARD',
                  direction: 'IN',
                  amount: 50.00,
                  tokenSymbol: 'OGC',
                  status: 'PENDING',
                  txHash: `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
                  chain: 'Polygon',
                  notes: 'Pending reward',
                  occurredAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
                },
                {
                  userId: demoUserId,
                  type: 'DEPOSIT',
                  direction: 'IN',
                  amount: 200.00,
                  tokenSymbol: 'OGC',
                  status: 'COMPLETED',
                  txHash: `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
                  chain: 'Polygon',
                  notes: 'Additional deposit',
                  occurredAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
                },
                {
                  userId: demoUserId,
                  type: 'TRANSFER',
                  direction: 'OUT',
                  amount: 50.00,
                  tokenSymbol: 'OGC',
                  status: 'COMPLETED',
                  txHash: `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
                  chain: 'Polygon',
                  notes: 'Payment sent',
                  occurredAt: new Date(now - 12 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
                }
              ];

              for (const tx of mockTransactions) {
                await pool.query(
                  `INSERT INTO WalletTransaction (userId, type, direction, amount, tokenSymbol, status, txHash, chain, notes, occurredAt)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [tx.userId, tx.type, tx.direction, tx.amount, tx.tokenSymbol, tx.status, tx.txHash, tx.chain, tx.notes, tx.occurredAt]
                );
              }
              console.log('[Phase5Migration] Seeded mock transactions for demo user');
            }
          }
        } catch (seedErr) {
          // Don't fail migration if seeding fails
          console.warn('[Phase5Migration] Could not seed mock transactions:', seedErr.message);
        }
      }
    } else {
      console.log('[Phase5Migration] WalletTransaction table already exists');
    }

    console.log('[Phase5Migration] Phase 5 migration check complete');
  } catch (err) {
    console.error('[Phase5Migration] Failed to ensure Phase 5 migration:', err);
    // Don't throw - we don't want to block server startup if this fails
  }
}

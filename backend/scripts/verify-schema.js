/**
 * Schema Verification Script
 * 
 * Verifies that all expected schema elements exist after migration.
 * 
 * Usage:
 *   node scripts/verify-schema.js
 */

import pool from '../src/db.js';
import env from '../src/config/env.js';

const DB_NAME = env.DB_NAME;

/**
 * Check if column exists
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
 * Check if table exists
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
 * Verify User table columns
 */
async function verifyUserTable() {
  console.log('\n[Verify] Checking User table...');
  
  const requiredColumns = [
    'id', 'email', 'password', 'fullName', 'role', 'status',
    'accountStatus', 'emailVerified',
    'googleId', 'githubId', 'twitterId', 'linkedinId', 'discordId',
    'authProvider', 'avatarUrl',
    'username', 'country', 'bio', 'phone',
    'termsAccepted', 'termsAcceptedAt', 'termsVersion', 'termsSource',
    'permissions', 'featureFlags',
    'deletedAt', 'deletedReason',
    'onboardingStep', 'lastLoginAt',
    'createdAt', 'updatedAt'
  ];

  const missing = [];
  for (const col of requiredColumns) {
    if (!(await columnExists('User', col))) {
      missing.push(col);
    }
  }

  if (missing.length === 0) {
    console.log('[Verify] ✓ User table has all required columns');
  } else {
    console.log(`[Verify] ✗ User table missing columns: ${missing.join(', ')}`);
  }

  return missing.length === 0;
}

/**
 * Verify all required tables exist
 */
async function verifyTables() {
  console.log('\n[Verify] Checking required tables...');
  
  const requiredTables = [
    'User',
    'PasswordResetToken',
    'ActivationToken',
    'TwoFactorAuth',
    'UserTwoFactor',
    'UserTwoFactorRecovery',
    'AuthSession',
    'UserDevices',
    'UserActivityLog',
    'WalletTransaction'
  ];

  const missing = [];
  for (const table of requiredTables) {
    if (!(await tableExists(table))) {
      missing.push(table);
    }
  }

  if (missing.length === 0) {
    console.log('[Verify] ✓ All required tables exist');
  } else {
    console.log(`[Verify] ✗ Missing tables: ${missing.join(', ')}`);
  }

  return missing.length === 0;
}

/**
 * Main verification function
 */
async function verifySchema() {
  console.log('\n========================================');
  console.log('Schema Verification');
  console.log('========================================\n');

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('[Verify] ✓ Database connection successful');

    const userOk = await verifyUserTable();
    const tablesOk = await verifyTables();

    console.log('\n========================================');
    if (userOk && tablesOk) {
      console.log('✓ Schema verification PASSED');
      console.log('All expected schema elements exist.');
    } else {
      console.log('✗ Schema verification FAILED');
      console.log('Run migration: npm run db:migrate');
    }
    console.log('========================================\n');
    
    process.exit(userOk && tablesOk ? 0 : 1);
  } catch (error) {
    console.error('\n========================================');
    console.error('✗ Verification failed!');
    console.error('========================================\n');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
verifySchema();

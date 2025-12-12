#!/usr/bin/env node
/**
 * User Schema Checker
 * 
 * Verifies that the User and ActivationToken tables have all required columns.
 * Exits with code 0 if schema is aligned, 1 if columns are missing.
 * 
 * Usage:
 *   node scripts/check-user-schema.js
 *   npm run db:check:user-schema
 */

import pool from '../src/db.js';

const REQUIRED_USER_COLUMNS = [
  'id',
  'email',
  'password',
  'role',
  'fullName',
  'status',
  'termsAccepted',
  'termsAcceptedAt',
  'termsVersion',
  'termsSource',
  'createdAt',
  'updatedAt',
];

const REQUIRED_ACTIVATION_COLUMNS = [
  'id',
  'userId',
  'token',
  'used',
  'expiresAt',
  'createdAt',
];

/**
 * Get missing columns for a table
 * @param {string} tableName - Name of the table to check
 * @param {string[]} requiredColumns - Array of required column names
 * @returns {Promise<string[]>} Array of missing column names
 */
async function getMissingColumns(tableName, requiredColumns) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      ORDER BY COLUMN_NAME`,
    [tableName]
  );

  const existing = new Set(rows.map((r) => r.COLUMN_NAME));
  return requiredColumns.filter((col) => !existing.has(col));
}

/**
 * Check if a table exists
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} True if table exists
 */
async function tableExists(tableName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as count
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?`,
    [tableName]
  );
  return rows[0].count > 0;
}

async function main() {
  try {
    console.log('=== OGC NewFinity — DB Schema Check ===\n');

    // Check if tables exist
    const userTableExists = await tableExists('User');
    const activationTableExists = await tableExists('ActivationToken');

    if (!userTableExists) {
      console.error('❌ User table does not exist.');
      console.warn('\n⚠️  Run the unified migration: npm run db:migrate:unified');
      process.exit(1);
    }

    if (!activationTableExists) {
      console.error('❌ ActivationToken table does not exist.');
      console.warn('\n⚠️  Run the unified migration: npm run db:migrate:unified');
      process.exit(1);
    }

    // Check columns
    const missingUserCols = await getMissingColumns('User', REQUIRED_USER_COLUMNS);
    const missingActivationCols = await getMissingColumns('ActivationToken', REQUIRED_ACTIVATION_COLUMNS);

    let hasIssues = false;

    if (missingUserCols.length === 0) {
      console.log('✅ User table has all required columns');
    } else {
      hasIssues = true;
      console.warn(`❌ User table is missing ${missingUserCols.length} column(s):`);
      missingUserCols.forEach((col) => console.warn(`   - ${col}`));
    }

    if (missingActivationCols.length === 0) {
      console.log('✅ ActivationToken table has all required columns');
    } else {
      hasIssues = true;
      console.warn(`❌ ActivationToken table is missing ${missingActivationCols.length} column(s):`);
      missingActivationCols.forEach((col) => console.warn(`   - ${col}`));
    }

    if (hasIssues) {
      console.warn('\n⚠️  Detected schema mismatches. You should run the unified migration:');
      console.warn('   npm run db:migrate:unified');
      process.exit(1);
    } else {
      console.log('\n🎉 Schema looks good. No migration required.');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Schema check failed:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    // Close the pool to allow process to exit cleanly
    await pool.end();
  }
}

main();

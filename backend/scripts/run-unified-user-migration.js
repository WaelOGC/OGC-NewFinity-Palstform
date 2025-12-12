#!/usr/bin/env node
/**
 * Unified User Schema Migration Runner
 * 
 * Executes the unified migration SQL file (fix-user-table-migration.sql)
 * to ensure the User and ActivationToken tables have all required columns.
 * 
 * Usage:
 *   node scripts/run-unified-user-migration.js
 *   npm run db:migrate:unified
 */

import { runSqlFile } from '../src/utils/runSqlFile.js';

import pool from '../src/db.js';

async function main() {
  try {
    console.log('=== OGC NewFinity — Unified User Schema Migration ===\n');

    // Use the actual relative path to the unified migration
    const SQL_PATH = 'sql/fix-user-table-migration.sql';

    await runSqlFile(SQL_PATH);

    console.log('\n✅ Unified user schema migration completed successfully.');
    console.log('💡 Run "npm run db:check:user-schema" to verify the schema.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Unified user schema migration failed:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    // Close the pool to allow process to exit cleanly
    await pool.end();
  }
}

main();

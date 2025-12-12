/**
 * SQL File Runner Utility
 * Executes a .sql file against the configured MySQL database.
 * 
 * Reads the file from disk, splits into statements on ';',
 * and executes them sequentially.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run a .sql file against the configured MySQL database.
 * - Reads the file from disk.
 * - Splits into statements on ';' (basic splitting, good enough for our migration).
 * - Executes statements sequentially.
 *
 * @param {string} relativeSqlPath - Path relative to backend root, e.g. 'sql/fix-user-table-migration.sql'
 * @throws {Error} If file cannot be read or SQL execution fails
 */
export async function runSqlFile(relativeSqlPath) {
  // Resolve path relative to backend root (one level up from src/utils)
  const backendRoot = path.join(__dirname, '..', '..');
  const sqlPath = path.join(backendRoot, relativeSqlPath);

  if (!fs.existsSync(sqlPath)) {
    throw new Error(`SQL file not found: ${sqlPath}`);
  }

  const sqlRaw = fs.readFileSync(sqlPath, 'utf8');

  // Basic splitting by semicolon – skip empty/whitespace statements.
  // Note: This is a simple approach. For complex SQL with semicolons in strings,
  // you'd need a proper SQL parser, but for our migration files this works fine.
  const statements = sqlRaw
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.match(/^--/)); // Skip pure comment lines

  console.log(`[runSqlFile] Executing ${statements.length} statements from ${relativeSqlPath}`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip pure comments if any slipped through
    if (statement.startsWith('--') || statement.startsWith('/*')) {
      continue;
    }

    try {
      await pool.query(statement);
      console.log(`[runSqlFile] ✓ Statement ${i + 1}/${statements.length} executed`);
    } catch (err) {
      console.error(`[runSqlFile] ✗ Failed on statement ${i + 1}/${statements.length}:`);
      console.error(`[runSqlFile] Statement preview: ${statement.substring(0, 100)}...`);
      console.error(`[runSqlFile] Error: ${err.message}`);
      throw err;
    }
  }

  console.log(`[runSqlFile] ✅ Completed successfully for ${relativeSqlPath}`);
}

/**
 * Print User.id Column Type
 * 
 * Connects to database and prints the exact type definition of User.id column.
 * This helps ensure foreign key columns match User.id exactly.
 * 
 * Usage:
 *   npm run db:user-id-type
 *   node scripts/print-user-id-type.js
 */

import pool from '../src/db.js';

async function printUserIdType() {
  try {
    console.log('\n========================================');
    console.log('Detecting User.id column type...');
    console.log('========================================\n');

    // Get full column information
    const [rows] = await pool.query(
      `SHOW FULL COLUMNS FROM \`User\` WHERE Field = 'id'`
    );

    if (rows.length === 0) {
      console.error('✗ User table or id column not found!');
      process.exit(1);
    }

    const column = rows[0];
    
    console.log('User.id Column Details:');
    console.log('─────────────────────────────────────');
    console.log(`Field:       ${column.Field}`);
    console.log(`Type:        ${column.Type}`);
    console.log(`Null:        ${column.Null}`);
    console.log(`Key:         ${column.Key}`);
    console.log(`Default:     ${column.Default || 'NULL'}`);
    console.log(`Extra:       ${column.Extra || '(none)'}`);
    if (column.Collation) {
      console.log(`Collation:   ${column.Collation}`);
    }
    if (column.Privileges) {
      console.log(`Privileges:  ${column.Privileges}`);
    }
    if (column.Comment) {
      console.log(`Comment:     ${column.Comment}`);
    }
    console.log('─────────────────────────────────────\n');

    // Extract the type for use in migrations
    const typeDefinition = column.Type;
    const isUnsigned = typeDefinition.includes('UNSIGNED');
    const isNumeric = /INT|BIGINT|SMALLINT|TINYINT|MEDIUMINT/i.test(typeDefinition);
    
    console.log('Type Analysis:');
    console.log(`  Full Type:     ${typeDefinition}`);
    console.log(`  Is Numeric:    ${isNumeric ? 'YES' : 'NO'}`);
    console.log(`  Is Unsigned:   ${isUnsigned ? 'YES' : 'NO'}`);
    console.log(`  Suggested FK:  ${typeDefinition}\n`);

    console.log('✅ Successfully detected User.id type\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error detecting User.id type:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

printUserIdType();

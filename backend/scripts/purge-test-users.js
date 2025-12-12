/**
 * Purge Test Users Script
 * 
 * This script safely deletes test user accounts created during development
 * while preserving the admin account and any users with admin roles.
 * 
 * Safety Rules:
 * - Do NOT delete admin@ogc.local
 * - Do NOT delete any user with role containing 'ADMIN'
 * - Delete only accounts matching test patterns OR explicitly provided emails
 * 
 * Usage:
 *   npm run db:purge-test-users                    # Pattern-based deletion
 *   npm run db:purge-users -- --emails="a@b.com,c@d.com"  # Explicit email deletion
 *   node scripts/purge-test-users.js --emails="a@b.com"
 */

import pool from '../src/db.js';
import env from '../src/config/env.js';

const DB_NAME = env.DB_NAME;

/**
 * Parse command line arguments for --emails flag
 */
function parseEmailsArg() {
  const emailsArg = process.argv.find(arg => arg.startsWith('--emails='));
  if (!emailsArg) {
    return null;
  }
  
  const emailsString = emailsArg.split('=')[1];
  if (!emailsString) {
    return null;
  }
  
  // Split by comma, trim, lowercase, and filter empty strings
  const emails = emailsString
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
  
  return emails.length > 0 ? emails : null;
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
 * Find users by explicit email list
 */
async function findUsersByEmails(emails) {
  console.log('\n[Purge] Finding users by explicit email list...\n');
  console.log(`[Purge] Looking for ${emails.length} email(s): ${emails.join(', ')}\n`);

  if (emails.length === 0) {
    return [];
  }

  const placeholders = emails.map(() => '?').join(',');
  const query = `
    SELECT id, email, username, role, fullName, createdAt
    FROM \`User\`
    WHERE email IN (${placeholders})
    ORDER BY createdAt DESC
  `;

  const [users] = await pool.query(query, emails);
  return users;
}

/**
 * Find test users matching the criteria (pattern-based)
 */
async function findTestUsers() {
  console.log('\n[Purge] Identifying test users by patterns...\n');

  // Build the WHERE clause for test user identification
  const conditions = [
    // Emails ending with test domains
    "email LIKE '%@example.com'",
    "email LIKE '%@test.com'",
    "email LIKE '%@mailinator.com'",
    // Emails starting with test prefixes
    "email LIKE 'test%'",
    "email LIKE 'demo%'",
    "email LIKE 'fake%'",
    "email LIKE 'dev%'",
  ];

  // Check if username column exists
  const hasUsername = await columnExists('User', 'username');
  if (hasUsername) {
    // Usernames starting with test prefixes (only if username is not NULL)
    conditions.push("(username IS NOT NULL AND username LIKE 'test%')");
    conditions.push("(username IS NOT NULL AND username LIKE 'demo%')");
    conditions.push("(username IS NOT NULL AND username LIKE 'fake%')");
    conditions.push("(username IS NOT NULL AND username LIKE 'dev%')");
  }

  const whereClause = conditions.join(' OR ');

  // Exclude admin users
  const query = `
    SELECT id, email, username, role, fullName, createdAt
    FROM \`User\`
    WHERE (${whereClause})
      AND email != 'admin@ogc.local'
      AND (role IS NULL OR role NOT LIKE '%ADMIN%')
    ORDER BY createdAt DESC
  `;

  const [users] = await pool.query(query);
  return users;
}

/**
 * Filter and validate users for deletion (remove admin protection)
 */
function filterUsersForDeletion(users, requestedEmails = null) {
  const filtered = [];
  const skipped = [];
  const notFound = requestedEmails ? [...requestedEmails] : [];

  for (const user of users) {
    const emailLower = user.email.toLowerCase();
    
    // Hard-block admin@ogc.local
    if (emailLower === 'admin@ogc.local') {
      skipped.push({ user, reason: 'admin@ogc.local (protected)' });
      continue;
    }

    // Hard-block any user with ADMIN role
    if (user.role && user.role.toUpperCase().includes('ADMIN')) {
      skipped.push({ user, reason: `admin role (${user.role})` });
      continue;
    }

    // If explicit email mode, mark as found
    if (requestedEmails) {
      const index = notFound.indexOf(emailLower);
      if (index !== -1) {
        notFound.splice(index, 1);
      }
    }

    filtered.push(user);
  }

  return { filtered, skipped, notFound };
}

/**
 * Delete related records from a table
 */
async function deleteFromTable(tableName, userIdColumn, userIds) {
  if (userIds.length === 0) {
    return 0;
  }

  if (!(await tableExists(tableName))) {
    console.log(`[Purge]   ⚠ Table ${tableName} does not exist, skipping...`);
    return 0;
  }

  // Check if the userId column exists
  if (!(await columnExists(tableName, userIdColumn))) {
    console.log(`[Purge]   ⚠ Column ${tableName}.${userIdColumn} does not exist, skipping...`);
    return 0;
  }

  try {
    const placeholders = userIds.map(() => '?').join(',');
    const [result] = await pool.query(
      `DELETE FROM ${tableName} WHERE ${userIdColumn} IN (${placeholders})`,
      userIds
    );
    return result.affectedRows || 0;
  } catch (error) {
    console.error(`[Purge]   ✗ Error deleting from ${tableName}:`, error.message);
    return 0;
  }
}

/**
 * Delete related records from UserActivityLog (has both userId and actorId)
 */
async function deleteFromUserActivityLog(userIds) {
  if (userIds.length === 0) {
    return 0;
  }

  if (!(await tableExists('UserActivityLog'))) {
    console.log(`[Purge]   ⚠ Table UserActivityLog does not exist, skipping...`);
    return 0;
  }

  try {
    const placeholders = userIds.map(() => '?').join(',');
    const [result] = await pool.query(
      `DELETE FROM UserActivityLog WHERE userId IN (${placeholders}) OR actorId IN (${placeholders})`,
      [...userIds, ...userIds]
    );
    return result.affectedRows || 0;
  } catch (error) {
    console.error(`[Purge]   ✗ Error deleting from UserActivityLog:`, error.message);
    return 0;
  }
}

/**
 * Main purge function
 */
async function purgeTestUsers() {
  console.log('\n========================================');
  console.log('OGC NewFinity - Purge Test Users');
  console.log('========================================\n');

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('[Purge] ✓ Database connection successful\n');

    // Parse command line arguments
    const explicitEmails = parseEmailsArg();
    const isExplicitMode = explicitEmails !== null;

    // Find users based on mode
    let foundUsers;
    if (isExplicitMode) {
      foundUsers = await findUsersByEmails(explicitEmails);
    } else {
      foundUsers = await findTestUsers();
    }

    // Filter and validate users for deletion
    const { filtered: usersToDelete, skipped, notFound } = filterUsersForDeletion(
      foundUsers,
      explicitEmails
    );

    // Report skipped users
    if (skipped.length > 0) {
      console.log(`[Purge] ⚠ Skipped ${skipped.length} protected user(s):\n`);
      skipped.forEach(({ user, reason }) => {
        console.log(`  SKIPPED: ${user.email} (ID: ${user.id}) - ${reason}`);
      });
      console.log('');
    }

    // Report not found emails (explicit mode only)
    if (isExplicitMode && notFound.length > 0) {
      console.log(`[Purge] ⚠ ${notFound.length} email(s) not found in database:\n`);
      notFound.forEach(email => {
        console.log(`  NOT FOUND: ${email}`);
      });
      console.log('');
    }

    // Check if there are any users to delete
    if (usersToDelete.length === 0) {
      console.log('[Purge] ✓ No users to delete.\n');
      
      // Verification: Check remaining users and admin
      const [allUsers] = await pool.query('SELECT COUNT(*) as count FROM `User`');
      const [adminUser] = await pool.query(
        "SELECT id, email, role FROM `User` WHERE email = 'admin@ogc.local'"
      );

      console.log('========================================');
      console.log('Verification Summary');
      console.log('========================================');
      console.log(`Total users remaining: ${allUsers[0].count}`);
      if (adminUser.length > 0) {
        console.log(`✓ Admin account exists: ${adminUser[0].email} (role: ${adminUser[0].role || 'N/A'})`);
      } else {
        console.log('⚠ Admin account not found!');
      }
      console.log('========================================\n');

      process.exit(0);
    }

    // Display users to be deleted
    console.log(`[Purge] Found ${usersToDelete.length} user(s) to delete:\n`);
    usersToDelete.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}, Email: ${user.email}, Username: ${user.username || 'N/A'}, Role: ${user.role || 'N/A'}`);
    });
    console.log('');

    // Extract user IDs
    const userIds = usersToDelete.map(u => u.id);

    // Delete related records in safe order
    console.log('[Purge] Deleting related records...\n');

    const deletionCounts = {};

    // 1. ActivationToken
    console.log('[Purge] Deleting from ActivationToken...');
    deletionCounts.ActivationToken = await deleteFromTable('ActivationToken', 'userId', userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.ActivationToken} record(s)\n`);

    // 2. PasswordResetToken
    console.log('[Purge] Deleting from PasswordResetToken...');
    deletionCounts.PasswordResetToken = await deleteFromTable('PasswordResetToken', 'userId', userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.PasswordResetToken} record(s)\n`);

    // 3. AuthSession
    console.log('[Purge] Deleting from AuthSession...');
    deletionCounts.AuthSession = await deleteFromTable('AuthSession', 'userId', userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.AuthSession} record(s)\n`);

    // 4. UserDevices
    console.log('[Purge] Deleting from UserDevices...');
    deletionCounts.UserDevices = await deleteFromTable('UserDevices', 'userId', userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.UserDevices} record(s)\n`);

    // 5. UserActivityLog (has both userId and actorId)
    console.log('[Purge] Deleting from UserActivityLog...');
    deletionCounts.UserActivityLog = await deleteFromUserActivityLog(userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.UserActivityLog} record(s)\n`);

    // 6. TwoFactorAuth (if exists)
    console.log('[Purge] Deleting from TwoFactorAuth...');
    deletionCounts.TwoFactorAuth = await deleteFromTable('TwoFactorAuth', 'userId', userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.TwoFactorAuth} record(s)\n`);

    // 7. UserTwoFactor
    console.log('[Purge] Deleting from UserTwoFactor...');
    deletionCounts.UserTwoFactor = await deleteFromTable('UserTwoFactor', 'userId', userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.UserTwoFactor} record(s)\n`);

    // 8. UserTwoFactorRecovery
    console.log('[Purge] Deleting from UserTwoFactorRecovery...');
    deletionCounts.UserTwoFactorRecovery = await deleteFromTable('UserTwoFactorRecovery', 'userId', userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.UserTwoFactorRecovery} record(s)\n`);

    // 9. WalletTransaction
    console.log('[Purge] Deleting from WalletTransaction...');
    deletionCounts.WalletTransaction = await deleteFromTable('WalletTransaction', 'userId', userIds);
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.WalletTransaction} record(s)\n`);

    // 10. Finally, delete the users
    console.log('[Purge] Deleting users from User table...');
    const placeholders = userIds.map(() => '?').join(',');
    const [userDeleteResult] = await pool.query(
      `DELETE FROM \`User\` WHERE id IN (${placeholders})`,
      userIds
    );
    deletionCounts.User = userDeleteResult.affectedRows || 0;
    console.log(`[Purge]   ✓ Deleted ${deletionCounts.User} user(s)\n`);

    // Print final summary
    console.log('========================================');
    console.log('Deletion Summary');
    console.log('========================================');
    console.log(`Users deleted: ${deletionCounts.User}`);
    console.log('\nRelated records deleted:');
    Object.entries(deletionCounts).forEach(([table, count]) => {
      if (table !== 'User') {
        console.log(`  ${table}: ${count}`);
      }
    });
    console.log('========================================\n');

    // Verification: Check remaining users and admin
    const [allUsers] = await pool.query('SELECT COUNT(*) as count FROM `User`');
    const [adminUser] = await pool.query(
      "SELECT id, email, role FROM `User` WHERE email = 'admin@ogc.local'"
    );

    console.log('========================================');
    console.log('Verification Summary');
    console.log('========================================');
    console.log(`Total users remaining: ${allUsers[0].count}`);
    if (adminUser.length > 0) {
      console.log(`✓ Admin account exists: ${adminUser[0].email} (role: ${adminUser[0].role || 'N/A'})`);
    } else {
      console.log('⚠ Admin account not found!');
    }
    console.log('========================================\n');

    console.log('[Purge] ✓ Purge completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('✗ Purge failed!');
    console.error('========================================\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the purge
purgeTestUsers();

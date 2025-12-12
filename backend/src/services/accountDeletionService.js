/**
 * Account Deletion Service (PHASE S4)
 * 
 * Implements secure account deletion with:
 * - Password verification
 * - Optional 2FA verification (if enabled)
 * - Hard deletion of core user data
 * - Anonymization of security logs (instead of deletion)
 */

import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { getTwoFactorStatusForUser, getSecretForUser } from './twoFactorService.js';
import { verifyTOTP } from '../utils/totp.js';

/**
 * Load user with password hash for verification.
 * Reuse the same user table used by auth.
 */
async function getUserWithPasswordById(userId) {
  const [rows] = await pool.query(
    'SELECT id, email, password FROM `User` WHERE id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

/**
 * Verify the user's password using bcrypt.
 */
async function verifyUserPassword(userId, plainPassword) {
  const user = await getUserWithPasswordById(userId);
  if (!user || !user.password) {
    return { ok: false, reason: 'USER_NOT_FOUND' };
  }

  const match = await bcrypt.compare(plainPassword, user.password);
  if (!match) {
    return { ok: false, reason: 'INVALID_PASSWORD' };
  }

  return { ok: true, user };
}

/**
 * Verify 2FA TOTP code if 2FA is enabled.
 * If 2FA is disabled, return ok: true without requiring a code.
 */
async function verifyUserTwoFactor(userId, providedToken) {
  const status = await getTwoFactorStatusForUser(userId);

  if (!status.enabled) {
    return { ok: true, required: false };
  }

  if (!providedToken) {
    return { ok: false, required: true, reason: 'TOTP_REQUIRED' };
  }

  const secret = await getSecretForUser(userId);
  if (!secret) {
    // 2FA says enabled but no secret – treat as error and block deletion
    return { ok: false, required: true, reason: 'TOTP_MISCONFIGURED' };
  }

  const isValid = verifyTOTP(providedToken, secret);
  if (!isValid) {
    return { ok: false, required: true, reason: 'TOTP_INVALID' };
  }

  return { ok: true, required: true };
}

/**
 * Anonymize security logs rather than deleting them.
 * Updates UserActivityLog table to remove user references.
 */
async function anonymizeSecurityLogsForUser(userId) {
  try {
    // Anonymize UserActivityLog entries
    await pool.query(
      `
      UPDATE UserActivityLog
      SET userId = NULL,
          actorId = NULL
      WHERE userId = ? OR actorId = ?
      `,
      [userId, userId]
    );
  } catch (err) {
    // If table does not exist or other non-critical error, don't block deletion
    if (err && err.code !== 'ER_NO_SUCH_TABLE') {
      console.error('[AccountDeletion] Failed to anonymize UserActivityLog logs:', err);
    }
  }

  // Add other log/analytics tables here in future phases (audit logs, alerts, etc.)
}

/**
 * Hard-delete all user-owned records in dependent tables.
 * IMPORTANT: order matters depending on foreign keys.
 */
async function hardDeleteUserCoreData(userId) {
  // 1) Delete sessions
  try {
    await pool.query('DELETE FROM AuthSession WHERE userId = ?', [userId]);
  } catch (err) {
    if (err && err.code !== 'ER_NO_SUCH_TABLE') {
      console.error('[AccountDeletion] Failed to delete AuthSession rows:', err);
    }
  }

  // 2) Delete 2FA config
  try {
    await pool.query('DELETE FROM UserTwoFactor WHERE userId = ?', [userId]);
  } catch (err) {
    if (err && err.code !== 'ER_NO_SUCH_TABLE') {
      console.error('[AccountDeletion] Failed to delete UserTwoFactor rows:', err);
    }
  }

  // 3) Delete other user-owned data (future: wallet, Amy, challenge, etc.)
  // Add additional deletion blocks here as those tables are finalized.

  // 4) Finally, delete the user record itself
  await pool.query('DELETE FROM `User` WHERE id = ?', [userId]);
}

/**
 * Entry point: perform full account deletion with anonymized logs.
 */
async function deleteUserAccount(userId) {
  // Anonymize logs first (they still reference the user)
  await anonymizeSecurityLogsForUser(userId);

  // Hard-delete core data
  await hardDeleteUserCoreData(userId);
}

export {
  verifyUserPassword,
  verifyUserTwoFactor,
  deleteUserAccount,
};

import pool from '../db.js';
import { generateBase32Secret, buildOtpauthUrl, verifyTOTP } from '../utils/totp.js';

async function getTwoFactorRecordByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM UserTwoFactor WHERE userId = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

async function getTwoFactorStatusForUser(userId) {
  const record = await getTwoFactorRecordByUserId(userId);
  return {
    enabled: !!(record && record.isEnabled),
    createdAt: record ? record.createdAt : null,
    confirmedAt: record ? record.confirmedAt : null,
  };
}

async function startTwoFactorSetup(userId) {
  const secret = generateBase32Secret(20);

  const existing = await getTwoFactorRecordByUserId(userId);

  if (existing) {
    // Always generate a fresh secret when starting setup (even if re-enabling)
    await pool.query(
      'UPDATE UserTwoFactor SET secret = ?, isEnabled = 0, confirmedAt = NULL, updatedAt = NOW() WHERE userId = ?',
      [secret, userId]
    );
  } else {
    await pool.query(
      'INSERT INTO UserTwoFactor (userId, secret, isEnabled, createdAt, updatedAt) VALUES (?, ?, 0, NOW(), NOW())',
      [userId, secret]
    );
  }

  // Get user email for otpauth URL
  let accountName = userId.toString();
  try {
    const [userRows] = await pool.query(
      'SELECT email FROM `User` WHERE id = ? LIMIT 1',
      [userId]
    );
    if (userRows && userRows.length > 0 && userRows[0].email) {
      accountName = userRows[0].email;
    }
  } catch (err) {
    // If we can't get email, fall back to userId
    console.warn('[TwoFactorService] Could not fetch user email, using userId:', err.message);
  }

  const otpauthUrl = buildOtpauthUrl({
    secret,
    accountName,
    issuer: 'OGC NewFinity',
  });

  return { secret, otpauthUrl };
}

async function confirmTwoFactorSetup(userId) {
  await pool.query(
    'UPDATE UserTwoFactor SET isEnabled = 1, confirmedAt = NOW(), updatedAt = NOW() WHERE userId = ?',
    [userId]
  );
}

async function disableTwoFactor(userId) {
  // Disable 2FA and clear the secret to ensure fresh setup on re-enable
  await pool.query(
    'UPDATE UserTwoFactor SET isEnabled = 0, secret = NULL, confirmedAt = NULL, updatedAt = NOW() WHERE userId = ?',
    [userId]
  );
}

async function getSecretForUser(userId) {
  const record = await getTwoFactorRecordByUserId(userId);
  return record ? record.secret : null;
}

/**
 * Verify a TOTP code for a user during login
 * @param {number} userId - User ID
 * @param {string} token - 6-digit TOTP code
 * @returns {Promise<boolean>} True if code is valid
 * @throws {Error} If 2FA is not enabled or code is invalid
 */
async function verifyUserTotpCode(userId, token) {
  const record = await getTwoFactorRecordByUserId(userId);
  if (!record || !record.isEnabled || !record.secret) {
    const err = new Error('Two-factor authentication is not enabled');
    err.code = 'TWO_FACTOR_NOT_ENABLED';
    err.statusCode = 400;
    throw err;
  }

  const ok = verifyTOTP(token, record.secret);
  if (!ok) {
    const err = new Error('Invalid two-factor code');
    err.code = 'INVALID_TOTP_CODE';
    err.statusCode = 400;
    throw err;
  }

  return true;
}

export {
  getTwoFactorStatusForUser,
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getSecretForUser,
  verifyUserTotpCode,
};

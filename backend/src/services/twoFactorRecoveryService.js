/**
 * 2FA Recovery Codes Service
 * Phase S5: Generate, manage, and validate one-time recovery codes for 2FA
 */

import crypto from 'crypto';
import pool from '../db.js';

const RECOVERY_CODE_COUNT = 10;

/**
 * Generate a single random recovery code string (e.g. 4-4-4-4 format).
 * Uses uppercase letters and digits, excluding ambiguous characters.
 */
function generateRecoveryCode() {
  // Example: 4 groups of 4 uppercase letters/digits: XXXX-XXXX-XXXX-XXXX
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let raw = '';
  for (let i = 0; i < 16; i += 1) {
    const idx = crypto.randomInt(0, alphabet.length);
    raw += alphabet[idx];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

/**
 * Hash a recovery code using SHA-256
 */
function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Generate a fresh set of recovery codes, invalidating old ones.
 * Returns the PLAIN codes (for display/download) and stores hashes.
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} Array of plain recovery codes
 */
export async function generateRecoveryCodesForUser(userId) {
  // 1) Delete existing recovery codes
  await pool.query('DELETE FROM UserTwoFactorRecovery WHERE userId = ?', [userId]);

  // 2) Generate new codes
  const codes = [];
  const rows = [];

  for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
    const code = generateRecoveryCode();
    const codeHash = hashRecoveryCode(code);
    codes.push(code);
    rows.push([userId, codeHash, `Code ${i + 1}`]);
  }

  // 3) Insert hashed codes
  await pool.query(
    'INSERT INTO UserTwoFactorRecovery (userId, codeHash, label) VALUES ?',
    [rows]
  );

  return codes;
}

/**
 * Get masked list of recovery codes (no plain values).
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of recovery code status objects
 */
export async function getRecoveryCodesStatusForUser(userId) {
  const [rows] = await pool.query(
    `
    SELECT id, label, used, usedAt, createdAt
    FROM UserTwoFactorRecovery
    WHERE userId = ?
    ORDER BY id ASC
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    used: !!row.used,
    usedAt: row.usedAt,
    createdAt: row.createdAt,
  }));
}

/**
 * Validate and consume a recovery code for login (Phase S6 will use this).
 * @param {number} userId - User ID
 * @param {string} code - Plain recovery code
 * @returns {Promise<{ok: boolean, reason?: string}>} Validation result
 */
export async function consumeRecoveryCode(userId, code) {
  const hash = hashRecoveryCode(code);

  const [rows] = await pool.query(
    `
    SELECT id, used
    FROM UserTwoFactorRecovery
    WHERE userId = ? AND codeHash = ?
    LIMIT 1
    `,
    [userId, hash]
  );

  const row = rows[0];
  if (!row) {
    return { ok: false, reason: 'NOT_FOUND' };
  }
  if (row.used) {
    return { ok: false, reason: 'ALREADY_USED' };
  }

  await pool.query(
    `
    UPDATE UserTwoFactorRecovery
    SET used = 1, usedAt = NOW()
    WHERE id = ?
    `,
    [row.id]
  );

  return { ok: true };
}

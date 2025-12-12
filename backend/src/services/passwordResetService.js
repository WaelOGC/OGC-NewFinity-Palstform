import crypto from "crypto";
import pool from "../db.js";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRY_HOURS = 2;

/**
 * Create a new password reset token for a user
 * @param {number} userId - User ID
 * @returns {Promise<{id: number, tokenPlain: string, expiresAt: Date}>}
 */
export async function createPasswordResetToken(userId) {
  const tokenPlain = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(tokenPlain).digest("hex");

  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  const [result] = await pool.query(
    `INSERT INTO PasswordResetToken (userId, token, tokenPlain, expiresAt)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, process.env.NODE_ENV !== "production" ? tokenPlain : null, expiresAt]
  );

  return {
    id: result.insertId,
    tokenPlain,   // to send in email link
    expiresAt,
  };
}

/**
 * Find a valid password reset token for a user
 * @param {number} userId - User ID
 * @param {string} tokenPlain - Plain text token
 * @returns {Promise<Object|null>} Token record or null if not found/invalid
 */
export async function findValidPasswordResetToken(userId, tokenPlain) {
  const tokenHash = crypto.createHash("sha256").update(tokenPlain).digest("hex");

  const [rows] = await pool.query(
    `SELECT * FROM PasswordResetToken
     WHERE userId = ?
       AND token = ?
       AND usedAt IS NULL
       AND expiresAt > NOW()
     ORDER BY createdAt DESC
     LIMIT 1`,
    [userId, tokenHash]
  );

  return rows[0] || null;
}

/**
 * Mark a password reset token as used
 * @param {number} id - Token ID
 */
export async function markPasswordResetTokenUsed(id) {
  await pool.query(
    `UPDATE PasswordResetToken SET usedAt = NOW() WHERE id = ?`,
    [id]
  );
}

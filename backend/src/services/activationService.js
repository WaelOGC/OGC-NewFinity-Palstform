/**
 * Activation Service
 * Handles account activation tokens and verification
 */

import crypto from 'crypto';
import pool from '../db.js';

const ACTIVATION_TOKEN_EXPIRY_HOURS = 24;
const TERMS_VERSION = 'v1.0'; // Current terms version

/**
 * Generate a secure random activation token
 */
function generateActivationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash activation token for storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new activation token for a user
 * Invalidates any existing unused tokens for that user
 * @param {number} userId - User ID
 * @returns {Promise<{token: string, hashedToken: string}>} - Plain token (for email) and hashed token (for storage)
 */
export async function createActivationToken(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Invalidate existing unused tokens for this user
    await connection.query(
      'UPDATE ActivationToken SET used = TRUE WHERE userId = ? AND used = FALSE',
      [userId]
    );

    // Generate new token
    const plainToken = generateActivationToken();
    const hashedToken = hashToken(plainToken);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ACTIVATION_TOKEN_EXPIRY_HOURS);

    // Store hashed token
    await connection.query(
      'INSERT INTO ActivationToken (userId, token, expiresAt) VALUES (?, ?, ?)',
      [userId, hashedToken, expiresAt]
    );

    await connection.commit();
    return { token: plainToken, hashedToken };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Verify and use an activation token
 * @param {string} token - Plain activation token from URL
 * @returns {Promise<{userId: number, valid: boolean}>}
 */
export async function verifyActivationToken(token) {
  const hashedToken = hashToken(token);

  const [rows] = await pool.query(
    `SELECT at.userId, at.used, at.expiresAt, u.status 
     FROM ActivationToken at
     JOIN User u ON at.userId = u.id
     WHERE at.token = ?`,
    [hashedToken]
  );

  if (rows.length === 0) {
    return { valid: false, reason: 'INVALID' };
  }

  const record = rows[0];

  if (record.used) {
    return { valid: false, reason: 'ALREADY_USED' };
  }

  if (new Date(record.expiresAt) < new Date()) {
    return { valid: false, reason: 'EXPIRED' };
  }

  return { valid: true, userId: record.userId, currentStatus: record.status };
}

/**
 * Mark activation token as used and activate user account
 * @param {string} token - Plain activation token
 * @returns {Promise<{success: boolean, userId: number}>}
 */
export async function activateAccount(token) {
  const verification = await verifyActivationToken(token);
  
  if (!verification.valid) {
    throw new Error('Invalid or expired activation token');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Mark token as used
    const hashedToken = hashToken(token);
    await connection.query(
      'UPDATE ActivationToken SET used = TRUE WHERE token = ?',
      [hashedToken]
    );

    // Activate user account
    await connection.query(
      'UPDATE User SET status = ? WHERE id = ?',
      ['active', verification.userId]
    );

    await connection.commit();
    
    console.log(`✅ Account activated for user ID: ${verification.userId}`);
    return { success: true, userId: verification.userId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get current terms version
 */
export function getTermsVersion() {
  return TERMS_VERSION;
}

export { ACTIVATION_TOKEN_EXPIRY_HOURS };


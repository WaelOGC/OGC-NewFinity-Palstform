/**
 * Account Export Service (PHASE S3)
 * 
 * Assembles a complete account data export for a user, including:
 * - Basic profile information
 * - Sessions & devices
 * - Two-factor authentication status
 * - Security/activity logs (optional, graceful failure)
 */

import pool from '../db.js';

/**
 * Build account export payload for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Export payload object
 */
async function buildAccountExportForUser(userId) {
  // Profile section
  const [userRows] = await pool.query(
    `SELECT 
      id, email, username, fullName, country, phone,
      createdAt, updatedAt, lastLoginAt
    FROM \`User\`
    WHERE id = ?`,
    [userId]
  );

  if (!userRows || userRows.length === 0) {
    throw new Error('User not found');
  }

  const user = userRows[0];
  const profile = {
    id: user.id,
    email: user.email,
    username: user.username || null,
    fullName: user.fullName || null,
    country: user.country || null,
    phone: user.phone || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null,
  };

  // Sessions & devices section
  let sessions = [];
  try {
    const [sessionRows] = await pool.query(
      `SELECT 
        id, createdAt, lastSeenAt, expiresAt,
        ipAddress, userAgent, deviceFingerprint, revokedAt
      FROM AuthSession
      WHERE userId = ?
      ORDER BY lastSeenAt DESC`,
      [userId]
    );

    sessions = sessionRows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      lastSeenAt: row.lastSeenAt,
      expiresAt: row.expiresAt,
      ipAddress: row.ipAddress || null,
      userAgent: row.userAgent || null,
      deviceFingerprint: row.deviceFingerprint || null,
      revokedAt: row.revokedAt || null,
    }));
  } catch (err) {
    // Handle missing table gracefully
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      console.warn('[AccountExport] AuthSession table does not exist, skipping sessions');
      sessions = [];
    } else {
      throw err;
    }
  }

  // Two-factor section
  let twoFactor = { isEnabled: false };
  try {
    const [twoFactorRows] = await pool.query(
      `SELECT isEnabled, createdAt, confirmedAt, updatedAt
      FROM UserTwoFactor
      WHERE userId = ?
      LIMIT 1`,
      [userId]
    );

    if (twoFactorRows && twoFactorRows.length > 0) {
      const row = twoFactorRows[0];
      twoFactor = {
        isEnabled: !!row.isEnabled,
        createdAt: row.createdAt || null,
        confirmedAt: row.confirmedAt || null,
        updatedAt: row.updatedAt || null,
      };
    }
  } catch (err) {
    // Handle missing table gracefully
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      console.warn('[AccountExport] UserTwoFactor table does not exist, skipping 2FA data');
    } else {
      throw err;
    }
  }

  // Security/activity section (optional, graceful failure)
  let securityActivity = [];
  try {
    const [activityRows] = await pool.query(
      `SELECT 
        id, activityType, description, ipAddress, userAgent, createdAt
      FROM UserActivityLog
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 50`,
      [userId]
    );

    securityActivity = activityRows.map((row) => ({
      id: row.id,
      type: row.activityType || null,
      description: row.description || null,
      ipAddress: row.ipAddress || null,
      userAgent: row.userAgent || null,
      createdAt: row.createdAt,
    }));
  } catch (err) {
    // Handle missing table gracefully
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      console.warn('[AccountExport] UserActivityLog table does not exist, skipping activity data');
      securityActivity = [];
    } else {
      // For other errors, log but don't throw - activity is optional
      console.warn('[AccountExport] Failed to fetch activity data:', err.message);
      securityActivity = [];
    }
  }

  // Assemble final export object
  return {
    generatedAt: new Date().toISOString(),
    version: '1.0',
    profile,
    twoFactor,
    sessions,
    securityActivity,
  };
}

export { buildAccountExportForUser };

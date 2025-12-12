/**
 * Session Service (PHASE S2)
 * 
 * Handles authentication session management with database-backed sessions:
 * - Create sessions on login with opaque session tokens
 * - Update lastSeenAt on authenticated requests
 * - Revoke sessions (single or all)
 * - List sessions for a user
 * - Automatic expiry handling
 */

import pool from '../db.js';
import crypto from 'crypto';

const DEFAULT_SESSION_TTL_DAYS = 30;

/**
 * Generate a random opaque session token
 * @returns {string} 64-character hex token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 chars
}

/**
 * Create a new authentication session for a user
 * @param {number} userId - User ID
 * @param {Object} options - Session options
 * @param {string} [options.ipAddress] - IP address
 * @param {string} [options.userAgent] - User agent string
 * @param {string} [options.deviceFingerprint] - Device fingerprint hash
 * @returns {Promise<Object>} Object with sessionId and sessionToken
 */
export async function createSessionForUser(userId, { ipAddress, userAgent, deviceFingerprint } = {}) {
  const sessionToken = generateSessionToken();

  const [result] = await pool.query(
    `INSERT INTO AuthSession
      (userId, sessionToken, userAgent, ipAddress, deviceFingerprint, createdAt, lastSeenAt, expiresAt, isCurrent)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 1)`,
    [userId, sessionToken, userAgent || null, ipAddress || null, deviceFingerprint || null, DEFAULT_SESSION_TTL_DAYS]
  );

  const sessionId = result.insertId;

  // Mark all other sessions for this user as not current
  await pool.query(
    `UPDATE AuthSession SET isCurrent = 0 WHERE userId = ? AND id != ?`,
    [userId, sessionId]
  );

  // Development logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AuthSession] Created session', {
      sessionId,
      userId,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent ? userAgent.slice(0, 60) : 'unknown',
    });
  }

  return { sessionId, sessionToken };
}

/**
 * Update lastSeenAt for a session
 * @param {number} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function touchSession(sessionId) {
  if (!sessionId) return;
  try {
    await pool.query(
      'UPDATE AuthSession SET lastSeenAt = NOW() WHERE id = ? AND revokedAt IS NULL',
      [sessionId]
    );
  } catch (err) {
    // Handle missing table gracefully (non-fatal)
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AuthSession] Table does not exist yet:', err.message);
      }
      return;
    }
    throw err;
  }
}

/**
 * Find a valid session by token
 * @param {string} sessionToken - Session token
 * @returns {Promise<Object|null>} Session object or null
 */
export async function findValidSessionByToken(sessionToken) {
  if (!sessionToken) return null;

  try {
    const [rows] = await pool.query(
      `SELECT *
       FROM AuthSession
       WHERE sessionToken = ?
         AND revokedAt IS NULL
         AND expiresAt > NOW()
       LIMIT 1`,
      [sessionToken]
    );

    return rows[0] || null;
  } catch (err) {
    // Handle missing table gracefully
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AuthSession] Table does not exist yet:', err.message);
      }
      return null;
    }
    throw err;
  }
}

/**
 * Get all sessions for a user
 * @param {number} userId - User ID
 * @param {number} [currentSessionId] - Current session ID to mark as current
 * @returns {Promise<Array>} Array of session objects
 */
export async function getSessionsForUser(userId, currentSessionId) {
  try {
    const [rows] = await pool.query(
      `SELECT id, userId, userAgent, ipAddress, deviceFingerprint, createdAt, lastSeenAt, expiresAt, revokedAt
       FROM AuthSession
       WHERE userId = ?
       ORDER BY lastSeenAt DESC`,
      [userId]
    );

    return rows.map((row) => ({
      ...row,
      isCurrent: currentSessionId && row.id === currentSessionId,
      isExpired: row.expiresAt && new Date(row.expiresAt) <= new Date(),
      isRevoked: !!row.revokedAt,
    }));
  } catch (err) {
    // Handle missing table gracefully
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AuthSession] Table does not exist yet:', err.message);
      }
      return [];
    }
    throw err;
  }
}

/**
 * Revoke a specific session
 * @param {number} userId - User ID
 * @param {number} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function revokeSession(userId, sessionId) {
  await pool.query(
    `UPDATE AuthSession
     SET revokedAt = NOW(), isCurrent = 0
     WHERE id = ? AND userId = ? AND revokedAt IS NULL`,
    [sessionId, userId]
  );
}

/**
 * Revoke all other sessions for a user (except current)
 * @param {number} userId - User ID
 * @param {number} currentSessionId - Current session ID to keep
 * @returns {Promise<void>}
 */
export async function revokeOtherSessions(userId, currentSessionId) {
  await pool.query(
    `UPDATE AuthSession
     SET revokedAt = NOW(), isCurrent = 0
     WHERE userId = ?
       AND id <> ?
       AND revokedAt IS NULL`,
    [userId, currentSessionId]
  );
}

/**
 * Revoke all other sessions (alias for revokeOtherSessions)
 * @param {number} userId - User ID
 * @param {number} currentSessionId - Current session ID to keep
 * @returns {Promise<void>}
 */
export async function revokeAllOtherSessions(userId, currentSessionId) {
  return revokeOtherSessions(userId, currentSessionId);
}

/**
 * Cleanup expired sessions (mark as revoked)
 * @returns {Promise<void>}
 */
export async function cleanupExpiredSessions() {
  try {
    await pool.query(
      `UPDATE AuthSession
       SET revokedAt = NOW(), isCurrent = 0
       WHERE expiresAt <= NOW()
         AND revokedAt IS NULL`
    );
  } catch (err) {
    // Handle missing table gracefully
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      return;
    }
    throw err;
  }
}

/**
 * Revoke all sessions for a user (admin function)
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of sessions revoked
 */
export async function revokeAllUserSessions(userId) {
  const [result] = await pool.query(
    `UPDATE AuthSession SET revokedAt = NOW(), isCurrent = 0 WHERE userId = ? AND revokedAt IS NULL`,
    [userId]
  );
  return result.affectedRows;
}

// Backward compatibility: Keep old function names that might be used elsewhere
export async function createSession({ userId, accessToken, userAgent, ipAddress, deviceLabel }) {
  // For backward compatibility, generate device fingerprint from userAgent if not provided
  let deviceFingerprint = null;
  if (userAgent && !deviceLabel) {
    deviceFingerprint = crypto.createHash('sha256').update(userAgent).digest('hex');
  }
  
  const { sessionId, sessionToken } = await createSessionForUser(userId, {
    ipAddress,
    userAgent,
    deviceFingerprint,
  });
  
  return sessionId;
}

export async function updateSessionLastSeen(accessToken) {
  // This is called from auth middleware with JWT token
  // For backward compatibility, we'll try to find session by token hash
  // But this won't work with new opaque tokens - should be updated to use sessionId
  const sessionToken = crypto.createHash('sha256').update(accessToken).digest('hex');
  
  try {
    const [result] = await pool.query(
      `UPDATE AuthSession 
       SET lastSeenAt = CURRENT_TIMESTAMP 
       WHERE sessionToken = ? AND revokedAt IS NULL`,
      [sessionToken]
    );
    return result.affectedRows > 0;
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      return false;
    }
    throw err;
  }
}

export async function getUserSessions(userId, currentToken = null) {
  // Backward compatibility wrapper
  return await getSessionsForUser(userId, null);
}

export async function getSessionByToken(accessToken) {
  // Backward compatibility - try hash lookup
  const sessionToken = crypto.createHash('sha256').update(accessToken).digest('hex');
  return await findValidSessionByToken(sessionToken);
}

export async function isNewDeviceOrIpForUser({ userId, ipAddress, userAgent }) {
  // Keep existing implementation for backward compatibility
  if (!userId) {
    return { isNew: false, lastKnownSession: null };
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, ipAddress, userAgent, createdAt, lastSeenAt
       FROM AuthSession
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT 21`,
      [userId]
    );

    if (!rows || rows.length <= 1) {
      return { isNew: true, lastKnownSession: null };
    }

    const previousSessions = rows.slice(1);
    const hasSameFingerprint = previousSessions.some((row) => {
      const sameIp = ipAddress && row.ipAddress && row.ipAddress.trim() === ipAddress.trim();
      const sameUa = userAgent && row.userAgent && row.userAgent.trim() === userAgent.trim();
      return sameIp && sameUa;
    });

    if (hasSameFingerprint) {
      return { isNew: false, lastKnownSession: previousSessions[0] || null };
    }

    return { isNew: true, lastKnownSession: previousSessions[0] || null };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[AuthSession] Failed to determine new device/IP:", err);
    }
    return { isNew: false, lastKnownSession: null };
  }
}

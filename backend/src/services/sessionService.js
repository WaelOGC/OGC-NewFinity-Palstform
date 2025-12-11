/**
 * Session Service (Phase 7.1)
 * 
 * Handles authentication session management:
 * - Create sessions on login
 * - Update lastSeenAt on authenticated requests
 * - Revoke sessions (single or all)
 * - List sessions for a user
 */

import pool from '../db.js';
import crypto from 'crypto';

/**
 * Hash a JWT token to use as session identifier
 * @param {string} token - JWT access token
 * @returns {string} SHA-256 hash of the token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new authentication session
 * @param {Object} params - Session parameters
 * @param {number} params.userId - User ID
 * @param {string} params.accessToken - JWT access token
 * @param {string} [params.userAgent] - User agent string
 * @param {string} [params.ipAddress] - IP address
 * @param {string} [params.deviceLabel] - Optional device label
 * @returns {Promise<number>} Session ID
 */
export async function createSession({ userId, accessToken, userAgent, ipAddress, deviceLabel }) {
  const sessionToken = hashToken(accessToken);
  
  const [result] = await pool.query(
    `INSERT INTO AuthSession (userId, sessionToken, userAgent, ipAddress, deviceLabel, isCurrent)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [userId, sessionToken, userAgent || null, ipAddress || null, deviceLabel || null]
  );

  // Mark all other sessions for this user as not current
  await pool.query(
    `UPDATE AuthSession SET isCurrent = 0 WHERE userId = ? AND id != ?`,
    [userId, result.insertId]
  );

  return result.insertId;
}

/**
 * Update lastSeenAt for a session by token
 * @param {string} accessToken - JWT access token
 * @returns {Promise<boolean>} True if session was found and updated
 */
export async function updateSessionLastSeen(accessToken) {
  const sessionToken = hashToken(accessToken);
  
  const [result] = await pool.query(
    `UPDATE AuthSession 
     SET lastSeenAt = CURRENT_TIMESTAMP 
     WHERE sessionToken = ?`,
    [sessionToken]
  );

  return result.affectedRows > 0;
}

/**
 * Get all sessions for a user
 * @param {number} userId - User ID
 * @param {string} [currentToken] - Current JWT token to identify current session
 * @returns {Promise<Array>} Array of session objects
 */
export async function getUserSessions(userId, currentToken = null) {
  let query = `
    SELECT id, userId, sessionToken, userAgent, ipAddress, deviceLabel, createdAt, lastSeenAt, isCurrent
    FROM AuthSession
    WHERE userId = ?
    ORDER BY lastSeenAt DESC
  `;
  
  const [rows] = await pool.query(query, [userId]);
  
  // If currentToken is provided, mark the matching session as current
  if (currentToken) {
    const currentSessionToken = hashToken(currentToken);
    
    // Update isCurrent flag in database for the matching session
    await pool.query(
      `UPDATE AuthSession SET isCurrent = 1 WHERE userId = ? AND sessionToken = ?`,
      [userId, currentSessionToken]
    );
    
    // Update all other sessions to not current
    await pool.query(
      `UPDATE AuthSession SET isCurrent = 0 WHERE userId = ? AND sessionToken != ?`,
      [userId, currentSessionToken]
    );
  }
  
  // Map results, marking current session based on token match
  const currentSessionToken = currentToken ? hashToken(currentToken) : null;
  return rows.map(session => ({
    id: session.id,
    userId: session.userId,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    deviceLabel: session.deviceLabel,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    isCurrent: currentSessionToken ? (session.sessionToken === currentSessionToken) : (session.isCurrent === 1)
  }));
}

/**
 * Revoke a specific session
 * @param {number} sessionId - Session ID
 * @param {number} userId - User ID (for security: ensure session belongs to user)
 * @returns {Promise<boolean>} True if session was found and revoked
 */
export async function revokeSession(sessionId, userId) {
  const [result] = await pool.query(
    `DELETE FROM AuthSession WHERE id = ? AND userId = ?`,
    [sessionId, userId]
  );

  return result.affectedRows > 0;
}

/**
 * Revoke all sessions for a user except the current one
 * @param {number} userId - User ID
 * @param {string} currentToken - Current JWT token to keep
 * @returns {Promise<number>} Number of sessions revoked
 */
export async function revokeAllOtherSessions(userId, currentToken) {
  const currentSessionToken = hashToken(currentToken);
  
  const [result] = await pool.query(
    `DELETE FROM AuthSession WHERE userId = ? AND sessionToken != ?`,
    [userId, currentSessionToken]
  );

  return result.affectedRows;
}

/**
 * Revoke all sessions for a user (admin function)
 * @param {number} userId - User ID
 * @returns {Promise<number>} Number of sessions revoked
 */
export async function revokeAllUserSessions(userId) {
  const [result] = await pool.query(
    `DELETE FROM AuthSession WHERE userId = ?`,
    [userId]
  );

  return result.affectedRows;
}

/**
 * Get session by token (for validation)
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object|null>} Session object or null
 */
export async function getSessionByToken(accessToken) {
  const sessionToken = hashToken(accessToken);
  
  const [rows] = await pool.query(
    `SELECT id, userId, sessionToken, userAgent, ipAddress, deviceLabel, createdAt, lastSeenAt, isCurrent
     FROM AuthSession
     WHERE sessionToken = ?`,
    [sessionToken]
  );

  if (rows.length === 0) {
    return null;
  }

  const session = rows[0];
  return {
    id: session.id,
    userId: session.userId,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    deviceLabel: session.deviceLabel,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    isCurrent: session.isCurrent === 1
  };
}

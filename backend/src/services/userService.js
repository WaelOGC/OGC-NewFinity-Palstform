import pool from "../db.js";
import { logUserActivity } from "./activityService.js";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { getDefaultPermissionsForRole, roleHasPermission } from "../config/rolePermissions.js";
import { validatePasswordStrength } from "../utils/passwordPolicy.js";
import { normalizeAccountStatus, ACCOUNT_STATUS } from "../utils/accountStatus.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SALT_ROUNDS = 10;

export async function getAllUsers() {
  const [rows] = await pool.query(
    "SELECT id, email, fullName, createdAt, updatedAt FROM User ORDER BY id DESC"
  );
  return rows;
}

export async function getUserById(id) {
  const [rows] = await pool.query(
    "SELECT id, email, fullName, createdAt, updatedAt FROM User WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ email, password, fullName }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await pool.query(
    "INSERT INTO User (email, password, fullName) VALUES (?, ?, ?)",
    [email, passwordHash, fullName || null]
  );
  return {
    id: result.insertId,
    email,
    fullName: fullName || null,
  };
}

export async function deleteUser(id) {
  const [result] = await pool.query("DELETE FROM User WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function verifyUserCredentials(email, password) {
  const [rows] = await pool.query(
    "SELECT id, email, password, fullName FROM User WHERE email = ?",
    [email]
  );
  const user = rows[0];
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  };
}

// ============================================================================
// Account System Expansion (Phase 1) - Profile Management Functions
// ============================================================================
// TODO: Expand in Phase 2 (permissions, device tracking, verification, wallet linking)

/**
 * Get complete user profile by ID (Phase 5: includes role, permissions, featureFlags)
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User profile object or null if not found
 */
export async function getUserProfile(userId) {
  // First get required fields
  const [rows] = await pool.query(
    `SELECT 
      id, email, fullName,
      COALESCE(accountStatus, status) as accountStatus,
      onboardingStep, lastLoginAt, createdAt, updatedAt,
      role, permissions, featureFlags
    FROM User 
    WHERE id = ?`,
    [userId]
  );
  
  if (!rows[0]) return null;
  
  // Normalize account status
  if (rows[0].accountStatus) {
    rows[0].accountStatus = normalizeAccountStatus(rows[0].accountStatus);
  }
  
  // Try to get optional profile fields if they exist
  let optionalFields = { username: null, country: null, bio: null, phone: null, avatarUrl: null };
  try {
    const [optionalRows] = await pool.query(
      `SELECT username, country, bio, phone, avatarUrl FROM User WHERE id = ?`,
      [userId]
    );
    if (optionalRows[0]) {
      optionalFields = {
        username: optionalRows[0].username || null,
        country: optionalRows[0].country || null,
        bio: optionalRows[0].bio || null,
        phone: optionalRows[0].phone || null,
        avatarUrl: optionalRows[0].avatarUrl || null,
      };
    }
  } catch (err) {
    // Columns don't exist yet (migration not run), use null values
    // This is expected during initial setup
  }
  
  const user = rows[0];
  
  // Merge optional fields
  Object.assign(user, optionalFields);
  
  // Parse JSON columns
  if (user.permissions) {
    try {
      user.permissions = typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : user.permissions;
    } catch (e) {
      user.permissions = null;
    }
  }
  
  if (user.featureFlags) {
    try {
      user.featureFlags = typeof user.featureFlags === 'string'
        ? JSON.parse(user.featureFlags)
        : user.featureFlags;
    } catch (e) {
      user.featureFlags = null;
    }
  }
  
  return user;
}

/**
 * Get connected OAuth providers for a user
 * @param {number} userId - User ID
 * @returns {Promise<string[]>} Array of provider names (e.g., ['google', 'github'])
 */
export async function getConnectedProviders(userId) {
  const [rows] = await pool.query(
    `SELECT 
      googleId, githubId, twitterId, linkedinId, discordId
    FROM User 
    WHERE id = ?`,
    [userId]
  );
  
  if (rows.length === 0) {
    return [];
  }
  
  const user = rows[0];
  const providers = [];
  
  if (user.googleId) providers.push('google');
  if (user.githubId) providers.push('github');
  if (user.twitterId) providers.push('twitter');
  if (user.linkedinId) providers.push('linkedin');
  if (user.discordId) providers.push('discord');
  
  return providers;
}

/**
 * Get user with full role/permissions/flags data (Phase 5)
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object with computed permissions and merged feature flags
 */
export async function getUserWithAccessData(userId) {
  const user = await getUserProfile(userId);
  if (!user) return null;
  
  // Compute effective permissions
  const effectivePermissions = getEffectivePermissions(user);
  user.effectivePermissions = effectivePermissions;
  
  // Merge feature flags with defaults
  const mergedFeatureFlags = mergeFeatureFlags(user.featureFlags, getDefaultFeatureFlags());
  user.featureFlags = mergedFeatureFlags;
  
  // Add connected OAuth providers
  user.connectedProviders = await getConnectedProviders(userId);
  
  return user;
}

/**
 * Update user profile information
 * @param {number} userId - User ID
 * @param {Object} profileData - Profile fields to update
 * @param {string} [profileData.fullName] - Full name
 * @param {string} [profileData.username] - Username (unique handle)
 * @param {string} [profileData.country] - Country
 * @param {string} [profileData.bio] - Biography
 * @param {string} [profileData.phone] - Phone number
 * @param {string} [profileData.avatarUrl] - Avatar URL
 * @returns {Promise<Object>} Updated user profile
 */
export async function updateUserProfile(userId, profileData) {
  const allowedFields = ['fullName', 'username', 'country', 'bio', 'phone', 'avatarUrl'];
  const updates = [];
  const values = [];

  for (const field of allowedFields) {
    if (profileData[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(profileData[field] || null);
    }
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(userId);

  const [result] = await pool.query(
    `UPDATE User 
     SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    throw new Error('User not found');
  }

  return await getUserProfile(userId);
}

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Object with success: true if password changed successfully
 */
export async function changePassword(userId, currentPassword, newPassword) {
  if (!userId) {
    const err = new Error('User id is required');
    err.code = 'USER_ID_REQUIRED';
    throw err;
  }

  const user = await getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  // Get user with password hash
  const [rows] = await pool.query(
    "SELECT id, password FROM User WHERE id = ?",
    [userId]
  );
  const userWithPassword = rows[0];
  
  if (!userWithPassword || !userWithPassword.password) {
    const err = new Error('Password login is not enabled for this account.');
    err.code = 'PASSWORD_LOGIN_DISABLED';
    throw err;
  }

  const hash = userWithPassword.password;

  const matches = await bcrypt.compare(currentPassword || '', hash);
  if (!matches) {
    const err = new Error('Current password is incorrect.');
    err.code = 'CURRENT_PASSWORD_INVALID';
    throw err;
  }

  const { ok, errors } = validatePasswordStrength(newPassword);
  if (!ok) {
    const err = new Error(errors[0] || 'New password does not meet requirements.');
    err.code = 'NEW_PASSWORD_WEAK';
    err.details = errors;
    throw err;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  const [result] = await pool.query(
    "UPDATE User SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
    [newHash, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Failed to update password');
  }

  return { success: true };
}

/**
 * Record user activity (Phase 8.6 - Backward compatibility wrapper)
 * @deprecated Use logUserActivity from activityService.js instead
 * @param {Object} params - Activity parameters
 * @param {number} params.userId - User ID
 * @param {number} [params.actorId] - Actor ID (optional, defaults to userId)
 * @param {string} params.type - Activity type
 * @param {string} [params.ipAddress] - IP address
 * @param {string} [params.userAgent] - User agent string
 * @param {Object} [params.metadata] - Additional metadata
 * @returns {Promise<void>}
 */
export async function recordUserActivity({ userId, actorId, type, ipAddress, userAgent, metadata = {} }) {
  // Use the centralized activity service
  return logUserActivity({
    userId,
    actorId: actorId !== undefined ? actorId : null, // null means default to userId in the service
    type,
    ipAddress,
    userAgent,
    metadata
  });
}

/**
 * Record login activity for a user (backward compatibility wrapper)
 * @param {number} userId - User ID
 * @param {Object} activityData - Activity metadata
 * @param {string} [activityData.ipAddress] - IP address
 * @param {string} [activityData.userAgent] - User agent string
 * @param {Object} [activityData.metadata] - Additional metadata
 * @returns {Promise<void>}
 */
export async function recordLoginActivity(userId, activityData = {}) {
  // Update lastLoginAt in User table
  await pool.query(
    "UPDATE User SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?",
    [userId]
  );

  // Log activity using centralized activity service
  await logUserActivity({
    userId,
    actorId: userId, // Self-action
    type: 'LOGIN_SUCCESS',
    ipAddress: activityData.ipAddress,
    userAgent: activityData.userAgent,
    metadata: activityData.metadata || {}
  });
}

/**
 * Unified OAuth profile sync function
 * Handles linking OAuth accounts to existing users or creating new users
 * 
 * @param {Object} params - OAuth sync parameters
 * @param {string} params.provider - Provider name (google, github, twitter, linkedin, discord)
 * @param {string} params.providerUserId - Provider-specific user ID
 * @param {string|null} params.email - User email (may be null for some providers)
 * @param {boolean} [params.emailVerified] - Whether email is verified by provider
 * @param {string|null} [params.username] - Username from provider
 * @param {string|null} [params.displayName] - Display name from provider
 * @param {string|null} [params.avatarUrl] - Avatar URL from provider
 * @param {Object} [params.profileJson] - Full provider profile JSON
 * @param {number} [params.existingUserId] - Optional: when user is already logged in and connects provider
 * @returns {Promise<Object>} Object with { user, isNewUser, isLinkedNewProvider }
 * @throws {Error} With code 'OAUTH_EMAIL_REQUIRED' if no email and no existingUserId
 * @throws {Error} With code 'OAUTH_EMAIL_CONFLICT' if email exists on different account during connect
 */
export async function syncOAuthProfile({
  provider,
  providerUserId,
  email,
  emailVerified = false,
  username = null,
  displayName = null,
  avatarUrl = null,
  profileJson = null,
  existingUserId = null,
}) {
  // Normalize provider name
  const normalizedProvider = provider.toLowerCase();
  
  // Map provider names to database column names
  const providerColumnMap = {
    google: 'googleId',
    github: 'githubId',
    twitter: 'twitterId',
    linkedin: 'linkedinId',
    discord: 'discordId',
  };

  const providerColumn = providerColumnMap[normalizedProvider];
  if (!providerColumn) {
    throw new Error(`Unknown provider: ${normalizedProvider}`);
  }

  // 1) Check if we already have an OAuth account for this providerUserId
  const [existingOAuthRows] = await pool.query(
    `SELECT * FROM User WHERE ${providerColumn} = ? LIMIT 1`,
    [providerUserId]
  );

  if (existingOAuthRows.length > 0) {
    const existingUser = existingOAuthRows[0];
    
    // If user is logged in and trying to connect, but this provider is already linked to a different user
    if (existingUserId && existingUser.id !== existingUserId) {
      const error = new Error('This OAuth account is already linked to another user.');
      error.code = 'OAUTH_ACCOUNT_ALREADY_LINKED';
      error.statusCode = 409;
      throw error;
    }
    
    // Update profile data if provided
    const updates = [];
    const values = [];
    
    if (avatarUrl && (!existingUser.avatarUrl || existingUser.avatarUrl !== avatarUrl)) {
      updates.push('avatarUrl = ?');
      values.push(avatarUrl);
    }
    
    if (displayName && (!existingUser.fullName || existingUser.fullName !== displayName)) {
      updates.push('fullName = COALESCE(fullName, ?)');
      values.push(displayName);
    }
    
    if (updates.length > 0) {
      values.push(existingUser.id);
      await pool.query(
        `UPDATE User SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
      
      // Fetch updated user
      const [updatedRows] = await pool.query('SELECT * FROM User WHERE id = ? LIMIT 1', [existingUser.id]);
      return { user: updatedRows[0], isNewUser: false, isLinkedNewProvider: false };
    }
    
    return { user: existingUser, isNewUser: false, isLinkedNewProvider: false };
  }

  // 2) If user is logged in (connect flow), link provider to that user
  if (existingUserId) {
    // Check if email conflict: email exists on a different account
    if (email) {
      const [emailRows] = await pool.query(
        'SELECT id FROM User WHERE email = ? AND id != ? LIMIT 1',
        [email.toLowerCase(), existingUserId]
      );
      
      if (emailRows.length > 0) {
        const error = new Error('This email is already used by another account.');
        error.code = 'OAUTH_EMAIL_CONFLICT';
        error.statusCode = 409;
        throw error;
      }
    }
    
    // Link provider to existing user
    const updates = [];
    const values = [];
    
    updates.push(`${providerColumn} = ?`);
    values.push(providerUserId);
    
    updates.push('authProvider = COALESCE(authProvider, ?)');
    values.push(normalizedProvider);
    
    if (avatarUrl) {
      updates.push('avatarUrl = COALESCE(avatarUrl, ?)');
      values.push(avatarUrl);
    }
    
    if (displayName) {
      updates.push('fullName = COALESCE(fullName, ?)');
      values.push(displayName);
    }
    
    if (email) {
      updates.push('email = COALESCE(email, ?)');
      values.push(email.toLowerCase());
    }
    
    values.push(existingUserId);
    
    await pool.query(
      `UPDATE User SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.query('SELECT * FROM User WHERE id = ? LIMIT 1', [existingUserId]);
    return { user: rows[0], isNewUser: false, isLinkedNewProvider: true };
  }

  // 3) If we have an email, try to find existing account by email
  let existingUser = null;
  
  if (email) {
    const [userRows] = await pool.query(
      'SELECT * FROM User WHERE email = ? LIMIT 1',
      [email.toLowerCase()]
    );
    if (userRows.length > 0) {
      existingUser = userRows[0];
    }
  }

  // 4) If user exists by email, link provider to that user
  if (existingUser) {
    // Check if this provider is already linked to a different user
    const [providerRows] = await pool.query(
      `SELECT id FROM User WHERE ${providerColumn} = ? AND id != ? LIMIT 1`,
      [providerUserId, existingUser.id]
    );
    
    if (providerRows.length > 0) {
      const error = new Error('This OAuth account is already linked to another user.');
      error.code = 'OAUTH_ACCOUNT_ALREADY_LINKED';
      error.statusCode = 409;
      throw error;
    }
    
    // Link provider to existing user
    const updates = [];
    const values = [];
    
    updates.push(`${providerColumn} = ?`);
    values.push(providerUserId);
    
    updates.push('authProvider = COALESCE(authProvider, ?)');
    values.push(normalizedProvider);
    
    if (avatarUrl && !existingUser.avatarUrl) {
      updates.push('avatarUrl = ?');
      values.push(avatarUrl);
    }
    
    if (displayName && !existingUser.fullName) {
      updates.push('fullName = COALESCE(fullName, ?)');
      values.push(displayName);
    }
    
    values.push(existingUser.id);
    
    await pool.query(
      `UPDATE User SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    const [rows] = await pool.query('SELECT * FROM User WHERE id = ? LIMIT 1', [existingUser.id]);
    return { user: rows[0], isNewUser: false, isLinkedNewProvider: true };
  }

  // 5) No email and no existing user - require email for new account creation
  if (!email) {
    const error = new Error('Your OAuth provider did not share an email. Please sign up with email or link from an existing account.');
    error.code = 'OAUTH_EMAIL_REQUIRED';
    error.statusCode = 400;
    throw error;
  }

  // 6) Otherwise, create a new user + link provider
  const now = new Date();
  const termsVersion = process.env.TERMS_VERSION || '1.0';
  const displayNameOrUsername = displayName || username || null;
  
  // Determine default role: first user becomes FOUNDER, others become STANDARD_USER
  const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM User');
  const initialRole = totalUsers === 0 ? 'FOUNDER' : 'STANDARD_USER';
  
  const [insertResult] = await pool.query(
    `INSERT INTO User (email, password, fullName, role, status, accountStatus, authProvider, ${providerColumn}, avatarUrl, termsAccepted, termsAcceptedAt, termsVersion, termsSource, createdAt, updatedAt, emailVerified)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
    [
      email.toLowerCase(),
      displayNameOrUsername,
      initialRole,
      ACCOUNT_STATUS.ACTIVE, // status column
      ACCOUNT_STATUS.ACTIVE, // accountStatus column
      normalizedProvider,
      providerUserId,
      avatarUrl || null,
      now,
      termsVersion,
      normalizedProvider,
      now,
      now,
      emailVerified ? 1 : 0,
    ]
  );

  const newUserId = insertResult.insertId;
  const [createdRows] = await pool.query('SELECT * FROM User WHERE id = ? LIMIT 1', [newUserId]);

  return { user: createdRows[0], isNewUser: true, isLinkedNewProvider: true };
}

/**
 * Get user activity log entries (Phase 2 - Enhanced)
 * @param {number} userId - User ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=20] - Maximum number of entries to return
 * @returns {Promise<Array>} Array of activity log entries
 */
export async function getUserActivityLog(userId, options = {}) {
  const limit = options.limit || 20;
  const [rows] = await pool.query(
    `SELECT id, activityType, description, ipAddress, userAgent, metadata, createdAt
     FROM UserActivityLog
     WHERE userId = ?
     ORDER BY createdAt DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

// ============================================================================
// Account System Expansion (Phase 2) - Device & Session Tracking
// ============================================================================
// TODO: Expand in Phase 3 (IP risk scoring, geo checks, advanced device fingerprinting)

/**
 * Generate a device ID from request information
 * @param {string} userAgent - User agent string
 * @param {string} ipAddress - IP address
 * @returns {string} Device ID (hash-based)
 */
function generateDeviceId(userAgent, ipAddress) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(`${userAgent || ''}|${ipAddress || ''}`);
  return hash.digest('hex').substring(0, 32);
}

/**
 * Parse user agent to extract browser and OS info
 * @param {string} userAgent - User agent string
 * @returns {Object} Parsed device info
 */
function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
  
  // Simple parsing - can be enhanced with a library like ua-parser-js
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { browser, os };
}

/**
 * Register or update a device for a user
 * @param {Object} params - Device parameters
 * @param {number} params.userId - User ID
 * @param {string} [params.deviceId] - Device ID (generated if not provided)
 * @param {string} [params.userAgent] - User agent string
 * @param {string} [params.ipAddress] - IP address
 * @returns {Promise<Object>} Device record
 */
export async function registerDevice({ userId, deviceId, userAgent, ipAddress }) {
  const finalDeviceId = deviceId || generateDeviceId(userAgent, ipAddress);
  const deviceInfo = parseUserAgent(userAgent);
  const deviceName = `${deviceInfo.browser} on ${deviceInfo.os}`;
  
  // Check if device already exists
  const [existing] = await pool.query(
    'SELECT id FROM UserDevices WHERE userId = ? AND deviceFingerprint = ?',
    [userId, finalDeviceId]
  );
  
  if (existing.length > 0) {
    // Update existing device
    await pool.query(
      `UPDATE UserDevices 
       SET lastSeenAt = CURRENT_TIMESTAMP, 
           userAgent = ?, 
           ipAddress = ?,
           updatedAt = CURRENT_TIMESTAMP
       WHERE userId = ? AND deviceFingerprint = ?`,
      [userAgent, ipAddress, userId, finalDeviceId]
    );
    
    const [updated] = await pool.query(
      'SELECT * FROM UserDevices WHERE userId = ? AND deviceFingerprint = ?',
      [userId, finalDeviceId]
    );
    return updated[0];
  } else {
    // Insert new device
    const [result] = await pool.query(
      `INSERT INTO UserDevices (userId, deviceFingerprint, deviceName, userAgent, ipAddress, lastSeenAt)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, finalDeviceId, deviceName, userAgent, ipAddress]
    );
    
    const [newDevice] = await pool.query(
      'SELECT * FROM UserDevices WHERE id = ?',
      [result.insertId]
    );
    return newDevice[0];
  }
}

/**
 * Update device last seen timestamp
 * @param {Object} params - Device parameters
 * @param {number} params.userId - User ID
 * @param {string} params.deviceId - Device ID
 * @returns {Promise<void>}
 */
export async function updateDeviceLastSeen({ userId, deviceId }) {
  await pool.query(
    `UPDATE UserDevices 
     SET lastSeenAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
     WHERE userId = ? AND deviceFingerprint = ?`,
    [userId, deviceId]
  );
}

/**
 * Get all devices for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of device records
 * Note: Falls back to AuthSession data if UserDevices table doesn't exist
 * Note: Handles schema drift for isTrusted column (falls back to query without it)
 */
export async function getUserDevices(userId) {
  try {
    // Try to query UserDevices table with isTrusted column first
    const [rows] = await pool.query(
      `SELECT id, deviceFingerprint, deviceName, userAgent, ipAddress, isTrusted, lastSeenAt, createdAt
       FROM UserDevices
       WHERE userId = ?
       ORDER BY lastSeenAt DESC`,
      [userId]
    );
    return rows;
  } catch (err) {
    // Handle schema drift: isTrusted column may not exist
    if (err.code === 'ER_BAD_FIELD_ERROR' || (err.message && err.message.includes('Unknown column'))) {
      console.warn('[SchemaDrift] UserDevices.isTrusted missing — fallback query used');
      try {
        // Retry query without isTrusted column
        const [rows] = await pool.query(
          `SELECT id, deviceFingerprint, deviceName, userAgent, ipAddress, lastSeenAt, createdAt
           FROM UserDevices
           WHERE userId = ?
           ORDER BY lastSeenAt DESC`,
          [userId]
        );
        // Map results to include isTrusted: false for each device
        return rows.map(device => ({
          ...device,
          isTrusted: false
        }));
      } catch (fallbackErr) {
        // If fallback query also fails, check if table doesn't exist
        if (fallbackErr.code === 'ER_NO_SUCH_TABLE' || fallbackErr.code === '42S02') {
          // Fall through to AuthSession fallback by setting err to fallbackErr
          err = fallbackErr;
        } else {
          // For other errors in fallback, rethrow
          throw fallbackErr;
        }
      }
    }
    
    // If UserDevices table doesn't exist, fall back to AuthSession data
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
      try {
        // Map AuthSession records to device-like format
        const [sessionRows] = await pool.query(
          `SELECT 
            id,
            CONCAT('session_', id) as deviceFingerprint,
            COALESCE(deviceLabel, CONCAT(SUBSTRING_INDEX(SUBSTRING_INDEX(userAgent, ' ', 1), '/', 1), ' on ', 
              CASE 
                WHEN userAgent LIKE '%Windows%' THEN 'Windows'
                WHEN userAgent LIKE '%Mac%' THEN 'macOS'
                WHEN userAgent LIKE '%Linux%' THEN 'Linux'
                WHEN userAgent LIKE '%Android%' THEN 'Android'
                WHEN userAgent LIKE '%iOS%' THEN 'iOS'
                ELSE 'Unknown'
              END)) as deviceName,
            userAgent,
            ipAddress,
            1 as isTrusted,
            lastSeenAt,
            createdAt
           FROM AuthSession
           WHERE userId = ?
           ORDER BY lastSeenAt DESC`,
          [userId]
        );
        return sessionRows;
      } catch (sessionErr) {
        // If AuthSession also doesn't exist, return empty array
        console.warn('[getUserDevices] Both UserDevices and AuthSession tables not found, returning empty array');
        return [];
      }
    }
    // For other errors, rethrow
    throw err;
  }
}

/**
 * Revoke a device (delete it)
 * @param {Object} params - Device parameters
 * @param {number} params.userId - User ID
 * @param {string} params.deviceId - Device ID (deviceFingerprint)
 * @returns {Promise<boolean>} True if device was revoked
 */
export async function revokeDevice({ userId, deviceId }) {
  const [result] = await pool.query(
    'DELETE FROM UserDevices WHERE userId = ? AND deviceFingerprint = ?',
    [userId, deviceId]
  );
  
  return result.affectedRows > 0;
}

// ============================================================================
// Account System Expansion (Phase 3) - Two-Factor Authentication (TOTP)
// ============================================================================

/**
 * Get 2FA status for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} 2FA status object
 */
export async function getTwoFactorStatus(userId) {
  const [rows] = await pool.query(
    'SELECT isEnabled, enabledAt, secret FROM TwoFactorAuth WHERE userId = ?',
    [userId]
  );
  
  if (rows.length === 0 || !rows[0].secret) {
    return { enabled: false, method: null };
  }
  
  return {
    enabled: rows[0].isEnabled === 1,
    method: rows[0].isEnabled === 1 ? 'totp' : null,
    enabledAt: rows[0].enabledAt
  };
}

/**
 * Begin 2FA setup - Generate TOTP secret and otpauth URL
 * @param {number} userId - User ID
 * @param {string} userEmail - User email for QR code label
 * @returns {Promise<Object>} Setup data with otpauth URL
 */
export async function beginTwoFactorSetup(userId, userEmail) {
  // Generate a new TOTP secret
  const secret = speakeasy.generateSecret({
    name: `OGC NewFinity (${userEmail})`,
    issuer: 'OGC NewFinity',
    length: 32
  });

  // Get the base32 secret (for storage)
  const secretBase32 = secret.base32;

  // Generate otpauth URL for QR code
  const otpauthUrl = secret.otpauth_url;

  // Store secret in database (not enabled yet - will be enabled after verification)
  await pool.query(
    `INSERT INTO TwoFactorAuth (userId, secret, isEnabled, enabledAt)
     VALUES (?, ?, 0, NULL)
     ON DUPLICATE KEY UPDATE secret = ?, isEnabled = 0, enabledAt = NULL`,
    [userId, secretBase32, secretBase32]
  );

  return {
    otpauthUrl,
    secretMasked: secretBase32.substring(0, 8) + '...' + secretBase32.substring(secretBase32.length - 4),
    method: 'totp'
  };
}

/**
 * Verify 2FA TOTP code
 * @param {Object} params - Verification parameters
 * @param {number} params.userId - User ID
 * @param {string} params.token - TOTP code (6 digits)
 * @returns {Promise<boolean>} True if code is valid
 */
export async function verifyTwoFactorCode({ userId, token }) {
  // Get user's 2FA secret
  const [rows] = await pool.query(
    'SELECT secret FROM TwoFactorAuth WHERE userId = ?',
    [userId]
  );

  if (rows.length === 0 || !rows[0].secret) {
    throw new Error('2FA is not set up for this user');
  }

  const secret = rows[0].secret;

  // Verify the TOTP token
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps (60 seconds) before/after current time
  });

  if (!verified) {
    throw new Error('Invalid 2FA code');
  }

  return true;
}

/**
 * Enable 2FA after successful verification
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export async function enableTwoFactor(userId) {
  await pool.query(
    'UPDATE TwoFactorAuth SET isEnabled = 1, enabledAt = CURRENT_TIMESTAMP, lastVerifiedAt = CURRENT_TIMESTAMP WHERE userId = ?',
    [userId]
  );
}

/**
 * Disable 2FA for a user
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if disabled successfully
 */
export async function disableTwoFactor(userId) {
  // Disable 2FA and clear secret
  await pool.query(
    'UPDATE TwoFactorAuth SET isEnabled = 0, enabledAt = NULL, secret = NULL, lastVerifiedAt = NULL WHERE userId = ?',
    [userId]
  );
  
  return true;
}

// ============================================================================
// Account System Expansion (Phase 5) - Roles, Permissions & Feature Flags
// ============================================================================

/**
 * Get default feature flags from config file
 * @returns {Object} Default feature flags object
 */
export function getDefaultFeatureFlags() {
  try {
    const configPath = path.join(__dirname, '../config/defaultFeatureFlags.json');
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading default feature flags:', error);
    return {};
  }
}

/**
 * Merge user feature flags with system defaults
 * @param {Object|null} userFlags - User's feature flags (from database)
 * @param {Object} systemDefaults - System default feature flags
 * @returns {Object} Merged feature flags object
 */
export function mergeFeatureFlags(userFlags, systemDefaults) {
  // Start with system defaults
  const merged = { ...systemDefaults };
  
  // If user has flags, merge them (user flags override defaults)
  if (userFlags && typeof userFlags === 'object') {
    Object.assign(merged, userFlags);
  }
  
  return merged;
}

/**
 * Get effective permissions for a user (considering role defaults and custom permissions)
 * @param {Object} user - User object with role and permissions
 * @returns {string[]|null} Array of permission strings, or null if FOUNDER (all permissions)
 */
export function getEffectivePermissions(user) {
  // FOUNDER has all permissions implicitly
  if (user.role === 'FOUNDER') {
    return null; // null means "all permissions"
  }
  
  // If user has custom permissions array, use it (even if empty)
  if (user.permissions !== null && user.permissions !== undefined) {
    if (Array.isArray(user.permissions)) {
      return user.permissions; // Empty array means no permissions
    }
  }
  
  // Otherwise, use role defaults
  return getDefaultPermissionsForRole(user.role) || [];
}

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role and permissions
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(user, permission) {
  // FOUNDER has all permissions
  if (user.role === 'FOUNDER') {
    return true;
  }
  
  const effectivePerms = getEffectivePermissions(user);
  
  // null means all permissions (shouldn't happen for non-FOUNDER, but handle it)
  if (effectivePerms === null) {
    return true;
  }
  
  return effectivePerms.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object with role and permissions
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean} True if user has at least one permission
 */
export function hasAnyPermission(user, permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }
  
  return permissions.some(perm => hasPermission(user, perm));
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object with role
 * @param {string} requiredRole - Role to check
 * @returns {boolean} True if user has the role
 */
export function hasRole(user, requiredRole) {
  return user.role === requiredRole;
}

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object with role
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean} True if user has at least one role
 */
export function hasAnyRole(user, roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return false;
  }
  
  return roles.includes(user.role);
}

// ============================================================================
// Account System Expansion (Phase 6) - Admin Console Functions
// ============================================================================

/**
 * Search users with pagination, filtering, and search
 * @param {Object} options - Search options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} [options.search] - Search term (email, fullName, username)
 * @param {string} [options.role] - Filter by role
 * @param {string} [options.status] - Filter by account status
 * @returns {Promise<Object>} Paginated user list
 */
export async function searchUsers({ page = 1, limit = 20, search, role, status }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  // Build WHERE clause
  if (search) {
    conditions.push('(email LIKE ? OR fullName LIKE ? OR username LIKE ?)');
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (status) {
    // Normalize status before querying
    const normalizedStatus = normalizeAccountStatus(status);
    conditions.push('COALESCE(accountStatus, status) = ?');
    params.push(normalizedStatus);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM User ${whereClause}`,
    params
  );
  const total = countRows[0]?.total || 0;

  // Get paginated results
  const [rows] = await pool.query(
    `SELECT 
      id, email, fullName, username, role,
      COALESCE(accountStatus, status) as accountStatus,
      lastLoginAt, createdAt
    FROM User
    ${whereClause}
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // Normalize account status in results
  rows.forEach(row => {
    if (row.accountStatus) {
      row.accountStatus = normalizeAccountStatus(row.accountStatus);
    }
  });

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update user role
 * @param {number} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserRole(userId, role) {
  const [result] = await pool.query(
    'UPDATE User SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [role, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error('User not found');
  }

  return await getUserProfile(userId);
}

/**
 * Update user account status
 * @param {number} userId - User ID
 * @param {string} accountStatus - New account status (ACTIVE, SUSPENDED, BANNED)
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserStatus(userId, accountStatus) {
  // Normalize status to canonical value
  const normalizedStatus = normalizeAccountStatus(accountStatus);
  
  // Try to update accountStatus column first, fallback to status column
  const [result] = await pool.query(
    `UPDATE User 
     SET accountStatus = ?, 
         status = ?,
         updatedAt = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [normalizedStatus, normalizedStatus, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error('User not found');
  }

  return await getUserProfile(userId);
}

/**
 * Update user feature flags (merge with existing)
 * @param {number} userId - User ID
 * @param {Object} featureFlags - Feature flags to update
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserFeatureFlags(userId, featureFlags) {
  // Get current user
  const user = await getUserProfile(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Merge with existing flags
  const currentFlags = user.featureFlags || {};
  const mergedFlags = { ...currentFlags, ...featureFlags };

  // Update database
  const [result] = await pool.query(
    'UPDATE User SET featureFlags = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [JSON.stringify(mergedFlags), userId]
  );

  if (result.affectedRows === 0) {
    throw new Error('User not found');
  }

  return await getUserProfile(userId);
}

/**
 * Soft delete user account (Phase 9.1)
 * Marks account as deleted without physically removing it
 * @param {number} userId - User ID
 * @param {string} [reason] - Reason for deletion (e.g., 'USER_SELF_DELETE', 'ADMIN_DELETE')
 * @returns {Promise<Object>} Object with deletedAt and reason
 */
export async function softDeleteUserAccount(userId, reason = null) {
  if (!userId) {
    return;
  }

  const deletedAt = new Date();

  await pool.query(
    `
    UPDATE User
    SET status = 'DELETED',
        deletedAt = ?,
        deletedReason = ?
    WHERE id = ?
    `,
    [deletedAt, reason, userId]
  );

  return { deletedAt, reason };
}

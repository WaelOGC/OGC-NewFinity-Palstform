/**
 * Feature Flag Service (Phase 7)
 * 
 * Manages per-user feature flags stored in user_feature_flags table.
 * Merges with legacy User.featureFlags JSON column for backward compatibility.
 */

import pool from '../db.js';
import { FEATURE_FLAGS } from '../config/permissionsMatrix.js';

/**
 * Get all feature flags for a user (from table + legacy JSON column)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Object with flag names as keys and boolean values
 */
export async function getUserFeatureFlags(userId) {
  if (!userId) {
    return {};
  }

  const flags = {};

  try {
    // Get flags from user_feature_flags table
    const [rows] = await pool.query(
      'SELECT flag, enabled FROM user_feature_flags WHERE user_id = ?',
      [userId]
    );

    rows.forEach(row => {
      flags[row.flag] = row.enabled === 1 || row.enabled === true;
    });
  } catch (err) {
    // If table doesn't exist yet, continue to legacy fallback
    if (err.code !== 'ER_NO_SUCH_TABLE') {
      console.error('getUserFeatureFlags error (table):', err);
    }
  }

  // Merge with legacy User.featureFlags JSON column
  try {
    const [userRows] = await pool.query(
      'SELECT featureFlags FROM User WHERE id = ?',
      [userId]
    );

    if (userRows.length > 0 && userRows[0].featureFlags) {
      let legacyFlags = {};
      try {
        legacyFlags = typeof userRows[0].featureFlags === 'string'
          ? JSON.parse(userRows[0].featureFlags)
          : userRows[0].featureFlags;
      } catch (parseErr) {
        console.warn('Failed to parse legacy featureFlags JSON:', parseErr);
      }

      // Merge: table flags take precedence over legacy flags
      Object.assign(flags, legacyFlags, flags);
    }
  } catch (err) {
    // Column might not exist, that's okay
    if (err.code !== 'ER_BAD_FIELD_ERROR') {
      console.error('getUserFeatureFlags error (legacy):', err);
    }
  }

  return flags;
}

/**
 * Check if a feature flag is enabled for a user
 * @param {number} userId - User ID
 * @param {string} flag - Feature flag name
 * @returns {Promise<boolean>} True if flag is enabled
 */
export async function isFeatureEnabled(userId, flag) {
  const flags = await getUserFeatureFlags(userId);
  return flags[flag] === true;
}

/**
 * Set a feature flag for a user (upsert)
 * @param {Object} params - Flag parameters
 * @param {number} params.userId - User ID
 * @param {string} params.flag - Feature flag name
 * @param {boolean} params.enabled - Whether flag is enabled
 * @param {number} [params.updatedBy] - Admin user ID who updated the flag
 * @returns {Promise<Object>} Updated flag record
 */
export async function setFeatureFlag({ userId, flag, enabled, updatedBy = null }) {
  if (!userId || !flag) {
    throw new Error('userId and flag are required');
  }

  if (typeof enabled !== 'boolean') {
    throw new Error('enabled must be a boolean');
  }

  try {
    // Upsert into user_feature_flags table
    const [result] = await pool.query(
      `INSERT INTO user_feature_flags (user_id, flag, enabled, updated_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         enabled = VALUES(enabled),
         updated_by = VALUES(updated_by),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, flag, enabled ? 1 : 0, updatedBy]
    );

    return {
      userId,
      flag,
      enabled,
      updatedBy,
      id: result.insertId || result.affectedRows > 0 ? 'updated' : null,
    };
  } catch (err) {
    // If table doesn't exist, fallback to legacy JSON column
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('user_feature_flags table does not exist. Using legacy featureFlags column.');
      
      // Update legacy column
      const flags = await getUserFeatureFlags(userId);
      flags[flag] = enabled;

      await pool.query(
        'UPDATE User SET featureFlags = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(flags), userId]
      );

      return { userId, flag, enabled, updatedBy, legacy: true };
    }
    throw err;
  }
}

/**
 * Set multiple feature flags for a user in bulk
 * @param {Object} params - Bulk update parameters
 * @param {number} params.userId - User ID
 * @param {Object} params.flagsObject - Object with flag names as keys and boolean values
 * @param {number} [params.updatedBy] - Admin user ID who updated the flags
 * @returns {Promise<Object>} Object with updated flags
 */
export async function bulkSetFeatureFlags({ userId, flagsObject, updatedBy = null }) {
  if (!userId || !flagsObject || typeof flagsObject !== 'object') {
    throw new Error('userId and flagsObject are required');
  }

  const results = {};

  // Set each flag individually (allows for partial success)
  for (const [flag, enabled] of Object.entries(flagsObject)) {
    if (typeof enabled !== 'boolean') {
      console.warn(`Skipping invalid flag value for ${flag}: ${enabled}`);
      continue;
    }

    try {
      await setFeatureFlag({ userId, flag, enabled, updatedBy });
      results[flag] = enabled;
    } catch (err) {
      console.error(`Failed to set flag ${flag}:`, err);
      // Continue with other flags
    }
  }

  return results;
}

// backend/src/services/platformSettingsService.js

/**
 * Platform Settings Service
 * 
 * Manages global platform settings with typed values (boolean, number, string, json).
 * All settings must be defined in PLATFORM_SETTINGS_REGISTRY.
 * 
 * Safety Rules:
 * - Never throws errors
 * - Validates keys against registry
 * - Validates values match declared types
 * - Returns defaults if DB is empty
 * - Uses parameterized SQL
 */

import pool from '../db.js';
import { PLATFORM_SETTINGS_REGISTRY } from '../constants/platformSettings.js';

/**
 * Get all platform settings with current DB values merged over defaults
 * @returns {Promise<Object>} Object mapping keys to resolved values (default if missing)
 */
export async function getAllPlatformSettings() {
  try {
    // Start with defaults from registry
    const settings = {};
    for (const [key, config] of Object.entries(PLATFORM_SETTINGS_REGISTRY)) {
      settings[key] = config.default;
    }

    // Try to fetch from DB
    try {
      const [rows] = await pool.query(
        `SELECT key_name, value_type, value_json 
         FROM platform_settings`
      );

      // Merge DB values over defaults
      for (const row of rows || []) {
        const key = row.key_name;
        
        // Only process keys that exist in registry (ignore orphaned DB rows)
        if (PLATFORM_SETTINGS_REGISTRY[key]) {
          try {
            // Parse JSON value based on type
            let parsedValue = null;
            
            if (row.value_json !== null && row.value_json !== undefined) {
              // If it's already an object, use it; otherwise parse string
              if (typeof row.value_json === 'string') {
                parsedValue = JSON.parse(row.value_json);
              } else {
                parsedValue = row.value_json;
              }
            }
            
            // Use parsed value if available, otherwise keep default
            if (parsedValue !== null) {
              settings[key] = parsedValue;
            }
          } catch (parseError) {
            // If JSON parsing fails, keep default value
            console.warn(`[PlatformSettings] Failed to parse value for ${key}, using default`);
          }
        }
      }
    } catch (dbError) {
      // If table doesn't exist or query fails, return defaults only
      if (dbError.code !== 'ER_NO_SUCH_TABLE') {
        console.error('[PlatformSettings] Error fetching settings from DB:', dbError.message);
      }
    }

    return settings;
  } catch (error) {
    // Defensive: return defaults if anything fails
    console.error('[PlatformSettings] getAllPlatformSettings error:', error);
    const defaults = {};
    for (const [key, config] of Object.entries(PLATFORM_SETTINGS_REGISTRY)) {
      defaults[key] = config.default;
    }
    return defaults;
  }
}

/**
 * Get a single platform setting value
 * @param {string} key - Setting key
 * @returns {Promise<*>} Resolved value (default if missing)
 */
export async function getPlatformSetting(key) {
  try {
    // Check if key exists in registry
    const config = PLATFORM_SETTINGS_REGISTRY[key];
    if (!config) {
      return null; // Key not in registry
    }

    // Try to fetch from DB
    try {
      const [rows] = await pool.query(
        `SELECT value_type, value_json 
         FROM platform_settings 
         WHERE key_name = ?`,
        [key]
      );

      if (rows && rows.length > 0) {
        const row = rows[0];
        try {
          // Parse JSON value
          let parsedValue = null;
          
          if (row.value_json !== null && row.value_json !== undefined) {
            if (typeof row.value_json === 'string') {
              parsedValue = JSON.parse(row.value_json);
            } else {
              parsedValue = row.value_json;
            }
          }
          
          return parsedValue !== null ? parsedValue : config.default;
        } catch (parseError) {
          // If parsing fails, return default
          return config.default;
        }
      }
    } catch (dbError) {
      // If table doesn't exist or query fails, return default
      if (dbError.code !== 'ER_NO_SUCH_TABLE') {
        console.error(`[PlatformSettings] Error fetching setting ${key}:`, dbError.message);
      }
    }

    // Return default if not found in DB
    return config.default;
  } catch (error) {
    // Defensive: return default if anything fails
    console.error(`[PlatformSettings] getPlatformSetting error for ${key}:`, error);
    const config = PLATFORM_SETTINGS_REGISTRY[key];
    return config ? config.default : null;
  }
}

/**
 * Validate a value matches the expected type
 * @param {*} value - Value to validate
 * @param {string} type - Expected type ('boolean', 'number', 'string', 'json')
 * @returns {{valid: boolean, reason?: string}}
 */
function validateValue(value, type) {
  if (type === 'boolean') {
    if (typeof value !== 'boolean') {
      return { valid: false, reason: 'Value must be a boolean' };
    }
  } else if (type === 'number') {
    if (typeof value !== 'number' || !isFinite(value)) {
      return { valid: false, reason: 'Value must be a finite number' };
    }
  } else if (type === 'string') {
    if (typeof value !== 'string') {
      return { valid: false, reason: 'Value must be a string' };
    }
    // Trim and validate length
    const trimmed = value.trim();
    if (trimmed.length > 2000) {
      return { valid: false, reason: 'String value must not exceed 2000 characters' };
    }
  } else if (type === 'json') {
    // Must be an object or array (not null, not primitive)
    if (typeof value !== 'object' || value === null) {
      return { valid: false, reason: 'JSON value must be an object or array' };
    }
  } else {
    return { valid: false, reason: `Unknown type: ${type}` };
  }

  return { valid: true };
}

/**
 * Set a platform setting value
 * @param {Object} params - Parameters
 * @param {string} params.key - Setting key
 * @param {*} params.value - Value to set (must match registry type)
 * @param {number} params.actorUserId - User ID of the actor making the change
 * @returns {Promise<{ok: boolean, key?: string, value?: *, code?: string, reason?: string}>}
 */
export async function setPlatformSetting({ key, value, actorUserId }) {
  try {
    // Validate key exists in registry
    const config = PLATFORM_SETTINGS_REGISTRY[key];
    if (!config) {
      return {
        ok: false,
        code: 'INVALID_KEY',
        reason: `Setting key '${key}' is not defined in registry`,
      };
    }

    // Validate value matches type
    const validation = validateValue(value, config.type);
    if (!validation.valid) {
      return {
        ok: false,
        code: 'INVALID_VALUE',
        reason: validation.reason,
      };
    }

    // Prepare value for storage (normalize string)
    let valueToStore = value;
    if (config.type === 'string') {
      valueToStore = value.trim();
    }

    // Serialize to JSON for storage
    const valueJson = JSON.stringify(valueToStore);

    // Upsert into DB
    try {
      await pool.query(
        `INSERT INTO platform_settings (key_name, value_type, value_json, updated_by_user_id)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           value_type = VALUES(value_type),
           value_json = VALUES(value_json),
           updated_by_user_id = VALUES(updated_by_user_id),
           updated_at = CURRENT_TIMESTAMP`,
        [key, config.type, valueJson, actorUserId || null]
      );

      return {
        ok: true,
        key,
        value: valueToStore,
      };
    } catch (dbError) {
      // Handle table doesn't exist
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        return {
          ok: false,
          code: 'TABLE_NOT_FOUND',
          reason: 'platform_settings table does not exist. Run migration first.',
        };
      }

      console.error('[PlatformSettings] Database error setting platform setting:', dbError);
      return {
        ok: false,
        code: 'DATABASE_ERROR',
        reason: 'Failed to save setting to database',
      };
    }
  } catch (error) {
    // Never throw - return error in result
    console.error('[PlatformSettings] setPlatformSetting error:', error);
    return {
      ok: false,
      code: 'UNEXPECTED_ERROR',
      reason: error.message || 'An unexpected error occurred',
    };
  }
}

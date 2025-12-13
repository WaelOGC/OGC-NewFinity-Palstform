// backend/src/constants/platformSettings.js

/**
 * Platform Settings Registry
 * 
 * Single source of truth for all platform settings keys, types, and default values.
 * Only keys defined in this registry may be read/written via API.
 * 
 * Rules:
 * - All settings must be defined here before use
 * - Types must be one of: 'boolean', 'number', 'string', 'json'
 * - Default values must match the type
 * - Registry is frozen (immutable)
 */

/**
 * Allowed value types for platform settings
 */
export const PLATFORM_SETTING_TYPES = Object.freeze({
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
  JSON: 'json',
});

/**
 * Platform Settings Registry
 * 
 * Defines all allowed settings keys, their types, and default values.
 * Keys not in this registry will be rejected by the API.
 */
export const PLATFORM_SETTINGS_REGISTRY = Object.freeze({
  maintenance_mode: { 
    type: PLATFORM_SETTING_TYPES.BOOLEAN, 
    default: false 
  },
  maintenance_message: { 
    type: PLATFORM_SETTING_TYPES.STRING, 
    default: "We'll be back soon." 
  },
  feature_signup_enabled: { 
    type: PLATFORM_SETTING_TYPES.BOOLEAN, 
    default: true 
  },
  rate_limit_multiplier: { 
    type: PLATFORM_SETTING_TYPES.NUMBER, 
    default: 1 
  },
  security_force_2fa_admins: { 
    type: PLATFORM_SETTING_TYPES.BOOLEAN, 
    default: false 
  },
});

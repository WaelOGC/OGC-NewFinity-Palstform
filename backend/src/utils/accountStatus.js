/**
 * Account Status Normalization Utility
 * 
 * Canonical status values:
 * - PENDING: Registered but not activated / email not verified
 * - ACTIVE: Allowed to login/use platform
 * - DISABLED: Blocked by admin / restricted
 * 
 * This utility ensures all status values are normalized to uppercase canonical values.
 */

/**
 * Normalize account status to canonical uppercase value
 * @param {string|null|undefined} value - Raw status value from DB or input
 * @returns {string} Canonical status: PENDING, ACTIVE, or DISABLED
 */
export function normalizeAccountStatus(value) {
  if (!value || typeof value !== 'string') {
    return 'PENDING';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 'PENDING';
  }

  const upper = trimmed.toUpperCase();

  // Map legacy values to canonical
  const legacyMap = {
    'PENDING_VERIFICATION': 'PENDING',
    'PENDING_VERIFICATION': 'PENDING',
    'PENDING': 'PENDING',
    'ACTIVE': 'ACTIVE',
    'DISABLED': 'DISABLED',
    'SUSPENDED': 'DISABLED', // Map SUSPENDED to DISABLED
    'BANNED': 'DISABLED',   // Map BANNED to DISABLED
    'DELETED': 'DISABLED',  // Map DELETED to DISABLED
  };

  // Check exact match first
  if (legacyMap[upper]) {
    return legacyMap[upper];
  }

  // Check lowercase variants
  const lower = trimmed.toLowerCase();
  if (lower === 'active') return 'ACTIVE';
  if (lower === 'disabled') return 'DISABLED';
  if (lower === 'pending' || lower === 'pending_verification') return 'PENDING';

  // Unknown value - default to PENDING
  return 'PENDING';
}

/**
 * Validate that a status is one of the canonical values
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid canonical status
 */
export function isValidAccountStatus(status) {
  const normalized = normalizeAccountStatus(status);
  return ['PENDING', 'ACTIVE', 'DISABLED'].includes(normalized);
}

/**
 * Check if user can login (status must be ACTIVE)
 * @param {string|null|undefined} status - Account status
 * @returns {boolean} True if user can login
 */
export function canUserLogin(status) {
  return normalizeAccountStatus(status) === 'ACTIVE';
}

/**
 * Canonical status values enum
 */
export const ACCOUNT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
};

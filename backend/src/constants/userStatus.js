/**
 * Canonical User Status Constants
 * 
 * Single source of truth for user status values.
 * These are the only valid statuses for user accounts.
 */

/**
 * Canonical user status values (frozen enum-like object)
 */
export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
});

/**
 * Array of all allowed status values
 */
export const ALLOWED_STATUSES = Object.freeze([
  USER_STATUS.ACTIVE,
  USER_STATUS.SUSPENDED,
  USER_STATUS.BANNED,
]);

/**
 * Check if a value is a valid user status
 * 
 * @param {string|null|undefined} value - Value to validate
 * @returns {boolean} True if value is one of the canonical statuses
 */
export function isValidUserStatus(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const normalized = value.trim().toUpperCase();
  return ALLOWED_STATUSES.includes(normalized);
}

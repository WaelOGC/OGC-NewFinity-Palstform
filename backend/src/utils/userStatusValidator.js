/**
 * User Status Transition Validator
 * 
 * Enforces allowed status transitions with strict rules.
 * Never throws - always returns safe result objects.
 */

import { USER_STATUS, isValidUserStatus } from '../constants/userStatus.js';

/**
 * Validate a status transition from current to next status
 * 
 * Transition rules:
 * - ACTIVE → SUSPENDED ✅
 * - ACTIVE → BANNED ✅
 * - SUSPENDED → ACTIVE ✅
 * - SUSPENDED → BANNED ✅
 * - BANNED → ACTIVE ❌ (not allowed)
 * - BANNED → SUSPENDED ❌ (not allowed)
 * - Same → Same ❌ (reject no-op updates)
 * 
 * @param {string|null|undefined} currentStatus - Current user status
 * @param {string|null|undefined} nextStatus - Desired next status
 * @returns {{ ok: boolean, reason?: string }} Validation result
 */
export function validateUserStatusTransition(currentStatus, nextStatus) {
  // Normalize inputs (case-insensitive, trim whitespace)
  const current = currentStatus ? String(currentStatus).trim().toUpperCase() : null;
  const next = nextStatus ? String(nextStatus).trim().toUpperCase() : null;

  // Validate that next status is a valid canonical status
  if (!isValidUserStatus(next)) {
    return {
      ok: false,
      reason: `Invalid status: "${nextStatus}". Must be one of: ACTIVE, SUSPENDED, BANNED`,
    };
  }

  // If current status is invalid/missing, treat as ACTIVE for transition purposes
  // (but this is a defensive fallback - in practice current should be valid)
  const normalizedCurrent = isValidUserStatus(current) ? current : USER_STATUS.ACTIVE;

  // Reject no-op transitions (same status)
  if (normalizedCurrent === next) {
    return {
      ok: false,
      reason: `Status transition from ${normalizedCurrent} to ${next} is a no-op (same status)`,
    };
  }

  // Define allowed transitions
  const allowedTransitions = {
    [USER_STATUS.ACTIVE]: [USER_STATUS.SUSPENDED, USER_STATUS.BANNED],
    [USER_STATUS.SUSPENDED]: [USER_STATUS.ACTIVE, USER_STATUS.BANNED],
    [USER_STATUS.BANNED]: [], // No transitions allowed from BANNED
  };

  const allowedNextStatuses = allowedTransitions[normalizedCurrent] || [];

  if (!allowedNextStatuses.includes(next)) {
    return {
      ok: false,
      reason: `Transition from ${normalizedCurrent} to ${next} is not allowed. Allowed transitions from ${normalizedCurrent}: ${allowedNextStatuses.join(', ') || 'none'}`,
    };
  }

  return { ok: true };
}

/**
 * Admin Write Action Safety Guards
 * 
 * Provides safety checks for admin write operations (user modifications, etc.)
 * Never throws - always returns safe result objects.
 */

/**
 * Error codes for guard failures
 */
export const GUARD_ERROR_CODES = {
  SELF_MODIFICATION_NOT_ALLOWED: 'SELF_MODIFICATION_NOT_ALLOWED',
  ACTOR_REQUIRED: 'ACTOR_REQUIRED',
};

/**
 * Assert that an actor can modify a target user
 * 
 * Safety rules:
 * - No self-modification: if actor.id === targetUserId → deny
 * - Actor must exist: if no actor or no actor.id → deny
 * 
 * @param {Object} params - Parameters
 * @param {Object} params.actor - Actor user object (must have id)
 * @param {number|string} params.targetUserId - Target user ID to modify
 * @returns {{ ok: boolean, reason?: string, code?: string }} Result object
 */
export function assertCanModifyUser({ actor, targetUserId }) {
  // Actor must exist and have an ID
  if (!actor || !actor.id) {
    return {
      ok: false,
      reason: 'Actor user is required to perform this action',
      code: GUARD_ERROR_CODES.ACTOR_REQUIRED,
    };
  }

  // Normalize IDs for comparison
  const actorId = parseInt(actor.id);
  const targetId = parseInt(targetUserId);

  // Validate IDs are valid numbers
  if (isNaN(actorId) || isNaN(targetId)) {
    return {
      ok: false,
      reason: 'Invalid user ID provided',
      code: GUARD_ERROR_CODES.ACTOR_REQUIRED,
    };
  }

  // Block self-modification
  if (actorId === targetId) {
    return {
      ok: false,
      reason: 'Users cannot modify their own account through admin actions',
      code: GUARD_ERROR_CODES.SELF_MODIFICATION_NOT_ALLOWED,
    };
  }

  return { ok: true };
}

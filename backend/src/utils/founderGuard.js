// backend/src/utils/founderGuard.js

/**
 * Founder Guard Utilities
 * 
 * Provides founder-only access control guards.
 * Never throws - returns result objects instead.
 */

/**
 * Assert that the actor has founder role
 * 
 * @param {Object} actor - User object to check
 * @returns {{ ok: boolean, code?: string, reason?: string }}
 */
export function assertFounder(actor) {
  if (!actor) {
    return { 
      ok: false, 
      code: 'FOUNDER_ONLY', 
      reason: 'Founder access required' 
    };
  }

  const role = (actor.role || '').toLowerCase();
  if (role !== 'founder') {
    return { 
      ok: false, 
      code: 'FOUNDER_ONLY', 
      reason: 'Founder access required' 
    };
  }

  return { ok: true };
}

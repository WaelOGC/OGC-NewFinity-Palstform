// backend/src/utils/roleGuards.js

/**
 * Role Guard Utilities
 * 
 * Defensive, non-throwing validation helpers for role assignment.
 * All functions return result objects: { ok: true } or { ok: false, code, reason }
 * 
 * A2.1: Authoritative backend role assignment rules
 */

import { ROLE_HIERARCHY, getRoleRank } from '../constants/roles.js';

/**
 * Error codes for role validation
 */
export const ROLE_ERROR_CODES = {
  INVALID_ROLE: 'INVALID_ROLE',
  INSUFFICIENT_ROLE_LEVEL: 'INSUFFICIENT_ROLE_LEVEL',
  SELF_ROLE_CHANGE_NOT_ALLOWED: 'SELF_ROLE_CHANGE_NOT_ALLOWED',
  ACTOR_REQUIRED: 'ACTOR_REQUIRED',
};

/**
 * Assert that a role is valid (exists in ROLE_HIERARCHY)
 * 
 * @param {string} role - Role to validate
 * @returns {{ ok: true } | { ok: false, code: string, reason: string }}
 */
export function assertValidRole(role) {
  if (!role || typeof role !== 'string') {
    return {
      ok: false,
      code: ROLE_ERROR_CODES.INVALID_ROLE,
      reason: 'Role must be a non-empty string',
    };
  }

  const normalizedRole = role.toLowerCase().trim();
  if (normalizedRole === '') {
    return {
      ok: false,
      code: ROLE_ERROR_CODES.INVALID_ROLE,
      reason: 'Role cannot be empty',
    };
  }

  if (!ROLE_HIERARCHY.includes(normalizedRole)) {
    return {
      ok: false,
      code: ROLE_ERROR_CODES.INVALID_ROLE,
      reason: `Role "${normalizedRole}" is not in the role hierarchy. Valid roles: ${ROLE_HIERARCHY.join(', ')}`,
    };
  }

  return { ok: true };
}

/**
 * Assert that an actor can assign a role to a target user
 * 
 * Rules:
 * 1. Actor must exist
 * 2. Role must exist in ROLE_HIERARCHY
 * 3. Actor rank must be higher than newRole
 * 4. Actor rank must be higher or equal to target's current role
 * 5. Actor cannot downgrade themselves if it would remove their own highest role
 * 
 * @param {Object} params - Parameters
 * @param {Object} params.actor - Actor user object (must have id and role)
 * @param {Object} params.targetUser - Target user object (must have id and role)
 * @param {string} params.newRole - New role to assign (will be normalized)
 * @returns {{ ok: true } | { ok: false, code: string, reason: string }}
 */
export function assertCanAssignRole({ actor, targetUser, newRole }) {
  // Rule 1: Actor must exist
  if (!actor || !actor.id) {
    return {
      ok: false,
      code: ROLE_ERROR_CODES.ACTOR_REQUIRED,
      reason: 'Actor is required',
    };
  }

  // Rule 2: Role must be valid
  const roleValidation = assertValidRole(newRole);
  if (!roleValidation.ok) {
    return roleValidation;
  }

  const normalizedNewRole = newRole.toLowerCase().trim();

  // Get actor's role (normalize and get rank)
  if (!actor.role || typeof actor.role !== 'string') {
    return {
      ok: false,
      code: ROLE_ERROR_CODES.INSUFFICIENT_ROLE_LEVEL,
      reason: 'Actor must have a valid role',
    };
  }

  const normalizedActorRole = actor.role.toLowerCase().trim();
  const actorRank = getRoleRank(normalizedActorRole);
  
  if (actorRank === -1) {
    return {
      ok: false,
      code: ROLE_ERROR_CODES.INSUFFICIENT_ROLE_LEVEL,
      reason: `Actor role "${normalizedActorRole}" is not in the role hierarchy`,
    };
  }

  // Get target's current role (normalize and get rank)
  const normalizedTargetRole = (targetUser?.role || '').toLowerCase().trim();
  const targetRank = normalizedTargetRole ? getRoleRank(normalizedTargetRole) : -1;
  
  // If target has a role that's not in hierarchy, treat as lowest rank
  const effectiveTargetRank = targetRank === -1 ? ROLE_HIERARCHY.length : targetRank;

  // Get new role rank
  const newRoleRank = getRoleRank(normalizedNewRole);

  // Rule 5: Actor cannot downgrade themselves if it would remove their own highest role
  // Check this FIRST before other rules, as self-assignment has special logic
  if (actor.id === targetUser?.id) {
    // Self-assignment: check if this would downgrade the actor
    if (newRoleRank > actorRank) {
      // New role has lower rank (higher index) = downgrade
      return {
        ok: false,
        code: ROLE_ERROR_CODES.SELF_ROLE_CHANGE_NOT_ALLOWED,
        reason: `Actor cannot downgrade themselves from "${normalizedActorRole}" to "${normalizedNewRole}". This would remove their ability to manage roles.`,
      };
    }
    
    // Also check if they're trying to assign themselves a role equal to their current role
    // This is a no-op, but we'll allow it (it's harmless)
    if (newRoleRank === actorRank && normalizedNewRole === normalizedActorRole) {
      // No-op: same role, but we'll allow it
      return { ok: true };
    }
    
    // For self-assignment upgrades (newRoleRank < actorRank), we allow it
    // Skip Rule 4 for self-assignment as it's handled by Rule 5
  } else {
    // Rule 4: Actor rank must be higher than target's current role (only for other users)
    if (actorRank >= effectiveTargetRank) {
      return {
        ok: false,
        code: ROLE_ERROR_CODES.INSUFFICIENT_ROLE_LEVEL,
        reason: `Actor with role "${normalizedActorRole}" (rank ${actorRank}) cannot modify user with role "${normalizedTargetRole || 'none'}" (rank ${effectiveTargetRank}). Actor must have a higher rank than the target user's current role.`,
      };
    }
  }

  // Rule 3: Actor rank must be higher than newRole
  if (actorRank >= newRoleRank) {
    return {
      ok: false,
      code: ROLE_ERROR_CODES.INSUFFICIENT_ROLE_LEVEL,
      reason: `Actor with role "${normalizedActorRole}" (rank ${actorRank}) cannot assign role "${normalizedNewRole}" (rank ${newRoleRank}). Actor must have a higher rank than the role being assigned.`,
    };
  }

  return { ok: true };
}

// backend/src/constants/roles.js

/**
 * Role Hierarchy Constants
 * 
 * Defines the authoritative role hierarchy for admin user management.
 * Roles are ordered from highest to lowest authority.
 * 
 * A2.1: Authoritative backend role assignment rules
 */

/**
 * Role hierarchy (ordered from highest to lowest)
 * 
 * - founder: Highest authority, absolute control
 * - admin: Administrative access with write permissions
 * - support: Limited read-only access to user management
 * - viewer: Read-only access to user management
 */
export const ROLE_HIERARCHY = Object.freeze([
  'founder',
  'admin',
  'support',
  'viewer',
]);

/**
 * Get the rank of a role in the hierarchy
 * 
 * Lower index = higher rank (more authority)
 * Returns -1 if role is not in hierarchy
 * 
 * @param {string} role - Role name (case-insensitive)
 * @returns {number} Rank index (0 = highest, -1 = not found)
 */
export function getRoleRank(role) {
  if (!role || typeof role !== 'string') {
    return -1;
  }
  
  const normalizedRole = role.toLowerCase().trim();
  return ROLE_HIERARCHY.indexOf(normalizedRole);
}

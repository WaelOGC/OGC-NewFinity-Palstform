/**
 * Role-Based Permissions Configuration
 * 
 * Defines default permissions for each role as specified in Phase 4 spec.
 * FOUNDER has all permissions implicitly (no explicit list needed).
 */

// Admin roles that have access to the admin console
export const ADMIN_ROLES = ['FOUNDER', 'CORE_TEAM', 'ADMIN'];

export const ROLE_PERMISSIONS = {
  FOUNDER: null, // null means all permissions (checked explicitly in code)
  CORE_TEAM: [
    'MANAGE_USERS',
    'MANAGE_ROLES',
    'MANAGE_CONTENT',
    'MANAGE_TOKENS',
    'VIEW_ADMIN_DASHBOARD',
    'VIEW_FINANCIAL_REPORTS',
    'MANAGE_PLATFORM_SETTINGS',
    'USE_INTERNAL_TOOLS',
    'MANAGE_FEATURE_FLAGS',
    'VIEW_AUDIT_LOGS',
    'EXPORT_USER_DATA',
    'MANAGE_INTEGRATIONS',
    'CREATE_TOKENS',
    'PUBLISH_CONTENT',
    'COMMENT_ON_CONTENT',
  ],
  ADMIN: [
    'MANAGE_USERS',
    'MANAGE_CONTENT',
    'VIEW_ADMIN_DASHBOARD',
    'VIEW_AUDIT_LOGS',
    'EXPORT_USER_DATA',
    'PUBLISH_CONTENT',
    'COMMENT_ON_CONTENT',
  ],
  MODERATOR: [
    'MANAGE_CONTENT',
    'PUBLISH_CONTENT',
    'COMMENT_ON_CONTENT',
  ],
  CREATOR: [
    'CREATE_TOKENS',
    'PUBLISH_CONTENT',
    'COMMENT_ON_CONTENT',
  ],
  STANDARD_USER: [
    'PUBLISH_CONTENT',
    'COMMENT_ON_CONTENT',
  ],
  SUSPENDED: [],
  BANNED: [],
};

/**
 * Get default permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permission strings
 */
export function getDefaultPermissionsForRole(role) {
  if (role === 'FOUNDER') {
    // FOUNDER has all permissions implicitly
    return null; // null means "all permissions"
  }
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.STANDARD_USER;
}

/**
 * Check if a role has a specific permission (considering role defaults)
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
export function roleHasPermission(role, permission) {
  if (role === 'FOUNDER') {
    return true; // FOUNDER has all permissions
  }
  const defaultPerms = getDefaultPermissionsForRole(role);
  return defaultPerms && defaultPerms.includes(permission);
}

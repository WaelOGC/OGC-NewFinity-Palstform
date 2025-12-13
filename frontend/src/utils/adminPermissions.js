// frontend/src/utils/adminPermissions.js

/**
 * Admin Permission Utilities (Frontend)
 * 
 * Provides permission checking functions for admin UI components.
 * Mirrors backend permission logic for client-side UI control.
 */

// Permission constants (must match backend)
export const ADMIN_USERS_READ = 'ADMIN_USERS_READ';
export const ADMIN_USERS_WRITE = 'ADMIN_USERS_WRITE'; // Placeholder for future use
export const ADMIN_AUDIT_LOGS_READ = 'ADMIN_AUDIT_LOGS_READ'; // Placeholder for future use
export const ADMIN_ROLES_READ = 'ADMIN_ROLES_READ';
export const ADMIN_SETTINGS_READ = 'ADMIN_SETTINGS_READ';
export const ADMIN_SETTINGS_WRITE = 'ADMIN_SETTINGS_WRITE';
export const SYSTEM_HEALTH_READ = 'SYSTEM_HEALTH_READ';
export const SYSTEM_JOBS_READ = 'SYSTEM_JOBS_READ';
export const SYSTEM_JOBS_WRITE = 'SYSTEM_JOBS_WRITE';
export const ADMIN_SESSIONS_READ = 'ADMIN_SESSIONS_READ';
export const ADMIN_SESSIONS_WRITE = 'ADMIN_SESSIONS_WRITE';

/**
 * Role to permissions mapping (matches backend logic)
 */
const ROLE_PERMISSIONS_MAP = {
  // Founder has all permissions
  founder: null, // null means all permissions
  
  // Admin has all read permissions
  admin: [
    ADMIN_USERS_READ,
    ADMIN_AUDIT_LOGS_READ,
    ADMIN_ROLES_READ,
    ADMIN_SETTINGS_READ,
    SYSTEM_HEALTH_READ,
    SYSTEM_JOBS_READ,
    SYSTEM_JOBS_WRITE,
    ADMIN_SESSIONS_READ,
    ADMIN_SESSIONS_WRITE,
  ],
  
  // Support has users read only
  support: [
    ADMIN_USERS_READ,
  ],
  
  // Viewer has users read only
  viewer: [
    ADMIN_USERS_READ,
  ],
};

/**
 * Check if a user has a specific admin permission
 * 
 * Supports both:
 * - user.role (string) - single role
 * - user.roles (array) - multiple roles
 * 
 * @param {Object} user - User object from AuthContext
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasAdminPermission(user, permission) {
  if (!user || !permission) {
    return false;
  }

  // Get roles from user (support both role and roles)
  const roles = [];
  if (user.role) {
    roles.push(user.role);
  }
  if (Array.isArray(user.roles)) {
    roles.push(...user.roles);
  }

  // If no roles, no permissions
  if (roles.length === 0) {
    return false;
  }

  // Check each role
  for (const role of roles) {
    const roleLower = (role || '').toLowerCase();
    
    // Founder has all permissions
    if (roleLower === 'founder') {
      return true;
    }
    
    // Check role's default permissions
    const rolePerms = ROLE_PERMISSIONS_MAP[roleLower];
    if (rolePerms === null) {
      // null means all permissions
      return true;
    }
    if (Array.isArray(rolePerms) && rolePerms.includes(permission)) {
      return true;
    }
  }

  // Also check if user has explicit permissions array
  if (Array.isArray(user.permissions) && user.permissions.includes(permission)) {
    return true;
  }

  return false;
}

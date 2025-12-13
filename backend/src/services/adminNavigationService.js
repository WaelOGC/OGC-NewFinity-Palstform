// backend/src/services/adminNavigationService.js

/**
 * Admin Navigation Service
 * 
 * Generates navigation structure for admin dashboard based on module registry
 * and user permissions.
 */

import { ADMIN_MODULES } from '../config/adminModuleRegistry.js';
import { ADMIN_ROLES } from '../config/rolePermissions.js';
import { hasAnyPermission } from './userService.js';

/**
 * Check if user has admin access (role or permission)
 * Reuses same logic as requireAdmin middleware
 * 
 * @param {Object} user - User object with role and effectivePermissions
 * @returns {boolean} - True if user has admin access
 */
function hasAdminAccess(user) {
  if (!user) return false;

  // Check admin role
  const userRole = user?.role || '';
  const roleUpper = (userRole || '').toUpperCase();
  const hasAdminRole = 
    ADMIN_ROLES.some(adminRole => roleUpper.includes(adminRole.toUpperCase())) ||
    roleUpper.includes('ADMIN');

  // Check admin permissions
  const hasAdminPermission = hasAnyPermission(user, ['VIEW_ADMIN_DASHBOARD', 'MANAGE_USERS']);

  return hasAdminRole || hasAdminPermission;
}

/**
 * Check if user has required permissions for a module
 * 
 * @param {Object} user - User object
 * @param {Array<string>} requiredPermissions - Array of required permissions/roles
 * @returns {boolean} - True if user has required permissions
 */
function hasModulePermission(user, requiredPermissions) {
  if (!user || !requiredPermissions || requiredPermissions.length === 0) {
    return false;
  }

  // If permissions array includes generic "ADMIN", check admin access
  if (requiredPermissions.includes('ADMIN')) {
    return hasAdminAccess(user);
  }

  // Check specific roles
  const userRole = (user?.role || '').toUpperCase();
  const hasRequiredRole = requiredPermissions.some(perm => 
    userRole.includes(perm.toUpperCase())
  );

  // Check specific permissions
  const hasRequiredPermission = hasAnyPermission(user, requiredPermissions);

  return hasRequiredRole || hasRequiredPermission;
}

/**
 * Convert navGroup to groupId (kebab-case)
 * 
 * @param {string} navGroup - Navigation group name
 * @returns {string} - Group ID in kebab-case
 */
function navGroupToId(navGroup) {
  return navGroup
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Get admin navigation structure for a user
 * 
 * @param {Object} user - User object (must have role and effectivePermissions)
 * @param {Object} options - Options
 * @param {boolean} options.showPlanned - Whether to include planned modules (default: from env)
 * @returns {Object} - Navigation structure
 */
export function getAdminNavigationForUser(user, options = {}) {
  // Determine if we should show planned modules
  const showPlanned = options.showPlanned ?? 
    (process.env.ADMIN_SHOW_PLANNED === 'true');

  // Filter modules by status
  let filteredModules = ADMIN_MODULES.filter(module => {
    if (module.status === 'active') return true;
    if (module.status === 'planned' && showPlanned) return true;
    return false;
  });

  // Filter modules by permissions
  filteredModules = filteredModules.filter(module => {
    return hasModulePermission(user, module.permissions);
  });

  // Group modules by navGroup
  const groupsMap = new Map();

  filteredModules.forEach(module => {
    const groupId = navGroupToId(module.navGroup);
    
    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        groupId,
        groupLabel: module.navGroup,
        items: [],
      });
    }

    const group = groupsMap.get(groupId);
    group.items.push({
      id: module.id,
      label: module.name,
      uiRoute: module.uiRoute,
      status: module.status,
    });
  });

  // Convert map to array and sort groups by registry order
  const navGroups = Array.from(groupsMap.values());

  // Sort items within each group by registry order (maintain original order)
  navGroups.forEach(group => {
    group.items.sort((a, b) => {
      const aIndex = ADMIN_MODULES.findIndex(m => m.id === a.id);
      const bIndex = ADMIN_MODULES.findIndex(m => m.id === b.id);
      return aIndex - bIndex;
    });
  });

  return {
    groups: navGroups,
    meta: {
      generatedAt: new Date().toISOString(),
      showPlanned,
    },
  };
}

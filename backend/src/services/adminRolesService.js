// backend/src/services/adminRolesService.js

/**
 * Admin Roles Service
 * 
 * Read-only service for retrieving role definitions and permission mappings.
 * Source of truth: ROLE_PERMISSIONS in constants/rolePermissions.js
 */

import { getRolePermissions } from './rolePermissionsService.js';

/**
 * Role definitions with labels and descriptions
 */
const ROLE_DEFINITIONS = {
  founder: {
    id: 'founder',
    label: 'Founder',
    description: 'Has all permissions. Full system access.',
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    description: 'Administrative access with read permissions for users, audit logs, and roles management.',
  },
  support: {
    id: 'support',
    label: 'Support',
    description: 'Limited read-only access to user management.',
  },
  viewer: {
    id: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to user management.',
  },
};

/**
 * Get roles overview with permissions
 * 
 * @returns {Object} Object containing roles array with id, label, description, and permissions
 */
export async function getRolesOverview() {
  const roles = [];
  const rolePermissions = getRolePermissions();

  // Iterate through each role in the permissions map
  for (const [roleId, permissions] of Object.entries(rolePermissions)) {
    const definition = ROLE_DEFINITIONS[roleId] || {
      id: roleId,
      label: roleId.charAt(0).toUpperCase() + roleId.slice(1),
      description: `Role: ${roleId}`,
    };

    // If permissions is null, founder has all permissions
    if (permissions === null) {
      roles.push({
        id: definition.id,
        label: definition.label,
        description: definition.description,
        permissions: ['*'], // Special marker for "all permissions"
      });
    } else {
      // Return array of permission strings
      roles.push({
        id: definition.id,
        label: definition.label,
        description: definition.description,
        permissions: Array.isArray(permissions) ? [...permissions] : [],
      });
    }
  }

  // Sort roles: founder first, then alphabetically
  roles.sort((a, b) => {
    if (a.id === 'founder') return -1;
    if (b.id === 'founder') return 1;
    return a.label.localeCompare(b.label);
  });

  return { roles };
}

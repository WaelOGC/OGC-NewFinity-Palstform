// backend/src/constants/criticalPermissions.js

/**
 * Critical Permissions (Non-Removable)
 * 
 * These permissions must always exist in at least one role.
 * They cannot be removed from all roles, as this would cause system lockout.
 * 
 * Rules:
 * - Every permission in this list must exist in at least one role
 * - Attempts to remove the last instance of a critical permission are blocked
 * - Used by role editing validation
 */

import { PERMISSIONS } from './permissions.js';

export const CRITICAL_PERMISSIONS = Object.freeze([
  PERMISSIONS.ADMIN_USERS_READ,
  PERMISSIONS.ADMIN_USERS_WRITE,
  PERMISSIONS.ADMIN_ROLES_READ,
]);

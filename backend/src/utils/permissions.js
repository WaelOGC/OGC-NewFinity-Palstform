// backend/src/utils/permissions.js

/**
 * Permission Utilities
 * 
 * Provides permission checking functions and middleware for admin endpoints.
 * Supports both role-based and permission-based access control.
 * 
 * Uses the authoritative permission registry from constants/permissions.js
 * and role-permission mapping from constants/rolePermissions.js
 */

import { getRolePermissions } from '../services/rolePermissionsService.js';
import { fail } from './apiResponse.js';

/**
 * Check if a user has a specific permission
 * 
 * Supports both:
 * - user.role (string) - single role
 * - user.roles (array) - multiple roles
 * 
 * @param {Object} user - User object with role/roles
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(user, permission) {
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

  // Get current role permissions (from mutable service)
  const rolePermissions = getRolePermissions();

  // Check each role
  for (const role of roles) {
    const roleLower = (role || '').toLowerCase();
    
    // Get role's permissions from authoritative mapping
    const rolePerms = rolePermissions[roleLower];
    
    // null means unrestricted (founder only)
    if (rolePerms === null) {
      return true;
    }
    
    // Check if role has explicit permission
    if (Array.isArray(rolePerms) && rolePerms.includes(permission)) {
      return true;
    }
    
    // Unknown roles = no permissions (already handled by undefined check)
  }

  // Also check if user has explicit permissions array
  if (Array.isArray(user.permissions) && user.permissions.includes(permission)) {
    return true;
  }

  // Also check effectivePermissions if available
  if (Array.isArray(user.effectivePermissions) && user.effectivePermissions.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Middleware factory to require a specific permission
 * 
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware function
 */
export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return fail(res, {
          code: 'AUTH_REQUIRED',
          message: 'You must be logged in.',
          details: {},
        }, 401);
      }

      // Get user with full data (role/permissions) if not already loaded
      let user = req.currentUser || req.user;
      
      // Load user data if role/permissions not available
      if (!user.role && !user.roles && !user.effectivePermissions) {
        const { getUserWithAccessData } = await import('../services/userService.js');
        user = await getUserWithAccessData(req.user.id);
        if (!user) {
          return fail(res, {
            code: 'AUTH_REQUIRED',
            message: 'You must be logged in.',
            details: {},
          }, 401);
        }
        req.currentUser = user;
      }

      // Check permission
      if (!hasPermission(user, permission)) {
        return fail(res, {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to access this resource.',
          details: {
            requiredPermission: permission,
          },
        }, 403);
      }

      // Attach user to request for downstream handlers
      req.currentUser = user;
      next();
    } catch (error) {
      console.error('requirePermission middleware error:', error, { requestId: req.requestId });
      return fail(res, {
        code: 'PERMISSION_CHECK_FAILED',
        message: 'Internal server error while checking permissions',
        details: {},
      }, 500);
    }
  };
}

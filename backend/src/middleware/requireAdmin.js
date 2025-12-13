// backend/src/middleware/requireAdmin.js

/**
 * Require Admin Access Middleware
 * Ensures user has admin-level access (role containing ADMIN or equivalent)
 * Returns consistent JSON error responses using apiResponse
 */

import { fail } from '../utils/apiResponse.js';
import { ADMIN_ROLES } from '../config/rolePermissions.js';

/**
 * Middleware to require admin access
 * Checks if user's role contains "ADMIN" (case-insensitive) or is in ADMIN_ROLES
 * Also supports permission-based access (VIEW_ADMIN_DASHBOARD, MANAGE_USERS)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export async function requireAdmin(req, res, next) {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return fail(res, {
        code: 'AUTH_REQUIRED',
        message: 'You must be logged in.',
        details: {},
      }, 401);
    }

    // Load full user data with role/permissions if not already loaded
    const { getUserWithAccessData, hasAnyRole, hasAnyPermission } = await import('../services/userService.js');
    
    let user = req.currentUser || req.user;
    if (!user.role && !user.roles && !user.effectivePermissions) {
      user = await getUserWithAccessData(req.user.id);
      if (!user) {
        return fail(res, {
          code: 'AUTH_REQUIRED',
          message: 'You must be logged in.',
          details: {},
        }, 401);
      }
    }
    
    // Admin email fallback: If user email is admin@ogc.local and no role is set,
    // assign founder role in-memory (do NOT write to DB)
    const ADMIN_EMAIL = 'admin@ogc.local';
    if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if ((!user.role || user.role === 'STANDARD_USER') && (!user.roles || user.roles.length === 0)) {
        user.role = 'FOUNDER';
        user.roles = ['FOUNDER'];
      }
    }

    // Check if user has admin role (role containing ADMIN case-insensitive) OR admin permission
    // Support both user.role (string) and user.roles (array)
    const userRoles = [];
    if (user?.role) {
      userRoles.push(user.role);
    }
    if (Array.isArray(user?.roles)) {
      userRoles.push(...user.roles);
    }
    
    const roleUpper = userRoles.map(r => (r || '').toUpperCase());
    const hasAdminRole = 
      ADMIN_ROLES.some(adminRole => roleUpper.some(r => r.includes(adminRole.toUpperCase()))) ||
      roleUpper.some(r => r.includes('ADMIN')) ||
      roleUpper.includes('FOUNDER');
    
    const hasAdminPermission = hasAnyPermission(user, ['VIEW_ADMIN_DASHBOARD', 'MANAGE_USERS']);

    if (!hasAdminRole && !hasAdminPermission) {
      return fail(res, {
        code: 'ADMIN_REQUIRED',
        message: 'You do not have permission to access this resource. Admin access required.',
        details: {},
      }, 403);
    }

    // Attach full user data to request for downstream handlers
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('requireAdmin middleware error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'ADMIN_CHECK_FAILED',
      message: 'Internal server error while checking admin access',
      details: {},
    }, 500);
  }
}

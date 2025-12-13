/**
 * Access Control Middleware (Phase 7)
 * 
 * Provides role-based and permission-based access control for routes.
 * All middleware functions require that requireAuth has already been called
 * to populate req.user with user data.
 * 
 * Updated to use new roleService (multi-role support) and adminAuditLogService.
 */

import {
  hasPermission,
  hasAnyPermission,
  getUserWithAccessData,
} from '../services/userService.js';
import { recordUserActivity } from '../services/userService.js';
import { userHasRole, userHasAnyRole, getUserRoles, getPrimaryRole } from '../services/roleService.js';
import { isFeatureEnabled } from '../services/featureFlagService.js';
import { logAdminAction } from '../services/adminAuditLogService.js';

/**
 * Require user to have a specific role
 * @param {string} requiredRole - Required role
 * @returns {Function} Express middleware function
 */
export function requireRole(requiredRole) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'ERROR',
          message: 'Authentication required',
        });
      }

      // Load full user data with role/permissions if not already loaded
      let user = req.user;
      if (!user.role) {
        user = await getUserWithAccessData(req.user.id);
        if (!user) {
          return res.status(401).json({
            status: 'ERROR',
            message: 'User not found',
          });
        }
        // Update req.user with full data
        req.user = user;
      }

      // Check role using new roleService (supports multi-role + expiry)
      const userRoles = await getUserRoles(user.id);
      const hasRequiredRole = userRoles.includes(requiredRole);
      
      // Fallback to legacy single role check if new service returns empty
      const effectiveRole = userRoles.length > 0 ? getPrimaryRole(userRoles) : (user.role || null);
      const hasLegacyRole = effectiveRole === requiredRole;

      if (!hasRequiredRole && !hasLegacyRole) {
        // Log access denied to admin audit log
        const actorRole = effectiveRole || user.role || 'UNKNOWN';
        await logAdminAction({
          actorId: user.id,
          actorRole,
          action: 'ACCESS_DENIED',
          targetType: 'ENDPOINT',
          targetId: req.path,
          metadata: {
            reason: 'Insufficient role',
            requiredRole,
            userRoles,
            effectiveRole,
            endpoint: req.path,
            method: req.method,
          },
          req,
        }).catch(err => console.error('Failed to log access denied to admin audit:', err));

        // Also log to user activity log (legacy)
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Insufficient role',
            requiredRole,
            userRole: effectiveRole,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          code: 'ADMIN_REQUIRED',
          message: 'You do not have permission to access this resource.',
          details: {
            requiredRole,
            userRole: effectiveRole,
          },
        });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('requireRole middleware error:', error);
      return res.status(500).json({
        status: 'ERROR',
        message: 'Internal server error',
      });
    }
  };
}

/**
 * Require user to have any of the specified roles
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export function requireAnyRole(roles) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'ERROR',
          message: 'Authentication required',
        });
      }

      // Load full user data with role/permissions if not already loaded
      let user = req.user;
      if (!user.role) {
        user = await getUserWithAccessData(req.user.id);
        if (!user) {
          return res.status(401).json({
            status: 'ERROR',
            message: 'User not found',
          });
        }
        req.user = user;
      }

      // Check roles using new roleService (supports multi-role + expiry)
      const userRoles = await getUserRoles(user.id);
      const hasAnyRequiredRole = await userHasAnyRole(user.id, roles);
      
      // Fallback to legacy single role check if new service returns empty
      const effectiveRole = userRoles.length > 0 ? getPrimaryRole(userRoles) : (user.role || null);
      const hasLegacyRole = effectiveRole && roles.includes(effectiveRole);

      if (!hasAnyRequiredRole && !hasLegacyRole) {
        // Log access denied to admin audit log
        const actorRole = effectiveRole || user.role || 'UNKNOWN';
        await logAdminAction({
          actorId: user.id,
          actorRole,
          action: 'ACCESS_DENIED',
          targetType: 'ENDPOINT',
          targetId: req.path,
          metadata: {
            reason: 'Insufficient role',
            requiredRoles: roles,
            userRoles,
            effectiveRole,
            endpoint: req.path,
            method: req.method,
          },
          req,
        }).catch(err => console.error('Failed to log access denied to admin audit:', err));

        // Also log to user activity log (legacy)
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Insufficient role',
            requiredRoles: roles,
            userRole: effectiveRole,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          code: 'ADMIN_REQUIRED',
          message: 'You do not have permission to access this resource.',
          details: {
            requiredRoles: roles,
            userRole: effectiveRole,
          },
        });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('requireAnyRole middleware error:', error);
      return res.status(500).json({
        status: 'ERROR',
        message: 'Internal server error',
      });
    }
  };
}

/**
 * Require user to have a specific permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware function
 */
export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'ERROR',
          code: 'AUTH_REQUIRED',
          message: 'You must be logged in.',
        });
      }

      // Load full user data with role/permissions if not already loaded
      let user = req.user;
      if (!user.role) {
        user = await getUserWithAccessData(req.user.id);
        if (!user) {
          return res.status(401).json({
            status: 'ERROR',
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          });
        }
        req.user = user;
      }

      if (!hasPermission(user, permission)) {
        // Get user roles for audit log
        const userRoles = await getUserRoles(user.id);
        const effectiveRole = userRoles.length > 0 ? getPrimaryRole(userRoles) : (user.role || 'UNKNOWN');
        
        // Log access denied to admin audit log
        await logAdminAction({
          actorId: user.id,
          actorRole: effectiveRole,
          action: 'ACCESS_DENIED',
          targetType: 'ENDPOINT',
          targetId: req.path,
          metadata: {
            reason: 'Missing permission',
            requiredPermission: permission,
            userRoles,
            effectiveRole,
            endpoint: req.path,
            method: req.method,
          },
          req,
        }).catch(err => console.error('Failed to log access denied to admin audit:', err));

        // Also log to user activity log (legacy)
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Missing permission',
            requiredPermission: permission,
            userRole: effectiveRole,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource.',
          details: {
            requiredPermission: permission,
            userRole: effectiveRole,
          },
        });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('requirePermission middleware error:', error);
      return res.status(500).json({
        status: 'ERROR',
        message: 'Internal server error',
      });
    }
  };
}

/**
 * Require user to have at least one of the specified permissions
 * @param {string[]} requiredPermissions - Array of permissions (user needs at least one)
 * @returns {Function} Express middleware function
 */
export function requireAnyPermission(requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'ERROR',
          code: 'AUTH_REQUIRED',
          message: 'You must be logged in.',
        });
      }

      // Load full user data with role/permissions if not already loaded
      let user = req.user;
      if (!user.role) {
        user = await getUserWithAccessData(req.user.id);
        if (!user) {
          return res.status(401).json({
            status: 'ERROR',
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          });
        }
        req.user = user;
      }

      if (!hasAnyPermission(user, requiredPermissions)) {
        // Get user roles for audit log
        const userRoles = await getUserRoles(user.id);
        const effectiveRole = userRoles.length > 0 ? getPrimaryRole(userRoles) : (user.role || 'UNKNOWN');
        
        // Log access denied to admin audit log
        await logAdminAction({
          actorId: user.id,
          actorRole: effectiveRole,
          action: 'ACCESS_DENIED',
          targetType: 'ENDPOINT',
          targetId: req.path,
          metadata: {
            reason: 'Missing required permissions',
            requiredPermissions,
            userRoles,
            effectiveRole,
            endpoint: req.path,
            method: req.method,
          },
          req,
        }).catch(err => console.error('Failed to log access denied to admin audit:', err));

        // Also log to user activity log (legacy)
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Missing required permissions',
            requiredPermissions,
            userRole: effectiveRole,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource.',
          details: {
            requiredPermissions,
            userRole: effectiveRole,
          },
        });
      }

      req.currentUser = user;
      next();
    } catch (error) {
      console.error('requireAnyPermission middleware error:', error);
      return res.status(500).json({
        status: 'ERROR',
        message: 'Internal server error',
      });
    }
  };
}

/**
 * Require user to have a specific feature flag enabled
 * @param {string} flagName - Feature flag name
 * @returns {Function} Express middleware function
 */
export function requireFeatureFlag(flagName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'ERROR',
          message: 'Authentication required',
        });
      }

      // Load full user data with role/permissions/flags if not already loaded
      let user = req.user;
      if (!user.role || !user.featureFlags) {
        user = await getUserWithAccessData(req.user.id);
        if (!user) {
          return res.status(401).json({
            status: 'ERROR',
            message: 'User not found',
          });
        }
        req.user = user;
      }

      // Check feature flag using new featureFlagService (supports table + legacy JSON)
      const flagEnabled = await isFeatureEnabled(user.id, flagName);
      
      // Fallback to legacy featureFlags if new service fails
      const legacyFlagValue = user.featureFlags?.[flagName];
      const hasFlag = flagEnabled || legacyFlagValue === true;

      if (!hasFlag) {
        // Get user roles for audit log
        const userRoles = await getUserRoles(user.id);
        const effectiveRole = userRoles.length > 0 ? getPrimaryRole(userRoles) : (user.role || 'UNKNOWN');
        
        // Log access denied to admin audit log
        await logAdminAction({
          actorId: user.id,
          actorRole: effectiveRole,
          action: 'ACCESS_DENIED',
          targetType: 'ENDPOINT',
          targetId: req.path,
          metadata: {
            reason: 'Feature flag not enabled',
            requiredFlag: flagName,
            endpoint: req.path,
            method: req.method,
          },
          req,
        }).catch(err => console.error('Failed to log access denied to admin audit:', err));

        // Also log to user activity log (legacy)
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Feature flag not enabled',
            requiredFlag: flagName,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          message: 'Feature not available',
          code: 'FEATURE_NOT_ENABLED',
          details: {
            requiredFlag: flagName,
          },
        });
      }

      next();
    } catch (error) {
      console.error('requireFeatureFlag middleware error:', error);
      return res.status(500).json({
        status: 'ERROR',
        message: 'Internal server error',
      });
    }
  };
}

/**
 * Require user to have a specific account flag enabled
 * @param {string} flagName - Account flag name (e.g., 'isBetaTester')
 * @returns {Function} Express middleware function
 */
export function requireAccountFlag(flagName) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          status: 'ERROR',
          message: 'Authentication required',
        });
      }

      // Load full user data if not already loaded
      let user = req.user;
      if (!user.role) {
        user = await getUserWithAccessData(req.user.id);
        if (!user) {
          return res.status(401).json({
            status: 'ERROR',
            message: 'User not found',
          });
        }
        req.user = user;
      }

      // Check account flag
      const flagValue = user[flagName];
      if (flagValue !== true) {
        // Log access denied
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Account flag not set',
            requiredFlag: flagName,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          message: 'Access restricted',
          code: 'ACCOUNT_FLAG_REQUIRED',
          details: {
            requiredFlag: flagName,
          },
        });
      }

      next();
    } catch (error) {
      console.error('requireAccountFlag middleware error:', error);
      return res.status(500).json({
        status: 'ERROR',
        message: 'Internal server error',
      });
    }
  };
}

/**
 * Access Control Middleware (Phase 5)
 * 
 * Provides role-based and permission-based access control for routes.
 * All middleware functions require that requireAuth has already been called
 * to populate req.user with user data.
 */

import {
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAnyPermission,
  getUserWithAccessData,
} from '../services/userService.js';
import { recordUserActivity } from '../services/userService.js';

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

      if (!hasRole(user, requiredRole)) {
        // Log access denied
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Insufficient role',
            requiredRole,
            userRole: user.role,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          message: 'Insufficient permissions',
          code: 'ACCESS_DENIED',
          details: {
            requiredRole,
            userRole: user.role,
          },
        });
      }

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

      if (!hasAnyRole(user, roles)) {
        // Log access denied
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Insufficient role',
            requiredRoles: roles,
            userRole: user.role,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          message: 'Insufficient permissions',
          code: 'ACCESS_DENIED',
          details: {
            requiredRoles: roles,
            userRole: user.role,
          },
        });
      }

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

      if (!hasPermission(user, permission)) {
        // Log access denied
        await recordUserActivity({
          userId: user.id,
          type: 'ACCESS_DENIED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            reason: 'Missing permission',
            requiredPermission: permission,
            userRole: user.role,
            endpoint: req.path,
            method: req.method,
          },
        }).catch(err => console.error('Failed to log access denied:', err));

        return res.status(403).json({
          status: 'ERROR',
          message: 'Insufficient permissions',
          code: 'ACCESS_DENIED',
          details: {
            requiredPermission: permission,
            userRole: user.role,
          },
        });
      }

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

      // Check feature flag
      const flagValue = user.featureFlags?.[flagName];
      if (flagValue !== true) {
        // Log access denied
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

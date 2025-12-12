/**
 * Admin Routes (Phase 6)
 * 
 * All routes in this file are protected by admin-level access control.
 * Requires: FOUNDER, CORE_TEAM, or ADMIN role (or MANAGE_USERS permission)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ADMIN_ROLES } from '../config/rolePermissions.js';
import {
  listAdminUsers,
  getAdminUserDetail,
  updateAdminUserRole,
  updateAdminUserStatus,
  toggleAdminUserStatus,
  updateAdminUserFeatureFlags,
  getAdminUserActivity,
  getAdminUserDevices,
  getAdminUserSessions,
  revokeAdminUserSession,
  revokeAllAdminUserSessions,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// All admin routes require admin-level access (role OR permission)
// Users can access if they have:
// - One of the admin roles (FOUNDER, CORE_TEAM, ADMIN), OR
// - At least one of the admin permissions (VIEW_ADMIN_DASHBOARD, MANAGE_USERS)
router.use(async (req, res, next) => {
  try {
    const { getUserWithAccessData, hasAnyRole, hasAnyPermission } = await import('../services/userService.js');
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'ERROR',
        code: 'AUTH_REQUIRED',
        message: 'You must be logged in.',
      });
    }

    // Load full user data with role/permissions
    const user = await getUserWithAccessData(req.user.id);
    if (!user) {
      return res.status(401).json({
        status: 'ERROR',
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    // Check if user has admin role OR admin permission
    const hasAdminRole = hasAnyRole(user, ADMIN_ROLES);
    const hasAdminPermission = hasAnyPermission(user, ['VIEW_ADMIN_DASHBOARD', 'MANAGE_USERS']);

    if (!hasAdminRole && !hasAdminPermission) {
      return res.status(403).json({
        status: 'ERROR',
        code: 'INSUFFICIENT_ROLE',
        message: 'You do not have permission to access this resource.',
      });
    }

    // Attach user to request for downstream handlers
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Admin route access check error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Internal server error',
    });
  }
});

// GET /api/v1/admin/users - List users with pagination and filters
router.get('/users', listAdminUsers);

// GET /api/v1/admin/users/:userId - Get detailed user information
router.get('/users/:userId', getAdminUserDetail);

// PUT /api/v1/admin/users/:userId/role - Update user role
router.put('/users/:userId/role', updateAdminUserRole);

// PUT /api/v1/admin/users/:userId/status - Update user account status
router.put('/users/:userId/status', updateAdminUserStatus);

// PATCH /api/v1/admin/users/:userId/toggle-status - Toggle user account status (ACTIVE ↔ DISABLED)
router.patch('/users/:userId/toggle-status', toggleAdminUserStatus);

// PUT /api/v1/admin/users/:userId/feature-flags - Update user feature flags
router.put('/users/:userId/feature-flags', updateAdminUserFeatureFlags);

// GET /api/v1/admin/users/:userId/activity - Get paginated activity log
router.get('/users/:userId/activity', getAdminUserActivity);

// GET /api/v1/admin/users/:userId/devices - Get user devices
router.get('/users/:userId/devices', getAdminUserDevices);

// GET /api/v1/admin/users/:userId/sessions - Get user sessions
router.get('/users/:userId/sessions', getAdminUserSessions);

// POST /api/v1/admin/users/:userId/sessions/revoke - Revoke a specific session
router.post('/users/:userId/sessions/revoke', revokeAdminUserSession);

// POST /api/v1/admin/users/:userId/sessions/revoke-all - Revoke all sessions
router.post('/users/:userId/sessions/revoke-all', revokeAllAdminUserSessions);

export default router;

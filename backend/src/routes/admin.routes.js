/**
 * Admin Routes (Phase 6)
 * 
 * All routes in this file are protected by admin-level access control.
 * Requires: FOUNDER, CORE_TEAM, or ADMIN role (or MANAGE_USERS permission)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAnyRole, requirePermission } from '../middleware/accessControl.js';
import { ADMIN_ROLES } from '../config/rolePermissions.js';
import {
  listAdminUsers,
  getAdminUserDetail,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateAdminUserFeatureFlags,
  getAdminUserActivity,
  getAdminUserDevices,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// All admin routes require admin-level access (role or permission)
// Use requireAnyRole for role-based access OR requirePermission for permission-based access
// We'll use requireAnyRole as the primary check (simpler and covers most cases)
// Users with MANAGE_USERS permission should also have one of these roles
router.use(requireAnyRole(ADMIN_ROLES));

// GET /api/v1/admin/users - List users with pagination and filters
router.get('/users', listAdminUsers);

// GET /api/v1/admin/users/:userId - Get detailed user information
router.get('/users/:userId', getAdminUserDetail);

// PUT /api/v1/admin/users/:userId/role - Update user role
router.put('/users/:userId/role', updateAdminUserRole);

// PUT /api/v1/admin/users/:userId/status - Update user account status
router.put('/users/:userId/status', updateAdminUserStatus);

// PUT /api/v1/admin/users/:userId/feature-flags - Update user feature flags
router.put('/users/:userId/feature-flags', updateAdminUserFeatureFlags);

// GET /api/v1/admin/users/:userId/activity - Get paginated activity log
router.get('/users/:userId/activity', getAdminUserActivity);

// GET /api/v1/admin/users/:userId/devices - Get user devices
router.get('/users/:userId/devices', getAdminUserDevices);

export default router;

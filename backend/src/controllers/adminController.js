/**
 * Admin Controller (Phase 6)
 * 
 * Handles admin-only operations for user management:
 * - List and search users
 * - View detailed user information
 * - Update user roles and account status
 * - Manage per-user feature flags
 * - View user activity logs and devices
 */

import {
  getUserProfile,
  getUserWithAccessData,
  getUserActivityLog,
  getUserDevices,
  recordUserActivity,
  getEffectivePermissions,
  mergeFeatureFlags,
  getDefaultFeatureFlags,
} from '../services/userService.js';
import { logUserActivity } from '../services/activityService.js';
import {
  searchUsers,
  updateUserRole,
  updateUserStatus,
  updateUserFeatureFlags,
} from '../services/userService.js';
import { getAdminUsers, getAdminUserDetail as getAdminUserDetailService } from '../services/adminUsersService.js';
import { normalizeAccountStatus, ACCOUNT_STATUS } from '../utils/accountStatus.js';
import { USER_STATUS } from '../constants/userStatus.js';
import {
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
} from '../services/sessionService.js';
import { assignRole, revokeRole, getUserRoles, getPrimaryRole } from '../services/roleService.js';
import { setFeatureFlag, bulkSetFeatureFlags } from '../services/featureFlagService.js';
import { logAdminAction } from '../services/adminAuditLogService.js';
import { getAuditLogs } from '../services/adminAuditLogsService.js';
import { queryAuditLogs } from '../services/auditLogQueryService.js';
import { getAllPlatformSettings, getPlatformSetting, setPlatformSetting } from '../services/platformSettingsService.js';
import { getRolesOverview } from '../services/adminRolesService.js';
import { sendOk, sendError, ok, fail } from '../utils/apiResponse.js';
import { getAdminNavigationForUser } from '../services/adminNavigationService.js';
import { hasPermission } from '../utils/permissions.js';
import { assertCanAssignRole } from '../utils/roleGuards.js';
import { assertCanModifyUser } from '../utils/adminWriteGuards.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { writeAdminAuditLog, logAdminUserStatusChange, logAdminUserRolesChange, logAdminSettingsChange, logAdminSessionRevoke } from '../utils/auditLogger.js';
import { assertFounder } from '../utils/founderGuard.js';
import { updateRolePermissions, roleExists } from '../services/rolePermissionsService.js';
import { getSystemHealth } from '../services/systemHealthService.js';
import { listJobs, getJob, retryJob, cancelJob } from '../services/queueAdapter.js';
import { listAdminSessions as listAdminSessionsService, revokeSession as revokeAdminSessionService } from '../services/adminSessionService.js';
import pool from '../db.js';
import { get, set } from '../utils/memoryCache.js';

/**
 * GET /api/v1/admin/users
 * List users with pagination, search, and filtering
 * Schema-drift tolerant: never crashes on missing columns
 * Requires: PERMISSIONS.ADMIN_USERS_READ permission
 */
export async function listAdminUsers(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_USERS_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to access this resource.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_USERS_READ,
        },
      }, 403);
    }

    // Validate and normalize pagination inputs
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    
    // Support both 'q' (requirements) and 'search' (backward compatibility)
    const q = req.query.q || req.query.search || '';

    // Call schema-drift tolerant service
    const result = await getAdminUsers({
      page,
      limit,
      q,
    });

    // Log audit event
    try {
      await writeAdminAuditLog({
        req,
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'ADMIN_USERS_LIST',
        status: 'SUCCESS',
        message: 'Viewed users list',
        meta: { page, limit, hasSearch: !!q },
      });
    } catch (auditError) {
      // Silently fail - audit logging should not break users list
    }

    // Return success with consistent JSON format
    return ok(res, {
      code: 'ADMIN_USERS_OK',
      message: 'Users retrieved successfully',
      data: result,
    }, 200);
  } catch (error) {
    console.error('listAdminUsers error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'ADMIN_USERS_LIST_FAILED',
      message: 'Failed to fetch users',
      details: {},
    }, 500);
  }
}

/**
 * GET /api/v1/admin/users/:userId
 * Get detailed user information for admin view
 * Schema-drift tolerant: returns stable admin user shape
 * Requires: PERMISSIONS.ADMIN_USERS_READ permission
 */
export async function getAdminUserDetail(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_USERS_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to access this resource.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_USERS_READ,
        },
      }, 403);
    }

    const userId = parseInt(req.params.userId);
    if (!userId || isNaN(userId)) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        details: {},
      }, 400);
    }

    // Get admin-safe user detail (schema-drift tolerant)
    const userDetail = await getAdminUserDetailService(userId);
    if (!userDetail) {
      return fail(res, {
        code: 'ADMIN_USER_NOT_FOUND',
        message: 'User not found',
        details: {},
      }, 404);
    }

    // Log audit event
    try {
      await writeAdminAuditLog({
        req,
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'ADMIN_USERS_VIEW',
        targetType: 'USER',
        targetId: String(userId),
        status: 'SUCCESS',
        message: 'Viewed user details',
        meta: { viewedUserId: userId },
      });
    } catch (auditError) {
      // Silently fail - audit logging should not break user detail view
    }

    // Return success with admin user shape
    return ok(res, {
      code: 'ADMIN_USER_DETAILS_OK',
      message: 'User details retrieved successfully',
      data: { user: userDetail },
    }, 200);
  } catch (error) {
    console.error('getAdminUserDetail error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch user details',
      details: {},
    }, 500);
  }
}

/**
 * GET /api/v1/admin/navigation
 * Get admin navigation structure filtered by user permissions
 * Navigation is automatically filtered by permissions in getAdminNavigationForUser
 */
export async function getAdminNavigation(req, res) {
  try {
    // User is already validated by requireAdmin middleware
    const user = req.currentUser || req.user;
    
    if (!user) {
      return fail(res, {
        code: 'AUTH_REQUIRED',
        message: 'You must be logged in.',
        details: {},
      }, 401);
    }

    // Get navigation filtered by user permissions
    // getAdminNavigationForUser already filters modules based on permissions
    const navigation = getAdminNavigationForUser(user);

    // Log audit event
    try {
      await writeAdminAuditLog({
        req,
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'ADMIN_NAV_VIEW',
        status: 'SUCCESS',
        message: 'Viewed admin navigation',
      });
    } catch (auditError) {
      // Silently fail - audit logging should not break navigation
    }

    return ok(res, {
      code: 'ADMIN_NAV_OK',
      message: 'Navigation retrieved successfully',
      data: navigation,
    }, 200);
  } catch (error) {
    console.error('getAdminNavigation error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'ADMIN_NAV_FAILED',
      message: 'Failed to retrieve navigation',
      details: {},
    }, 500);
  }
}

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Assign or remove user role (A2.1)
 * 
 * Request body: { "role": "support", "reason": "Team restructure" }
 * 
 * Rules:
 * - Requires PERMISSIONS.ADMIN_USERS_WRITE permission
 * - Enforces role hierarchy
 * - Prevents self-lockout
 * - Single-role model: user.role is authoritative
 */
export async function assignAdminUserRole(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_USERS_WRITE)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to modify user roles.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_USERS_WRITE,
        },
      }, 403);
    }

    const userId = parseInt(req.params.userId);
    if (!userId || isNaN(userId)) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        details: {},
      }, 400);
    }

    // Get and normalize role from request body
    let { role, reason } = req.body;
    if (!role || typeof role !== 'string') {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Role is required and must be a string',
        details: {},
      }, 400);
    }

    // Normalize role: trim and lowercase
    const normalizedRole = role.trim().toLowerCase();

    // Get target user's current role
    const targetUser = await getUserProfile(userId);
    if (!targetUser) {
      return fail(res, {
        code: 'ADMIN_USER_NOT_FOUND',
        message: 'User not found',
        details: {},
      }, 404);
    }

    // Validate role assignment using defensive guards
    const validation = assertCanAssignRole({
      actor: user,
      targetUser: targetUser,
      newRole: normalizedRole,
    });

    if (!validation.ok) {
      return fail(res, {
        code: validation.code,
        message: validation.reason,
        details: {},
      }, 403);
    }

    // Check if this is a no-op (same role)
    const currentRole = (targetUser.role || '').toLowerCase().trim();
    if (currentRole === normalizedRole) {
      // No-op: role is already set to this value
      return ok(res, {
        code: 'ADMIN_USER_ROLE_OK',
        message: 'User role is already set to the requested value',
        data: {
          user: {
            id: targetUser.id,
            role: normalizedRole,
          },
        },
      }, 200);
    }

    // Capture role before update (normalize to lowercase for consistency)
    const rolesBefore = (targetUser.role || '').toLowerCase().trim();

    // Update role (single-role model: user.role is authoritative)
    // Note: This assumes single-role model. Reads may remain backward-compatible
    // with multi-role arrays, but writes use user.role as authoritative.
    const updatedUser = await updateUserRole(userId, normalizedRole);

    // Capture role after update (already normalized)
    const rolesAfter = normalizedRole;

    // Log ADMIN_USER_ROLES_CHANGE audit event (A2.3)
    // Best-effort only - never throws and does not block response
    try {
      const auditResult = await logAdminUserRolesChange({
        actor: user,
        targetUserId: userId,
        rolesBefore,
        rolesAfter,
        reason: reason || null,
        req,
      });
      if (!auditResult.ok) {
        // Log failure but don't throw - audit logging should never break the main flow
        console.error('[AdminController] Failed to log ADMIN_USER_ROLES_CHANGE:', auditResult.error);
      }
    } catch (auditError) {
      // Defensive: catch any unexpected errors and never throw
      console.error('[AdminController] Unexpected error logging ADMIN_USER_ROLES_CHANGE:', auditError);
    }

    // Return updated user snapshot (id, role)
    return ok(res, {
      code: 'ADMIN_USER_ROLE_UPDATED',
      message: 'User role updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          role: normalizedRole,
        },
      },
    }, 200);
  } catch (error) {
    console.error('assignAdminUserRole error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to update user role',
      details: {},
    }, 500);
  }
}

/**
 * PUT /api/v1/admin/users/:userId/role
 * Update user role (legacy endpoint - kept for backward compatibility)
 */
export async function updateAdminUserRole(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    const adminId = req.user?.id;

    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    if (!role) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Role is required',
        statusCode: 400
      });
    }

    // Validate role
    const validRoles = [
      'FOUNDER',
      'CORE_TEAM',
      'ADMIN',
      'MODERATOR',
      'CREATOR',
      'STANDARD_USER',
      'SUSPENDED',
      'BANNED',
    ];
    if (!validRoles.includes(role)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid role',
        statusCode: 400
      });
    }

    // Get current user to log old role
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return sendError(res, {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        statusCode: 404
      });
    }

    const oldRole = currentUser.role;
    const oldRoles = await getUserRoles(userId);
    const oldPrimaryRole = oldRoles.length > 0 ? getPrimaryRole(oldRoles) : oldRole;

    // Get admin role for audit log
    const adminRoles = await getUserRoles(adminId);
    const adminRole = adminRoles.length > 0 ? getPrimaryRole(adminRoles) : (req.user?.role || 'UNKNOWN');

    // Update role using new roleService (supports multi-role)
    // For now, we'll assign the new role and revoke old roles if needed
    // This maintains backward compatibility with single-role model
    await assignRole({ userId, role, assignedBy: adminId, expiresAt: null });
    
    // Revoke old roles (if they exist in user_roles table)
    if (oldRoles.length > 0) {
      for (const oldRoleName of oldRoles) {
        if (oldRoleName !== role) {
          await revokeRole({ userId, role: oldRoleName, revokedBy: adminId });
        }
      }
    }

    // Also update legacy User.role column for backward compatibility
    const updatedUser = await updateUserRole(userId, role);

    // If role is SUSPENDED or BANNED, also update accountStatus
    if (role === 'SUSPENDED' || role === 'BANNED') {
      await updateUserStatus(userId, role === 'SUSPENDED' ? 'SUSPENDED' : 'BANNED');
    }

    // Log to admin audit log
    try {
      await logAdminAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'ROLE_UPDATED',
        targetType: 'USER',
        targetId: String(userId),
        metadata: {
          before: {
            role: oldPrimaryRole,
            roles: oldRoles,
          },
          after: {
            role: role,
            roles: [role],
          },
        },
        req,
      });
    } catch (auditError) {
      console.error('Failed to log role update to admin audit:', auditError);
    }

    // Also log to user activity log (legacy)
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: adminId, // Admin is the actor
        type: 'ROLE_CHANGED',
        ipAddress,
        userAgent,
        metadata: {
          oldRole: oldPrimaryRole,
          newRole: role,
        },
      });
    } catch (activityError) {
      console.error('Failed to record role change activity:', activityError);
    }

    return sendOk(res, {
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        accountStatus: updatedUser.accountStatus,
      },
    });
  } catch (error) {
    console.error('updateAdminUserRole error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to update user role',
      statusCode: 500
    });
  }
}

/**
 * PUT /api/v1/admin/users/:userId/status
 * Update user account status
 */
export async function updateAdminUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const { accountStatus, reason } = req.body;
    const adminId = req.user?.id;

    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    if (!accountStatus) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Account status is required',
        statusCode: 400
      });
    }

    // Normalize and validate status
    const normalizedStatus = normalizeAccountStatus(accountStatus);
    const validStatuses = [ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.DISABLED, ACCOUNT_STATUS.PENDING];
    if (!validStatuses.includes(normalizedStatus)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: `Invalid account status. Must be one of: ${validStatuses.join(', ')}`,
        statusCode: 400
      });
    }

    // Get current user to log old status
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return sendError(res, {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        statusCode: 404
      });
    }

    const oldStatus = normalizeAccountStatus(currentUser.accountStatus || ACCOUNT_STATUS.ACTIVE);

    // Get admin role for audit log
    const adminRoles = await getUserRoles(adminId);
    const adminRole = adminRoles.length > 0 ? getPrimaryRole(adminRoles) : (req.user?.role || 'UNKNOWN');

    // Update status (normalizedStatus is already normalized)
    const updatedUser = await updateUserStatus(userId, normalizedStatus);

    // Note: Role syncing removed - status and role are now independent
    // DISABLED status does not automatically change role

    // Log to admin audit log (A1.3 - ADMIN_USER_STATUS_CHANGE)
    // This is best-effort and never throws - failures are logged but don't block the request
    const auditResult = await logAdminUserStatusChange({
      actor: req.user,
      targetUserId: userId,
      fromStatus: oldStatus,
      toStatus: normalizedStatus,
      reason: reason || null,
      req,
    });
    if (!auditResult.ok) {
      // Log failure but don't throw - audit logging should never break the main flow
      console.error('[AdminController] Failed to log ADMIN_USER_STATUS_CHANGE:', auditResult.error);
    }

    // Also log to existing admin audit log (legacy)
    try {
      await logAdminAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'STATUS_UPDATED',
        targetType: 'USER',
        targetId: String(userId),
        metadata: {
          before: { status: oldStatus },
          after: { status: normalizedStatus },
        },
        req,
      });
    } catch (auditError) {
      console.error('Failed to log status update to admin audit:', auditError);
    }

    // Also log to user activity log (legacy)
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: adminId, // Admin is the actor
        type: 'STATUS_CHANGED',
        ipAddress,
        userAgent,
        metadata: {
          oldStatus,
          newStatus: normalizedStatus,
        },
      });
    } catch (activityError) {
      console.error('Failed to record status change activity:', activityError);
    }

    return sendOk(res, {
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        accountStatus: updatedUser.accountStatus,
      },
    });
  } catch (error) {
    console.error('updateAdminUserStatus error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to update user status',
      statusCode: 500
    });
  }
}

/**
 * PATCH /api/v1/admin/users/:userId/toggle-status
 * Toggle user account status between ACTIVE and DISABLED
 * Does NOT allow toggling FOUNDER users
 */
export async function toggleAdminUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const adminId = req.user?.id;

    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    // Get current user
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return sendError(res, {
        code: 'ADMIN_USER_NOT_FOUND',
        message: 'User not found',
        statusCode: 404
      });
    }

    // Do NOT allow toggling FOUNDER users
    if (currentUser.role === 'FOUNDER') {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Cannot toggle status for FOUNDER users',
        statusCode: 400
      });
    }

    const oldStatus = normalizeAccountStatus(currentUser.accountStatus || ACCOUNT_STATUS.ACTIVE);
    
    // Toggle status: ACTIVE → DISABLED, DISABLED → ACTIVE
    // Only toggle if status is ACTIVE or DISABLED
    let newStatus;
    if (oldStatus === ACCOUNT_STATUS.ACTIVE) {
      newStatus = ACCOUNT_STATUS.DISABLED;
    } else if (oldStatus === ACCOUNT_STATUS.DISABLED) {
      newStatus = ACCOUNT_STATUS.ACTIVE;
    } else {
      // If status is something else (PENDING, etc.), don't allow toggle
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: `Cannot toggle status. Current status is ${oldStatus}. Toggle is only available for ${ACCOUNT_STATUS.ACTIVE} and ${ACCOUNT_STATUS.DISABLED} statuses.`,
        statusCode: 400
      });
    }

    // Get admin role for audit log
    const adminRoles = await getUserRoles(adminId);
    const adminRole = adminRoles.length > 0 ? getPrimaryRole(adminRoles) : (req.user?.role || 'UNKNOWN');

    // Update status
    const updatedUser = await updateUserStatus(userId, newStatus);

    // Log to admin audit log (A1.3 - ADMIN_USER_STATUS_CHANGE)
    // This is best-effort and never throws - failures are logged but don't block the request
    const { reason } = req.body || {};
    const auditResult = await logAdminUserStatusChange({
      actor: req.user,
      targetUserId: userId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      reason: reason || null,
      req,
    });
    if (!auditResult.ok) {
      // Log failure but don't throw - audit logging should never break the main flow
      console.error('[AdminController] Failed to log ADMIN_USER_STATUS_CHANGE:', auditResult.error);
    }

    // Also log to existing admin audit log (legacy)
    try {
      await logAdminAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'STATUS_UPDATED',
        targetType: 'USER',
        targetId: String(userId),
        metadata: {
          before: { status: oldStatus },
          after: { status: newStatus },
          action: 'TOGGLE',
        },
        req,
      });
    } catch (auditError) {
      console.error('Failed to log status toggle to admin audit:', auditError);
    }

    // Also log to user activity log (legacy)
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: adminId, // Admin is the actor
        type: 'STATUS_CHANGED',
        ipAddress,
        userAgent,
        metadata: {
          oldStatus,
          newStatus,
          action: 'TOGGLE',
        },
      });
    } catch (activityError) {
      console.error('Failed to record status toggle activity:', activityError);
    }

    return sendOk(res, {
      accountStatus: updatedUser.accountStatus,
    }, 200, 'ADMIN_USER_STATUS_UPDATED');
  } catch (error) {
    console.error('toggleAdminUserStatus error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to toggle user status',
      statusCode: 500
    });
  }
}

/**
 * PUT /api/v1/admin/users/:userId/feature-flags
 * Update user feature flags
 */
export async function updateAdminUserFeatureFlags(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const { featureFlags } = req.body;
    const adminId = req.user?.id;

    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    if (!featureFlags || typeof featureFlags !== 'object') {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Feature flags must be an object',
        statusCode: 400
      });
    }

    // Get current user to log old flags
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return sendError(res, {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        statusCode: 404
      });
    }

    const oldFlags = currentUser.featureFlags || {};

    // Get admin role for audit log
    const adminRoles = await getUserRoles(adminId);
    const adminRole = adminRoles.length > 0 ? getPrimaryRole(adminRoles) : (req.user?.role || 'UNKNOWN');

    // Update feature flags using new featureFlagService (supports table + legacy JSON)
    await bulkSetFeatureFlags({ userId, flagsObject: featureFlags, updatedBy: adminId });

    // Also update legacy User.featureFlags JSON column for backward compatibility
    const updatedUser = await updateUserFeatureFlags(userId, featureFlags);

    // Log to admin audit log
    try {
      await logAdminAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'FEATURE_FLAG_UPDATED',
        targetType: 'USER',
        targetId: String(userId),
        metadata: {
          before: { featureFlags: oldFlags },
          after: { featureFlags: featureFlags },
        },
        req,
      });
    } catch (auditError) {
      console.error('Failed to log feature flag update to admin audit:', auditError);
    }

    // Also log to user activity log (legacy)
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: adminId, // Admin is the actor
        type: 'FEATURE_FLAGS_UPDATED',
        ipAddress,
        userAgent,
        metadata: {
          oldFlags,
          newFlags: featureFlags,
        },
      });
    } catch (activityError) {
      console.error('Failed to record feature flags update activity:', activityError);
    }

    // Get merged flags for response
    const defaultFlags = getDefaultFeatureFlags();
    const mergedFlags = mergeFeatureFlags(updatedUser.featureFlags, defaultFlags);

    return sendOk(res, {
      user: {
        id: updatedUser.id,
        featureFlags: mergedFlags,
      },
    });
  } catch (error) {
    console.error('updateAdminUserFeatureFlags error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to update feature flags',
      statusCode: 500
    });
  }
}

/**
 * GET /api/v1/admin/users/:userId/activity
 * Get paginated activity log for a user (Phase 8.6 - Normalized response)
 */
export async function getAdminUserActivity(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM UserActivityLog WHERE userId = ?',
      [userId]
    );
    const total = countRows[0]?.total || 0;

    // Get paginated activities with normalized structure
    const [rows] = await pool.query(
      `
      SELECT
        id,
        userId,
        actorId,
        activityType as type,
        ipAddress,
        userAgent,
        metadata,
        createdAt
      FROM UserActivityLog
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
      `,
      [userId, limit, offset]
    );

    // Normalize response format (same as user's own view)
    const items = rows.map((row) => ({
      id: row.id,
      type: row.type,
      createdAt: row.createdAt,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      actor: row.actorId
        ? {
            id: row.actorId,
            isSelf: row.actorId === row.userId,
          }
        : {
            id: row.userId,
            isSelf: true,
          },
    }));

    return sendOk(res, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getAdminUserActivity error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch user activity',
      statusCode: 500
    });
  }
}

/**
 * GET /api/v1/admin/users/:userId/devices
 * Get devices for a user
 */
export async function getAdminUserDevices(req, res) {
  try {
    const userId = parseInt(req.params.userId);

    if (!userId || isNaN(userId)) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        data: { devices: [] }
      }, 400);
    }

    const devices = await getUserDevices(userId);

    return ok(res, {
      code: 'USER_DEVICES_OK',
      message: 'Devices retrieved successfully',
      data: { devices: Array.isArray(devices) ? devices : [] }
    });
  } catch (error) {
    console.error('getAdminUserDevices error:', error);
    return fail(res, {
      code: 'USER_DEVICES_ERROR',
      message: 'Failed to fetch user devices',
      data: { devices: [] }
    }, 500);
  }
}

/**
 * GET /api/v1/admin/users/:userId/sessions
 * Get all sessions for a user (admin)
 */
export async function getAdminUserSessions(req, res) {
  try {
    const userId = parseInt(req.params.userId);

    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    const sessions = await getUserSessions(userId);

    // Ensure we always return an array, even if empty
    return sendOk(res, { sessions: Array.isArray(sessions) ? sessions : [] });
  } catch (error) {
    console.error('getAdminUserSessions error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch user sessions',
      statusCode: 500
    });
  }
}

/**
 * POST /api/v1/admin/users/:userId/sessions/revoke
 * Revoke a specific session for a user (admin)
 */
export async function revokeAdminUserSession(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const { sessionId } = req.body;

    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    if (!sessionId) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Session ID is required',
        statusCode: 400
      });
    }

    const revoked = await revokeSession(sessionId, userId);

    if (!revoked) {
      return sendError(res, {
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found',
        statusCode: 404
      });
    }

    // Get admin role for audit log
    const adminUserId = req.user?.id;
    const adminRoles = await getUserRoles(adminUserId);
    const adminRole = adminRoles.length > 0 ? getPrimaryRole(adminRoles) : (req.user?.role || 'UNKNOWN');

    // Log to admin audit log
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logAdminAction({
        actorId: adminUserId,
        actorRole: adminRole,
        action: 'SESSION_REVOKED',
        targetType: 'USER',
        targetId: String(userId),
        metadata: { targetSessionId: sessionId },
        req,
      });
    } catch (auditError) {
      console.error('Failed to log session revocation to admin audit:', auditError);
    }

    // Also log to user activity log (legacy)
    try {
      await logUserActivity({
        userId, // Target user whose session was revoked
        actorId: adminUserId, // Admin who performed the action
        type: 'ADMIN_SESSION_REVOKED',
        ipAddress,
        userAgent,
        metadata: { targetSessionId: sessionId }
      });
    } catch (activityError) {
      console.error('Failed to record admin session revocation activity:', activityError);
    }

    return sendOk(res, { success: true });
  } catch (error) {
    console.error('revokeAdminUserSession error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to revoke session',
      statusCode: 500
    });
  }
}

/**
 * POST /api/v1/admin/users/:userId/sessions/revoke-all
 * Revoke all sessions for a user (admin)
 */
export async function revokeAllAdminUserSessions(req, res) {
  try {
    const userId = parseInt(req.params.userId);

    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    const revokedCount = await revokeAllUserSessions(userId);

    // Get admin role for audit log
    const adminUserId = req.user?.id;
    const adminRoles = await getUserRoles(adminUserId);
    const adminRole = adminRoles.length > 0 ? getPrimaryRole(adminRoles) : (req.user?.role || 'UNKNOWN');

    // Log to admin audit log
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logAdminAction({
        actorId: adminUserId,
        actorRole: adminRole,
        action: 'ALL_SESSIONS_REVOKED',
        targetType: 'USER',
        targetId: String(userId),
        metadata: { revokedCount },
        req,
      });
    } catch (auditError) {
      console.error('Failed to log sessions revocation to admin audit:', auditError);
    }

    // Also log to user activity log (legacy)
    try {
      await logUserActivity({
        userId, // Target user whose sessions were revoked
        actorId: adminUserId, // Admin who performed the action
        type: 'ADMIN_SESSIONS_REVOKED_ALL',
        ipAddress,
        userAgent,
        metadata: { revokedCount }
      });
    } catch (activityError) {
      console.error('Failed to record admin sessions revocation activity:', activityError);
    }

    return sendOk(res, { success: true });
  } catch (error) {
    console.error('revokeAllAdminUserSessions error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to revoke sessions',
      statusCode: 500
    });
  }
}

/**
 * GET /api/v1/admin/audit-logs
 * List admin audit logs with filtering and pagination
 * Requires: PERMISSIONS.ADMIN_AUDIT_READ permission
 * 
 * Features:
 * - Response caching (10s TTL, configurable via ADMIN_AUDIT_CACHE_TTL_MS)
 * - Cache key includes user identity and all query params
 * - Respects Cache-Control: no-cache header and nocache=1 query param
 * - Adds x-cache header (HIT/MISS)
 */
export async function listAdminAuditLogs(req, res) {
  try {
    // Check permission first (do not cache permission-denied errors)
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_AUDIT_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to access this resource.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_AUDIT_READ,
        },
      }, 403);
    }
    
    // Check for cache bypass
    const cacheControl = req.headers['cache-control'];
    const nocache = req.query.nocache === '1';
    const bypassCache = cacheControl?.toLowerCase().includes('no-cache') || nocache;

    // Parse and validate pagination parameters
    let page = 1;
    let limit = 25;
    
    // Validate page - must be integer >= 1
    if (req.query.page !== undefined) {
      const pageParsed = parseInt(req.query.page);
      if (!isNaN(pageParsed) && pageParsed >= 1 && Number.isInteger(pageParsed)) {
        page = pageParsed;
      }
    }
    
    // Validate limit - must be integer between 1 and 100
    if (req.query.limit !== undefined) {
      const limitParsed = parseInt(req.query.limit);
      if (!isNaN(limitParsed) && limitParsed >= 1 && limitParsed <= 100 && Number.isInteger(limitParsed)) {
        limit = limitParsed;
      }
    }
    
    // Sanitize and validate filters (whitelisted only)
    let q = null;
    let action = null;
    let status = null;
    let actorUserId = null;
    
    // q: string, optional, max length 120
    if (req.query.q !== undefined && typeof req.query.q === 'string') {
      const qTrimmed = req.query.q.trim().replace(/\s+/g, ' ');
      if (qTrimmed.length > 0 && qTrimmed.length <= 120) {
        q = qTrimmed;
      }
    }
    
    // action: string, optional, max length 120
    if (req.query.action !== undefined && typeof req.query.action === 'string') {
      const actionTrimmed = req.query.action.trim().replace(/\s+/g, ' ');
      if (actionTrimmed.length > 0 && actionTrimmed.length <= 120) {
        action = actionTrimmed;
      }
    }
    
    // status: string, optional, max length 40, normalize to uppercase
    if (req.query.status !== undefined && typeof req.query.status === 'string') {
      const statusTrimmed = req.query.status.trim().toUpperCase();
      if (statusTrimmed.length > 0 && statusTrimmed.length <= 40) {
        // Only allow specific status values
        const allowedStatuses = ['SUCCESS', 'WARNING', 'ERROR'];
        if (allowedStatuses.includes(statusTrimmed)) {
          status = statusTrimmed;
        }
      }
    }
    
    // actorUserId: integer, optional, must be > 0
    if (req.query.actorUserId !== undefined) {
      const actorUserIdParsed = parseInt(req.query.actorUserId);
      if (!isNaN(actorUserIdParsed) && actorUserIdParsed > 0 && Number.isInteger(actorUserIdParsed)) {
        actorUserId = actorUserIdParsed;
      }
    }

    // Build cache key (includes user identity and all validated params)
    const userIdentifier = user.id || user.email || 'unknown';
    const cacheKeyParts = [
      'admin:auditLogs',
      `user=${userIdentifier}`,
      `p=${page}`,
      `l=${limit}`,
      `q=${q || ''}`,
      `a=${action || ''}`,
      `s=${status || ''}`,
      `actor=${actorUserId || ''}`,
    ];
    const cacheKey = cacheKeyParts.join(':');
    
    // Try to get from cache (unless bypassed)
    let cachedResponse = null;
    if (!bypassCache) {
      cachedResponse = get(cacheKey);
    }
    
    if (cachedResponse) {
      // Cache HIT - return cached response body with fresh headers
      res.setHeader('x-cache', 'HIT');
      return ok(res, {
        code: 'ADMIN_AUDIT_LOGS_OK',
        message: 'Audit logs retrieved successfully',
        data: cachedResponse,
      }, 200);
    }
    
    // Cache MISS - fetch from service
    res.setHeader('x-cache', 'MISS');
    
    // Call schema-drift tolerant service
    const result = await getAuditLogs({
      page,
      limit,
      q,
      actorUserId,
      action,
      status,
    });

    // Cache successful response
    if (!bypassCache) {
      const ttlMs = parseInt(process.env.ADMIN_AUDIT_CACHE_TTL_MS || '10000', 10);
      set(cacheKey, result, ttlMs);
    }

    // Return success with consistent JSON format
    return ok(res, {
      code: 'ADMIN_AUDIT_LOGS_OK',
      message: 'Audit logs retrieved successfully',
      data: result,
    }, 200);
  } catch (error) {
    console.error('listAdminAuditLogs error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'ADMIN_AUDIT_LOGS_LIST_FAILED',
      message: 'Failed to fetch audit logs',
      details: {},
    }, 500);
  }
}

/**
 * Escape a value for CSV format
 * - Quotes fields containing commas, quotes, or newlines
 * - Doubles quotes inside quoted fields
 * - Replaces CRLF with spaces
 * @param {*} value - Value to escape
 * @returns {string} Escaped CSV field
 */
function escapeCsvField(value) {
  // Convert null/undefined to empty string
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convert to string
  let str = String(value);
  
  // Replace CRLF with space (RFC 4180 compliance)
  str = str.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ');
  
  // If field contains comma, quote, or newline, quote it and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * GET /api/v1/admin/audit-logs/export.csv
 * Export audit logs as CSV with filtering
 * Requires: PERMISSIONS.ADMIN_AUDIT_READ permission
 * Rate limited: 3 exports per minute per admin user
 * 
 * Query Parameters (all optional):
 * - q: Search query (searches event and meta_json)
 * - event: Exact event name filter
 * - actorUserId: Filter by actor user ID (integer)
 * - targetUserId: Filter by target user ID (integer)
 * - dateFrom: ISO date string (inclusive start date)
 * - dateTo: ISO date string (inclusive end date)
 * - limit: Max rows (default: 5000, hard max: 20000)
 * 
 * CSV Columns (in order):
 * - id
 * - created_at
 * - event
 * - actor_user_id
 * - target_user_id
 * - ip
 * - user_agent
 * - meta_json
 */
export async function exportAuditLogsCsv(req, res) {
  try {
    // Check permission first
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_AUDIT_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to access this resource.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_AUDIT_READ,
        },
      }, 403);
    }

    // Parse and validate filters (all optional, defensive)
    let q = null;
    let event = null;
    let actorUserId = null;
    let targetUserId = null;
    let dateFrom = null;
    let dateTo = null;
    let limit = 5000;

    // q: string search query, optional, max length 120
    if (req.query.q !== undefined && typeof req.query.q === 'string') {
      const qTrimmed = req.query.q.trim();
      if (qTrimmed.length > 0 && qTrimmed.length <= 120) {
        q = qTrimmed;
      }
    }

    // event: string, optional, max length 100
    if (req.query.event !== undefined && typeof req.query.event === 'string') {
      const eventTrimmed = req.query.event.trim();
      if (eventTrimmed.length > 0 && eventTrimmed.length <= 100) {
        event = eventTrimmed;
      }
    }

    // actorUserId: integer, optional, must be > 0
    if (req.query.actorUserId !== undefined) {
      const actorIdParsed = parseInt(req.query.actorUserId);
      if (!isNaN(actorIdParsed) && actorIdParsed > 0 && Number.isInteger(actorIdParsed)) {
        actorUserId = actorIdParsed;
      } else {
        return fail(res, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid actorUserId: must be a positive integer',
          details: {},
        }, 400);
      }
    }

    // targetUserId: integer, optional, must be > 0
    if (req.query.targetUserId !== undefined) {
      const targetIdParsed = parseInt(req.query.targetUserId);
      if (!isNaN(targetIdParsed) && targetIdParsed > 0 && Number.isInteger(targetIdParsed)) {
        targetUserId = targetIdParsed;
      } else {
        return fail(res, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid targetUserId: must be a positive integer',
          details: {},
        }, 400);
      }
    }

    // dateFrom: ISO date string, optional
    if (req.query.dateFrom !== undefined && typeof req.query.dateFrom === 'string') {
      const fromDateTrimmed = req.query.dateFrom.trim();
      if (fromDateTrimmed.length > 0) {
        const fromDate = new Date(fromDateTrimmed);
        if (isNaN(fromDate.getTime())) {
          return fail(res, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dateFrom: must be a valid ISO date string',
            details: {},
          }, 400);
        }
        dateFrom = fromDateTrimmed;
      }
    }

    // dateTo: ISO date string, optional
    if (req.query.dateTo !== undefined && typeof req.query.dateTo === 'string') {
      const toDateTrimmed = req.query.dateTo.trim();
      if (toDateTrimmed.length > 0) {
        const toDate = new Date(toDateTrimmed);
        if (isNaN(toDate.getTime())) {
          return fail(res, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dateTo: must be a valid ISO date string',
            details: {},
          }, 400);
        }
        dateTo = toDateTrimmed;
      }
    }

    // limit: integer, optional, default 5000, max 20000
    if (req.query.limit !== undefined) {
      const limitParsed = parseInt(req.query.limit);
      if (!isNaN(limitParsed) && limitParsed >= 1 && limitParsed <= 20000 && Number.isInteger(limitParsed)) {
        limit = limitParsed;
      } else {
        return fail(res, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid limit: must be an integer between 1 and 20000',
          details: {},
        }, 400);
      }
    }

    // Query audit logs
    let rows;
    try {
      rows = await queryAuditLogs({
        q,
        event,
        actorUserId,
        targetUserId,
        dateFrom,
        dateTo,
        limit,
      });
    } catch (queryError) {
      console.error('exportAuditLogsCsv query error:', queryError, { requestId: req.requestId });
      return fail(res, {
        code: 'AUDIT_EXPORT_FAILED',
        message: 'Failed to query audit logs',
        details: {},
      }, 500);
    }

    // Generate CSV
    const csvLines = [];
    
    // CSV headers (exact order specified)
    const headers = [
      'id',
      'created_at',
      'event',
      'actor_user_id',
      'target_user_id',
      'ip',
      'user_agent',
      'meta_json',
    ];
    csvLines.push(headers.map(escapeCsvField).join(','));

    // CSV rows
    for (const row of rows) {
      // Serialize meta_json as compact JSON string
      let metaJsonStr = '';
      if (row.meta_json !== null && row.meta_json !== undefined) {
        try {
          // If it's already a string, try to parse and re-stringify to ensure valid JSON
          if (typeof row.meta_json === 'string') {
            const parsed = JSON.parse(row.meta_json);
            metaJsonStr = JSON.stringify(parsed);
          } else {
            // If it's already an object, stringify it
            metaJsonStr = JSON.stringify(row.meta_json);
          }
        } catch (e) {
          // If JSON parsing/stringifying fails, use string representation
          metaJsonStr = String(row.meta_json);
        }
      }

      const csvRow = [
        row.id || '',
        row.created_at || '',
        row.event || '',
        row.actor_user_id || '',
        row.target_user_id || '',
        row.ip || '',
        row.user_agent || '',
        metaJsonStr,
      ];
      csvLines.push(csvRow.map(escapeCsvField).join(','));
    }

    const csvContent = csvLines.join('\n');

    // Generate filename with current date
    const today = new Date().toISOString().slice(0, 10);
    const filename = `audit-logs-${today}.csv`;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send CSV
    res.send(csvContent);

  } catch (error) {
    console.error('exportAuditLogsCsv error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'AUDIT_EXPORT_FAILED',
      message: 'Failed to export audit logs',
      details: {},
    }, 500);
  }
}

/**
 * GET /api/v1/admin/roles
 * Get roles overview with permissions (read-only)
 * Requires: PERMISSIONS.ADMIN_ROLES_READ permission
 */
export async function getAdminRoles(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_ROLES_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to access this resource.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_ROLES_READ,
        },
      }, 403);
    }

    // Get roles overview
    const result = await getRolesOverview();

    // Log audit event
    try {
      await writeAdminAuditLog({
        req,
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'ADMIN_ROLES_VIEW',
        status: 'SUCCESS',
        message: 'Viewed roles overview',
        meta: { roleCount: result.roles?.length || 0 },
      });
    } catch (auditError) {
      // Silently fail - audit logging should not break roles list
    }

    // Return success with consistent JSON format
    return ok(res, {
      code: 'ADMIN_ROLES_OK',
      message: 'Roles retrieved successfully',
      data: result,
    }, 200);
  } catch (error) {
    console.error('getAdminRoles error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'ADMIN_ROLES_LIST_FAILED',
      message: 'Failed to fetch roles',
      details: {},
    }, 500);
  }
}

/**
 * PUT /api/v1/admin/roles/:roleName
 * Update role permission set (founder-only)
 * 
 * Request body: {
 *   "permissions": ["ADMIN_USERS_READ", "ADMIN_USERS_WRITE", "ADMIN_AUDIT_READ"],
 *   "reason": "Expanded admin scope"
 * }
 * 
 * Rules:
 * - Requires founder role (assertFounder)
 * - roleName must exist in ROLE_PERMISSIONS
 * - permissions must be a subset of PERMISSIONS
 * - No duplicates
 * - Founder role cannot be edited
 * - Critical permissions must remain in at least one role
 */
export async function updateAdminRole(req, res) {
  try {
    // Check founder access
    const user = req.currentUser || req.user;
    const founderCheck = assertFounder(user);
    if (!founderCheck.ok) {
      return fail(res, {
        code: founderCheck.code || 'FOUNDER_ONLY',
        message: founderCheck.reason || 'Founder access required',
        details: {},
      }, 403);
    }

    // Get role name from URL
    const roleName = req.params.roleName;
    if (!roleName) {
      return fail(res, {
        code: 'ROLE_NOT_FOUND',
        message: 'Role name is required',
        details: {},
      }, 400);
    }

    // Check role exists
    if (!roleExists(roleName)) {
      return fail(res, {
        code: 'ROLE_NOT_FOUND',
        message: `Role '${roleName}' does not exist`,
        details: {},
      }, 404);
    }

    // Get and validate request body
    const { permissions, reason } = req.body;

    if (!Array.isArray(permissions)) {
      return fail(res, {
        code: 'INVALID_PERMISSION',
        message: 'Permissions must be an array',
        details: {},
      }, 400);
    }

    // Normalize permissions: trim, remove empty strings, remove duplicates
    const normalizedPermissions = [...new Set(
      permissions
        .map(p => (typeof p === 'string' ? p.trim() : ''))
        .filter(p => p.length > 0)
    )];

    // Update role permissions (includes all validation)
    const result = updateRolePermissions(roleName, normalizedPermissions);
    if (!result.ok) {
      return fail(res, {
        code: result.code || 'ROLE_UPDATE_FAILED',
        message: result.reason || 'Failed to update role permissions',
        details: {
          ...(result.missingPermissions && { missingPermissions: result.missingPermissions }),
          ...(result.invalidPermissions && { invalidPermissions: result.invalidPermissions }),
        },
      }, 400);
    }

    // TODO (C): log ADMIN_ROLE_DEFINITION_CHANGE audit event
    // await writeAdminAuditLog({
    //   req,
    //   actorUserId: user.id,
    //   actorEmail: user.email,
    //   action: 'ADMIN_ROLE_DEFINITION_CHANGE',
    //   status: 'SUCCESS',
    //   message: `Updated role '${roleName}' permissions`,
    //   meta: {
    //     roleName,
    //     permissions: normalizedPermissions,
    //     reason: reason || null,
    //   },
    // });

    // Return success
    return ok(res, {
      code: 'ADMIN_ROLE_UPDATED',
      message: `Role '${roleName}' permissions updated successfully`,
      data: {
        roleName,
        permissions: normalizedPermissions,
      },
    }, 200);
  } catch (error) {
    console.error('updateAdminRole error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'ADMIN_ROLE_UPDATE_FAILED',
      message: 'Failed to update role permissions',
      details: {},
    }, 500);
  }
}

/**
 * POST /api/v1/admin/users/bulk-status
 * Bulk user status changes (A3)
 * 
 * Request body: {
 *   "action": "suspend",
 *   "userIds": [12, 18, 44],
 *   "reason": "Spam abuse"
 * }
 * 
 * Rules:
 * - Requires PERMISSIONS.ADMIN_USERS_WRITE permission
 * - Max batch size: 50 users
 * - Rejects self-inclusion
 * - Maps actions: activate → ACTIVE, suspend → SUSPENDED
 * - Uses assertCanModifyUser() for each user
 * - Logs audit event for each successful update
 */
export async function bulkUpdateUserStatus(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_USERS_WRITE)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to modify user statuses.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_USERS_WRITE,
        },
      }, 403);
    }

    // Validate request body
    const { action, userIds, reason } = req.body;

    if (!action || typeof action !== 'string') {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Action is required and must be a string',
        details: {},
      }, 400);
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'userIds must be a non-empty array',
        details: {},
      }, 400);
    }

    // Normalize action to lowercase
    const normalizedAction = action.trim().toLowerCase();

    // Map actions to statuses
    const actionToStatusMap = {
      'activate': USER_STATUS.ACTIVE,
      'suspend': USER_STATUS.SUSPENDED,
    };

    if (!actionToStatusMap[normalizedAction]) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: `Invalid action. Must be one of: ${Object.keys(actionToStatusMap).join(', ')}`,
        details: {},
      }, 400);
    }

    const targetStatus = actionToStatusMap[normalizedAction];

    // Validate and normalize userIds
    const normalizedUserIds = [];
    for (const userId of userIds) {
      const parsedId = parseInt(userId);
      if (!isNaN(parsedId) && parsedId > 0) {
        normalizedUserIds.push(parsedId);
      }
    }

    if (normalizedUserIds.length === 0) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'userIds must contain at least one valid user ID',
        details: {},
      }, 400);
    }

    // Check batch size limit (max 50)
    if (normalizedUserIds.length > 50) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Batch size limit exceeded. Maximum 50 users per request.',
        details: {},
      }, 400);
    }

    // Check self-inclusion (actor.id must not appear in userIds)
    const actorId = parseInt(user.id);
    if (normalizedUserIds.includes(actorId)) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Cannot include your own user ID in bulk status changes',
        details: {},
      }, 400);
    }

    // Process each user
    const results = [];
    let updatedCount = 0;
    let skippedCount = 0;

    for (const userId of normalizedUserIds) {
      // Check if actor can modify this user
      const guardResult = assertCanModifyUser({
        actor: user,
        targetUserId: userId,
      });

      if (!guardResult.ok) {
        results.push({
          userId,
          status: 'skipped',
          reason: guardResult.code || 'GUARD_VALIDATION_FAILED',
        });
        skippedCount++;
        continue;
      }

      // Get current user status
      let targetUser;
      try {
        targetUser = await getUserProfile(userId);
      } catch (err) {
        results.push({
          userId,
          status: 'skipped',
          reason: 'USER_NOT_FOUND',
        });
        skippedCount++;
        continue;
      }

      if (!targetUser) {
        results.push({
          userId,
          status: 'skipped',
          reason: 'USER_NOT_FOUND',
        });
        skippedCount++;
        continue;
      }

      // Get current status (normalize to USER_STATUS format)
      // Check both accountStatus and status fields
      const currentStatusRaw = targetUser.accountStatus || targetUser.status || USER_STATUS.ACTIVE;
      let currentStatus;
      
      // Normalize current status to USER_STATUS format
      if (currentStatusRaw === 'ACTIVE' || currentStatusRaw === 'active') {
        currentStatus = USER_STATUS.ACTIVE;
      } else if (currentStatusRaw === 'SUSPENDED' || currentStatusRaw === 'suspended' || currentStatusRaw === 'DISABLED' || currentStatusRaw === 'disabled') {
        currentStatus = USER_STATUS.SUSPENDED;
      } else {
        currentStatus = USER_STATUS.ACTIVE; // Default
      }

      // Skip if status is already the target status
      if (currentStatus === targetStatus) {
        results.push({
          userId,
          status: 'skipped',
          reason: 'STATUS_ALREADY_SET',
        });
        skippedCount++;
        continue;
      }

      // Update status
      try {
        // Use direct SQL update to set SUSPENDED status (bypassing normalizeAccountStatus which maps SUSPENDED to DISABLED)
        const [updateResult] = await pool.query(
          `UPDATE User 
           SET status = ?,
               accountStatus = ?,
               updatedAt = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [targetStatus, targetStatus, userId]
        );

        if (updateResult.affectedRows === 0) {
          results.push({
            userId,
            status: 'skipped',
            reason: 'UPDATE_FAILED',
          });
          skippedCount++;
          continue;
        }

        // Log audit event for successful update (best-effort, non-blocking)
        try {
          const auditResult = await logAdminUserStatusChange({
            actor: user,
            targetUserId: userId,
            fromStatus: currentStatus,
            toStatus: targetStatus,
            reason: reason || null,
            req,
          });
          if (!auditResult.ok) {
            // Log failure but don't throw - audit logging should never break the main flow
            console.error(`[AdminController] Failed to log ADMIN_USER_STATUS_CHANGE for user ${userId}:`, auditResult.error);
          }
        } catch (auditError) {
          // Defensive: catch any unexpected errors and never throw
          console.error(`[AdminController] Unexpected error logging ADMIN_USER_STATUS_CHANGE for user ${userId}:`, auditError);
        }

        results.push({
          userId,
          status: 'updated',
        });
        updatedCount++;
      } catch (updateError) {
        // Individual update failure - skip this user but continue with others
        console.error(`[AdminController] Failed to update status for user ${userId}:`, updateError.message);
        results.push({
          userId,
          status: 'skipped',
          reason: 'UPDATE_FAILED',
        });
        skippedCount++;
        continue;
      }
    }

    // Return summary and results
    return ok(res, {
      code: 'BULK_STATUS_UPDATE_COMPLETE',
      message: 'Bulk status update completed',
      data: {
        summary: {
          requested: normalizedUserIds.length,
          updated: updatedCount,
          skipped: skippedCount,
        },
        results,
      },
    }, 200);
  } catch (error) {
    console.error('bulkUpdateUserStatus error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to process bulk status update',
      details: {},
    }, 500);
  }
}

/**
 * GET /api/v1/admin/settings
 * Get all platform settings
 * Requires: PERMISSIONS.ADMIN_SETTINGS_READ permission
 * 
 * Returns all settings from registry with current DB values merged over defaults.
 */
export async function getAllSettings(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_SETTINGS_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to access this resource.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_SETTINGS_READ,
        },
      }, 403);
    }

    // Get all settings (merges DB values over defaults)
    const settings = await getAllPlatformSettings();

    // Return success
    return ok(res, {
      code: 'ADMIN_SETTINGS_OK',
      message: 'Settings retrieved successfully',
      data: { settings },
    }, 200);
  } catch (error) {
    console.error('getAllSettings error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'ADMIN_SETTINGS_LIST_FAILED',
      message: 'Failed to fetch settings',
      details: {},
    }, 500);
  }
}

/**
 * PUT /api/v1/admin/settings/:key
 * Update a single platform setting
 * Requires: PERMISSIONS.ADMIN_SETTINGS_WRITE permission
 * 
 * Request body:
 * {
 *   "value": true,
 *   "reason": "Emergency maintenance" // optional
 * }
 * 
 * Rules:
 * - Validates key exists in registry
 * - Validates value matches declared type
 * - Logs audit event on successful update
 */
export async function setSetting(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_SETTINGS_WRITE)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to modify settings.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_SETTINGS_WRITE,
        },
      }, 403);
    }

    const key = req.params.key;
    if (!key || typeof key !== 'string') {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Setting key is required',
        details: {},
      }, 400);
    }

    const { value, reason } = req.body;

    if (value === undefined || value === null) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Value is required',
        details: {},
      }, 400);
    }

    // Get current value before update (for audit log)
    const valueBefore = await getPlatformSetting(key);

    // Update setting via service
    const result = await setPlatformSetting({
      key,
      value,
      actorUserId: user.id,
    });

    if (!result.ok) {
      // Return appropriate error based on result code
      let statusCode = 400;
      if (result.code === 'TABLE_NOT_FOUND') {
        statusCode = 503; // Service unavailable
      } else if (result.code === 'DATABASE_ERROR') {
        statusCode = 500;
      }

      return fail(res, {
        code: result.code || 'SETTING_UPDATE_FAILED',
        message: result.reason || 'Failed to update setting',
        details: {},
      }, statusCode);
    }

    // Log audit event (best-effort, non-blocking)
    try {
      await logAdminSettingsChange({
        actor: user,
        key,
        valueBefore,
        valueAfter: result.value,
        reason: reason || null,
        req,
      });
    } catch (auditError) {
      // Silently fail - audit logging should not break settings update
      console.error('[AdminController] Failed to log settings change audit:', auditError);
    }

    // Return success with updated value
    return ok(res, {
      code: 'ADMIN_SETTING_UPDATED',
      message: `Setting '${key}' updated successfully`,
      data: {
        key: result.key,
        value: result.value,
      },
    }, 200);
  } catch (error) {
    console.error('setSetting error:', error, { requestId: req.requestId });
    return fail(res, {
      code: 'SETTING_UPDATE_FAILED',
      message: 'Failed to update setting',
      details: {},
    }, 500);
  }
}

/**
 * GET /api/v1/admin/health
 * Get system health status for all core services
 * Requires: SYSTEM_HEALTH_READ permission
 */
export async function getSystemHealthStatus(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.SYSTEM_HEALTH_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to access this resource.',
        details: {
          requiredPermission: PERMISSIONS.SYSTEM_HEALTH_READ,
        },
      }, 403);
    }

    // Get health status (service never throws, always returns safe response)
    const healthData = await getSystemHealth();

    // Return success response
    return ok(res, {
      code: 'SYSTEM_HEALTH_OK',
      message: 'System health retrieved successfully',
      data: healthData,
    }, 200);
  } catch (error) {
    // Defensive: even if service throws (shouldn't happen), return safe degraded response
    console.error('[Health] Controller error:', error);
    
    return ok(res, {
      code: 'SYSTEM_HEALTH_DEGRADED',
      message: 'System health check encountered an issue',
      data: {
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        services: {
          api: { status: 'OK', latencyMs: 0 },
          db: { status: 'UNKNOWN', latencyMs: null, details: { error: 'Health check failed' } },
          cache: { status: 'UNKNOWN', latencyMs: null },
          queue: { status: 'UNKNOWN', latencyMs: null },
        },
      },
    }, 200);
  }
}

/**
 * GET /api/v1/admin/jobs
 * List system jobs with filtering and pagination
 * Requires: SYSTEM_JOBS_READ permission
 */
export async function listSystemJobs(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.SYSTEM_JOBS_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to view system jobs.',
        details: {
          requiredPermission: PERMISSIONS.SYSTEM_JOBS_READ,
        },
      }, 403);
    }

    // Parse query parameters
    const status = req.query.status || undefined;
    const q = req.query.q || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = Math.max(0, parseInt(req.query.offset) || 0);

    // Call queue adapter (never throws)
    const result = await listJobs({ status, q, limit, offset });

    // Return response
    return ok(res, {
      code: result.configured ? 'SYSTEM_JOBS_LIST_OK' : 'SYSTEM_JOBS_NOT_CONFIGURED',
      message: result.configured 
        ? 'Jobs retrieved successfully' 
        : 'Queue system is not configured',
      data: {
        configured: result.configured,
        total: result.total,
        jobs: result.jobs || [],
      },
    }, 200);
  } catch (error) {
    console.error('[Jobs] Controller error:', error);
    // Defensive: return safe error response
    return fail(res, {
      code: 'SYSTEM_JOBS_ERROR',
      message: 'Failed to retrieve jobs. Please try again.',
    }, 500);
  }
}

/**
 * GET /api/v1/admin/jobs/:jobId
 * Get job details by ID
 * Requires: SYSTEM_JOBS_READ permission
 */
export async function getSystemJob(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.SYSTEM_JOBS_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to view system jobs.',
        details: {
          requiredPermission: PERMISSIONS.SYSTEM_JOBS_READ,
        },
      }, 403);
    }

    const jobId = req.params.jobId;
    if (!jobId) {
      return fail(res, {
        code: 'INVALID_JOB_ID',
        message: 'Job ID is required.',
      }, 400);
    }

    // Call queue adapter (never throws)
    const result = await getJob(jobId);

    if (!result.configured) {
      return ok(res, {
        code: 'QUEUE_NOT_CONFIGURED',
        message: 'Queue system is not configured.',
        data: {
          configured: false,
          job: null,
        },
      }, 200);
    }

    if (!result.ok || !result.job) {
      return fail(res, {
        code: result.code || 'JOB_NOT_FOUND',
        message: 'Job not found.',
      }, 404);
    }

    // Return job details
    return ok(res, {
      code: 'SYSTEM_JOB_OK',
      message: 'Job retrieved successfully',
      data: {
        configured: true,
        job: result.job,
      },
    }, 200);
  } catch (error) {
    console.error('[Jobs] Controller error:', error);
    // Defensive: return safe error response
    return fail(res, {
      code: 'SYSTEM_JOBS_ERROR',
      message: 'Failed to retrieve job. Please try again.',
    }, 500);
  }
}

/**
 * POST /api/v1/admin/jobs/:jobId/retry
 * Retry a failed job
 * Requires: SYSTEM_JOBS_WRITE permission
 */
export async function retrySystemJob(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.SYSTEM_JOBS_WRITE)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to retry jobs.',
        details: {
          requiredPermission: PERMISSIONS.SYSTEM_JOBS_WRITE,
        },
      }, 403);
    }

    const jobId = req.params.jobId;
    if (!jobId) {
      return fail(res, {
        code: 'INVALID_JOB_ID',
        message: 'Job ID is required.',
      }, 400);
    }

    // Call queue adapter (never throws)
    const result = await retryJob(jobId);

    if (!result.configured) {
      return ok(res, {
        code: 'QUEUE_NOT_CONFIGURED',
        message: 'Queue system is not configured. Cannot retry job.',
        data: {
          configured: false,
          result: null,
        },
      }, 200);
    }

    if (!result.ok) {
      return fail(res, {
        code: result.code || 'JOB_RETRY_FAILED',
        message: 'Failed to retry job.',
      }, 400);
    }

    // Return success
    return ok(res, {
      code: 'SYSTEM_JOB_RETRY_OK',
      message: 'Job retry initiated successfully',
      data: {
        configured: true,
        result: result.result,
      },
    }, 200);
  } catch (error) {
    console.error('[Jobs] Controller error:', error);
    // Defensive: return safe error response
    return fail(res, {
      code: 'SYSTEM_JOBS_ERROR',
      message: 'Failed to retry job. Please try again.',
    }, 500);
  }
}

/**
 * POST /api/v1/admin/jobs/:jobId/cancel
 * Cancel a queued or running job
 * Requires: SYSTEM_JOBS_WRITE permission
 */
export async function cancelSystemJob(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.SYSTEM_JOBS_WRITE)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to cancel jobs.',
        details: {
          requiredPermission: PERMISSIONS.SYSTEM_JOBS_WRITE,
        },
      }, 403);
    }

    const jobId = req.params.jobId;
    if (!jobId) {
      return fail(res, {
        code: 'INVALID_JOB_ID',
        message: 'Job ID is required.',
      }, 400);
    }

    // Call queue adapter (never throws)
    const result = await cancelJob(jobId);

    if (!result.configured) {
      return ok(res, {
        code: 'QUEUE_NOT_CONFIGURED',
        message: 'Queue system is not configured. Cannot cancel job.',
        data: {
          configured: false,
          result: null,
        },
      }, 200);
    }

    if (!result.ok) {
      return fail(res, {
        code: result.code || 'JOB_CANCEL_FAILED',
        message: 'Failed to cancel job.',
      }, 400);
    }

    // Return success
    return ok(res, {
      code: 'SYSTEM_JOB_CANCEL_OK',
      message: 'Job cancel initiated successfully',
      data: {
        configured: true,
        result: result.result,
      },
    }, 200);
  } catch (error) {
    console.error('[Jobs] Controller error:', error);
    // Defensive: return safe error response
    return fail(res, {
      code: 'SYSTEM_JOBS_ERROR',
      message: 'Failed to cancel job. Please try again.',
    }, 500);
  }
}

/**
 * GET /api/v1/admin/sessions
 * List admin sessions with filtering and pagination
 * Requires: ADMIN_SESSIONS_READ permission
 */
export async function listAdminSessions(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_SESSIONS_READ)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to view admin sessions.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_SESSIONS_READ,
        },
      }, 403);
    }

    // Parse query parameters
    const status = req.query.status || 'all';
    const q = req.query.q || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = Math.max(0, parseInt(req.query.offset) || 0);

    // Call service (never throws)
    const result = await listAdminSessionsService({ status, q, limit, offset });

    if (!result.ok) {
      return fail(res, {
        code: 'SESSIONS_LIST_ERROR',
        message: 'Failed to retrieve sessions. Please try again.',
      }, 500);
    }

    // Return response
    return ok(res, {
      code: 'ADMIN_SESSIONS_LIST_OK',
      message: 'Admin sessions retrieved successfully',
      data: {
        total: result.total,
        sessions: result.sessions || [],
      },
    }, 200);
  } catch (error) {
    console.error('[AdminSessions] Controller error:', error);
    // Defensive: return safe error response
    return fail(res, {
      code: 'ADMIN_SESSIONS_ERROR',
      message: 'Failed to retrieve sessions. Please try again.',
    }, 500);
  }
}

/**
 * POST /api/v1/admin/sessions/:sessionId/revoke
 * Revoke an admin session (force logout)
 * Requires: ADMIN_SESSIONS_WRITE permission
 */
export async function revokeAdminSessionEndpoint(req, res) {
  try {
    // Check permission
    const user = req.currentUser || req.user;
    if (!hasPermission(user, PERMISSIONS.ADMIN_SESSIONS_WRITE)) {
      return fail(res, {
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission to revoke sessions.',
        details: {
          requiredPermission: PERMISSIONS.ADMIN_SESSIONS_WRITE,
        },
      }, 403);
    }

    const sessionId = req.params.sessionId;
    if (!sessionId) {
      return fail(res, {
        code: 'INVALID_SESSION_ID',
        message: 'Session ID is required.',
      }, 400);
    }

    // Get reason and confirmSelf from body
    const { reason, confirmSelf } = req.body || {};

    // Check if trying to revoke own session (prevent self-lockout)
    const currentSessionId = req.sessionId || (req.session && req.session.id);
    if (String(sessionId) === String(currentSessionId) && !confirmSelf) {
      return fail(res, {
        code: 'SELF_SESSION_REVOKE_CONFIRM_REQUIRED',
        message: 'You are attempting to revoke your current session. This will log you out. Please confirm by setting confirmSelf: true in the request body.',
      }, 400);
    }

    // Call service (never throws)
    const result = await revokeAdminSessionService({
      sessionId,
      actorUserId: user.id,
      reason,
    });

    if (!result.ok) {
      return fail(res, {
        code: result.code || 'SESSION_REVOKE_ERROR',
        message: result.reason || 'Failed to revoke session. Please try again.',
      }, 400);
    }

    if (!result.revoked) {
      // Session was already revoked/expired
      return ok(res, {
        code: result.code || 'SESSION_ALREADY_REVOKED',
        message: result.reason || 'Session was already revoked or expired.',
        data: {
          revoked: false,
        },
      }, 200);
    }

    // Log audit event (best-effort, non-blocking)
    if (result.targetUserId) {
      logAdminSessionRevoke({
        actor: user,
        sessionId,
        targetUserId: result.targetUserId,
        reason,
        req,
      }).catch(err => {
        console.error('[AdminSessions] Failed to log audit event (non-fatal):', err);
      });
    }

    // Return success
    return ok(res, {
      code: 'ADMIN_SESSION_REVOKED',
      message: 'Session revoked successfully',
      data: {
        revoked: true,
      },
    }, 200);
  } catch (error) {
    console.error('[AdminSessions] Controller error:', error);
    // Defensive: return safe error response
    return fail(res, {
      code: 'ADMIN_SESSIONS_ERROR',
      message: 'Failed to revoke session. Please try again.',
    }, 500);
  }
}

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
import {
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
} from '../services/sessionService.js';
import { assignRole, revokeRole, getUserRoles, getPrimaryRole } from '../services/roleService.js';
import { setFeatureFlag, bulkSetFeatureFlags } from '../services/featureFlagService.js';
import { logAdminAction, listAdminAuditLogs } from '../services/adminAuditLogService.js';
import { sendOk, sendError, ok, fail } from '../utils/apiResponse.js';
import { getAdminNavigationForUser } from '../services/adminNavigationService.js';
import pool from '../db.js';

/**
 * GET /api/v1/admin/users
 * List users with pagination, search, and filtering
 * Schema-drift tolerant: never crashes on missing columns
 */
export async function listAdminUsers(req, res) {
  try {
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
 */
export async function getAdminUserDetail(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId || isNaN(userId)) {
      return fail(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        details: {},
      }, 400);
    }

    // Get admin-safe user detail (schema-drift tolerant)
    const user = await getAdminUserDetailService(userId);
    if (!user) {
      return fail(res, {
        code: 'ADMIN_USER_NOT_FOUND',
        message: 'User not found',
        details: {},
      }, 404);
    }

    // Return success with admin user shape
    return ok(res, {
      code: 'ADMIN_USER_DETAILS_OK',
      message: 'User details retrieved successfully',
      data: { user },
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
    const navigation = getAdminNavigationForUser(user);

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
 * PUT /api/v1/admin/users/:userId/role
 * Update user role
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
    const { accountStatus } = req.body;
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

    // Log to admin audit log
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

    // Log to admin audit log
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
 */
export async function getAdminAuditLogs(req, res) {
  try {
    // Parse and validate query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    
    const action = req.query.action || null;
    const actorId = req.query.actorId ? parseInt(req.query.actorId) : null;
    const targetType = req.query.targetType || null;
    const dateFrom = req.query.dateFrom || null;
    const dateTo = req.query.dateTo || null;
    const q = req.query.q || null;

    // Validate actorId if provided
    if (req.query.actorId && (isNaN(actorId) || actorId <= 0)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid actorId parameter',
        statusCode: 400
      });
    }

    // Call service to get audit logs
    const result = await listAdminAuditLogs({
      page,
      pageSize,
      action,
      actorId,
      targetType,
      dateFrom,
      dateTo,
      q,
    });

    // Return standardized response
    return sendOk(res, {
      items: result.items || [],
      pagination: result.pagination || {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error('getAdminAuditLogs error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch audit logs',
      statusCode: 500
    });
  }
}

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
import {
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
} from '../services/sessionService.js';
import { sendOk, sendError } from '../utils/apiResponse.js';
import pool from '../db.js';

/**
 * GET /api/v1/admin/users
 * List users with pagination, search, and filtering
 */
export async function listAdminUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    const result = await searchUsers({
      page,
      limit,
      search,
      role: role || undefined,
      status: status || undefined,
    });

    return sendOk(res, result);
  } catch (error) {
    console.error('listAdminUsers error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch users',
      statusCode: 500
    });
  }
}

/**
 * GET /api/v1/admin/users/:userId
 * Get detailed user information for admin view
 */
export async function getAdminUserDetail(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (!userId || isNaN(userId)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    // Get full user profile with role/permissions/flags
    const user = await getUserWithAccessData(userId);
    if (!user) {
      return sendError(res, {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        statusCode: 404
      });
    }

    // Get recent activity (last 20)
    const activities = await getUserActivityLog(userId, { limit: 20 });

    // Get devices (last 10)
    const devices = await getUserDevices(userId);
    const recentDevices = devices.slice(0, 10);

    // Remove sensitive fields
    const { password, ...safeUser } = user;

    return sendOk(res, {
      user: {
        ...safeUser,
        permissions: user.effectivePermissions, // Computed permissions
        featureFlags: user.featureFlags, // Merged feature flags
      },
      recentActivity: activities,
      devices: recentDevices,
    });
  } catch (error) {
    console.error('getAdminUserDetail error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch user details',
      statusCode: 500
    });
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

    // Update role
    const updatedUser = await updateUserRole(userId, role);

    // If role is SUSPENDED or BANNED, also update accountStatus
    if (role === 'SUSPENDED' || role === 'BANNED') {
      await updateUserStatus(userId, role === 'SUSPENDED' ? 'SUSPENDED' : 'BANNED');
    }

    // Log activity
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
          oldRole,
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

    // Validate status
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];
    if (!validStatuses.includes(accountStatus)) {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid account status',
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

    const oldStatus = currentUser.accountStatus || 'ACTIVE';

    // Update status
    const updatedUser = await updateUserStatus(userId, accountStatus);

    // Sync role if status is SUSPENDED or BANNED
    if (accountStatus === 'SUSPENDED' && updatedUser.role !== 'SUSPENDED') {
      await updateUserRole(userId, 'SUSPENDED');
    } else if (accountStatus === 'BANNED' && updatedUser.role !== 'BANNED') {
      await updateUserRole(userId, 'BANNED');
    } else if (accountStatus === 'ACTIVE' && (updatedUser.role === 'SUSPENDED' || updatedUser.role === 'BANNED')) {
      // If reactivating, restore to STANDARD_USER (unless they have a different role)
      // Don't auto-change role on reactivation - let admin decide
    }

    // Log activity
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
          newStatus: accountStatus,
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

    // Update feature flags (merge with existing)
    const updatedUser = await updateUserFeatureFlags(userId, featureFlags);

    // Log activity
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
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid user ID',
        statusCode: 400
      });
    }

    const devices = await getUserDevices(userId);

    return sendOk(res, { devices });
  } catch (error) {
    console.error('getAdminUserDevices error:', error);
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Failed to fetch user devices',
      statusCode: 500
    });
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

    // Record admin activity
    const adminUserId = req.user?.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
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

    // Record admin activity
    const adminUserId = req.user?.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
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

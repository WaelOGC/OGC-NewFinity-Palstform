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

    return res.json({
      status: 'OK',
      data: result,
    });
  } catch (error) {
    console.error('listAdminUsers error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to fetch users',
      code: 'INTERNAL_ERROR',
      error: error.message,
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    // Get full user profile with role/permissions/flags
    const user = await getUserWithAccessData(userId);
    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Get recent activity (last 20)
    const activities = await getUserActivityLog(userId, { limit: 20 });

    // Get devices (last 10)
    const devices = await getUserDevices(userId);
    const recentDevices = devices.slice(0, 10);

    // Remove sensitive fields
    const { password, ...safeUser } = user;

    return res.json({
      status: 'OK',
      data: {
        user: {
          ...safeUser,
          permissions: user.effectivePermissions, // Computed permissions
          featureFlags: user.featureFlags, // Merged feature flags
        },
        recentActivity: activities,
        devices: recentDevices,
      },
    });
  } catch (error) {
    console.error('getAdminUserDetail error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to fetch user details',
      code: 'INTERNAL_ERROR',
      error: error.message,
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    if (!role) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Role is required',
        code: 'MISSING_ROLE',
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid role',
        code: 'INVALID_ROLE',
        details: { validRoles },
      });
    }

    // Get current user to log old role
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
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
      await recordUserActivity({
        userId,
        type: 'ROLE_CHANGED',
        ipAddress,
        userAgent,
        metadata: {
          oldRole,
          newRole: role,
          changedBy: adminId,
          changedByEmail: req.user?.email || 'system',
        },
      });
    } catch (activityError) {
      console.error('Failed to record role change activity:', activityError);
    }

    return res.json({
      status: 'OK',
      message: 'User role updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          role: updatedUser.role,
          accountStatus: updatedUser.accountStatus,
        },
      },
    });
  } catch (error) {
    console.error('updateAdminUserRole error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to update user role',
      code: 'INTERNAL_ERROR',
      error: error.message,
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    if (!accountStatus) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Account status is required',
        code: 'MISSING_STATUS',
      });
    }

    // Validate status
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];
    if (!validStatuses.includes(accountStatus)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid account status',
        code: 'INVALID_STATUS',
        details: { validStatuses },
      });
    }

    // Get current user to log old status
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
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
      await recordUserActivity({
        userId,
        type: 'STATUS_CHANGED',
        ipAddress,
        userAgent,
        metadata: {
          oldStatus,
          newStatus: accountStatus,
          changedBy: adminId,
          changedByEmail: req.user?.email || 'system',
        },
      });
    } catch (activityError) {
      console.error('Failed to record status change activity:', activityError);
    }

    return res.json({
      status: 'OK',
      message: 'User account status updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          role: updatedUser.role,
          accountStatus: updatedUser.accountStatus,
        },
      },
    });
  } catch (error) {
    console.error('updateAdminUserStatus error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to update user status',
      code: 'INTERNAL_ERROR',
      error: error.message,
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    if (!featureFlags || typeof featureFlags !== 'object') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Feature flags must be an object',
        code: 'INVALID_FEATURE_FLAGS',
      });
    }

    // Get current user to log old flags
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const oldFlags = currentUser.featureFlags || {};

    // Update feature flags (merge with existing)
    const updatedUser = await updateUserFeatureFlags(userId, featureFlags);

    // Log activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await recordUserActivity({
        userId,
        type: 'FEATURE_FLAGS_UPDATED',
        ipAddress,
        userAgent,
        metadata: {
          oldFlags,
          newFlags: featureFlags,
          changedBy: adminId,
          changedByEmail: req.user?.email || 'system',
        },
      });
    } catch (activityError) {
      console.error('Failed to record feature flags update activity:', activityError);
    }

    // Get merged flags for response
    const defaultFlags = getDefaultFeatureFlags();
    const mergedFlags = mergeFeatureFlags(updatedUser.featureFlags, defaultFlags);

    return res.json({
      status: 'OK',
      message: 'User feature flags updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          featureFlags: mergedFlags,
        },
      },
    });
  } catch (error) {
    console.error('updateAdminUserFeatureFlags error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to update feature flags',
      code: 'INTERNAL_ERROR',
      error: error.message,
    });
  }
}

/**
 * GET /api/v1/admin/users/:userId/activity
 * Get paginated activity log for a user
 */
export async function getAdminUserActivity(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
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

    // Get paginated activities
    const [rows] = await pool.query(
      `SELECT id, activityType, description, ipAddress, userAgent, metadata, createdAt
       FROM UserActivityLog
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Parse metadata JSON
    const activities = rows.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    }));

    return res.json({
      status: 'OK',
      data: {
        items: activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('getAdminUserActivity error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to fetch user activity',
      code: 'INTERNAL_ERROR',
      error: error.message,
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    const devices = await getUserDevices(userId);

    return res.json({
      status: 'OK',
      data: {
        devices,
      },
    });
  } catch (error) {
    console.error('getAdminUserDevices error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to fetch user devices',
      code: 'INTERNAL_ERROR',
      error: error.message,
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    const sessions = await getUserSessions(userId);

    // Ensure we always return an array, even if empty
    return res.json({
      status: 'OK',
      data: {
        sessions: Array.isArray(sessions) ? sessions : [],
      },
    });
  } catch (error) {
    console.error('getAdminUserSessions error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to fetch user sessions',
      code: 'INTERNAL_ERROR',
      error: error.message,
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Session ID is required',
        code: 'MISSING_SESSION_ID',
      });
    }

    const revoked = await revokeSession(sessionId, userId);

    if (!revoked) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // Record admin activity
    const adminUserId = req.user?.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await recordUserActivity({
        userId: adminUserId,
        type: 'ADMIN_SESSION_REVOKED',
        ipAddress,
        userAgent,
        metadata: { targetUserId: userId, sessionId }
      });
    } catch (activityError) {
      console.error('Failed to record admin session revocation activity:', activityError);
    }

    return res.json({
      status: 'OK',
      message: 'Session revoked successfully',
    });
  } catch (error) {
    console.error('revokeAdminUserSession error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to revoke session',
      code: 'INTERNAL_ERROR',
      error: error.message,
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
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid user ID',
        code: 'INVALID_USER_ID',
      });
    }

    const revokedCount = await revokeAllUserSessions(userId);

    // Record admin activity
    const adminUserId = req.user?.id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await recordUserActivity({
        userId: adminUserId,
        type: 'ADMIN_SESSIONS_REVOKED_ALL',
        ipAddress,
        userAgent,
        metadata: { targetUserId: userId, revokedCount }
      });
    } catch (activityError) {
      console.error('Failed to record admin sessions revocation activity:', activityError);
    }

    return res.json({
      status: 'OK',
      message: `Revoked ${revokedCount} session(s)`,
      data: { revokedCount },
    });
  } catch (error) {
    console.error('revokeAllAdminUserSessions error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to revoke sessions',
      code: 'INTERNAL_ERROR',
      error: error.message,
    });
  }
}

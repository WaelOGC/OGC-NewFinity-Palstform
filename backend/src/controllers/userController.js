import {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUserActivityLog,
  recordUserActivity,
  getUserDevices,
  revokeDevice,
  getTwoFactorStatus,
  beginTwoFactorSetup,
  verifyTwoFactorCode,
  enableTwoFactor,
  disableTwoFactor,
  getUserWithAccessData,
  getEffectivePermissions,
  mergeFeatureFlags,
  getDefaultFeatureFlags,
  softDeleteUserAccount,
} from "../services/userService.js";
import {
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
  revokeAllUserSessions,
} from "../services/sessionService.js";
import { sendOk, sendError } from "../utils/apiResponse.js";
import { sendPasswordChangedAlertEmail, sendTwoFactorStatusChangedEmail } from "../services/emailService.js";
import { logUserActivity } from "../services/activityService.js";
import pool from "../db.js";
import bcrypt from "bcryptjs";

export async function listUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.json({ status: "OK", users });
  } catch (error) {
    console.error("listUsers error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}

export async function getUser(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ status: "ERROR", message: "Invalid ID" });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ status: "ERROR", message: "User not found" });
    }

    return res.json({ status: "OK", user });
  } catch (error) {
    console.error("getUser error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch user",
      error: error.message,
    });
  }
}

export async function createUserHandler(req, res) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "ERROR", message: "email and password are required" });
    }

    const newUser = await createUser({ email, password, fullName });
    return res.status(201).json({ status: "OK", user: newUser });
  } catch (error) {
    console.error("createUserHandler error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ status: "ERROR", message: "Email already exists" });
    }
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to create user",
      error: error.message,
    });
  }
}

export async function deleteUserHandler(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ status: "ERROR", message: "Invalid ID" });
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ status: "ERROR", message: "User not found" });
    }

    return res.json({ status: "OK", message: "User deleted" });
  } catch (error) {
    console.error("deleteUserHandler error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to delete user",
      error: error.message,
    });
  }
}

// ============================================================================
// Account System Expansion (Phase 1) - Profile Management Controllers
// ============================================================================
// TODO: Expand in Phase 2 (permissions, device tracking, verification, wallet linking)

/**
 * GET /api/v1/user/profile
 * Get current user's profile
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const profile = await getUserProfile(userId);
    if (!profile) {
      return sendError(res, {
        code: "PROFILE_NOT_FOUND",
        message: "Profile not found",
        statusCode: 404
      });
    }

    // Remove sensitive fields before sending
    const { password, ...safeProfile } = profile;
    
    return sendOk(res, { profile: safeProfile });
  } catch (error) {
    console.error("getProfile error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to fetch profile",
      statusCode: 500
    });
  }
}

/**
 * PUT /api/v1/user/profile
 * Update current user's profile
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const updatedProfile = await updateUserProfile(userId, req.body);
    
    // Phase 2: Record profile update activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: userId,
        type: 'PROFILE_UPDATED',
        ipAddress,
        userAgent,
        metadata: { updatedFields: Object.keys(req.body) }
      });
    } catch (activityError) {
      console.error('Failed to record profile update activity:', activityError);
    }
    
    // Remove sensitive fields before sending
    const { password, ...safeProfile } = updatedProfile;
    
    return sendOk(res, { profile: safeProfile });
  } catch (error) {
    console.error("updateProfile error:", error);
    
    // Handle duplicate username error
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, {
        code: "USERNAME_EXISTS",
        message: "Username already taken",
        statusCode: 409
      });
    }
    
    if (error.message === "No valid fields to update") {
      return sendError(res, {
        code: "VALIDATION_ERROR",
        message: error.message,
        statusCode: 400
      });
    }
    
    if (error.message === "User not found") {
      return sendError(res, {
        code: "USER_NOT_FOUND",
        message: error.message,
        statusCode: 404
      });
    }
    
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to update profile",
      statusCode: 500
    });
  }
}

/**
 * PUT /api/v1/user/change-password
 * Change user password
 */
export async function changePasswordHandler(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, {
        code: "VALIDATION_ERROR",
        message: "currentPassword and newPassword are required",
        statusCode: 400
      });
    }

    if (newPassword.length < 8) {
      return sendError(res, {
        code: "VALIDATION_ERROR",
        message: "New password must be at least 8 characters",
        statusCode: 400
      });
    }

    await changePassword(userId, currentPassword, newPassword);
    
    // Phase 8.6: Record password change activity
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(",")[0].trim() || req.socket?.remoteAddress || req.connection.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    try {
      await logUserActivity({
        userId,
        actorId: userId, // Self-action
        type: 'PASSWORD_CHANGED',
        ipAddress,
        userAgent,
        metadata: {
          via: 'SELF_CHANGE'
        }
      });
    } catch (activityError) {
      console.error('Failed to record password change activity:', activityError);
    }
    
    // Phase 8.3: Send password changed alert email
    try {
      // Get user email for the alert
      const userProfile = await getUserProfile(userId);
      if (userProfile && userProfile.email) {
        await sendPasswordChangedAlertEmail({
          to: userProfile.email,
          changedAt: new Date(),
          ipAddress,
          userAgent,
        });
      }
    } catch (emailErr) {
      // Do NOT fail the password change if email fails
      console.warn("[User] Failed to send password-changed alert:", emailErr);
    }
    
    return sendOk(res, { message: "Password changed successfully" });
  } catch (error) {
    console.error("changePasswordHandler error:", error);
    
    if (error.message === "Current password is incorrect") {
      return sendError(res, {
        code: "INVALID_PASSWORD",
        message: error.message,
        statusCode: 401
      });
    }
    
    if (error.message === "User not found") {
      return sendError(res, {
        code: "USER_NOT_FOUND",
        message: error.message,
        statusCode: 404
      });
    }
    
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to change password",
      statusCode: 500
    });
  }
}

/**
 * GET /api/v1/user/security/activity
 * Get user's security activity log (Phase 8.6 - Normalized response)
 */
export async function getSecurityActivity(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const limit = parseInt(req.query.limit) || 50;

    // Query UserActivityLog directly with normalized structure
    // Handle missing table gracefully
    let rows = [];
    try {
      const [result] = await pool.query(
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
        LIMIT ?
        `,
        [userId, limit]
      );
      rows = result;
    } catch (err) {
      // Table doesn't exist yet (migration not run), return empty array
      if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
        rows = [];
      } else {
        throw err;
      }
    }

    // Normalize response format
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
    
    return sendOk(res, { items });
  } catch (error) {
    console.error("getSecurityActivity error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to fetch activity log",
      statusCode: 500
    });
  }
}

/**
 * GET /api/v1/user/security/devices
 * Get user's registered devices
 */
export async function getSecurityDevices(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const devices = await getUserDevices(userId);
    
    // Ensure we always return an array, even if empty
    return sendOk(res, { devices: Array.isArray(devices) ? devices : [] });
  } catch (error) {
    console.error("getSecurityDevices error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to fetch devices",
      statusCode: 500
    });
  }
}

/**
 * DELETE /api/v1/user/security/devices/:deviceId
 * Revoke a device
 */
export async function revokeSecurityDevice(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const { deviceId } = req.params;
    if (!deviceId) {
      return sendError(res, {
        code: "VALIDATION_ERROR",
        message: "Device ID is required",
        statusCode: 400
      });
    }

    const revoked = await revokeDevice({ userId, deviceId });
    
    if (!revoked) {
      return sendError(res, {
        code: "DEVICE_NOT_FOUND",
        message: "Device not found",
        statusCode: 404
      });
    }

    // Record device revocation activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: userId,
        type: 'DEVICE_REVOKED',
        ipAddress,
        userAgent,
        metadata: { deviceId }
      });
    } catch (activityError) {
      console.error('Failed to record device revocation activity:', activityError);
    }
    
    return sendOk(res, { message: "Device revoked successfully" });
  } catch (error) {
    console.error("revokeSecurityDevice error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to revoke device",
      statusCode: 500
    });
  }
}

/**
 * GET /api/v1/user/security/2fa/status
 * Get 2FA status for the user
 */
export async function getTwoFactorStatusHandler(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const status = await getTwoFactorStatus(userId);
    
    // Normalize response to use isEnabled instead of enabled
    return sendOk(res, {
      isEnabled: status.enabled || false,
      lastVerifiedAt: status.enabledAt || null,
      method: status.method || null,
    });
  } catch (error) {
    console.error("getTwoFactorStatusHandler error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to fetch 2FA status",
      statusCode: 500
    });
  }
}

/**
 * POST /api/v1/user/security/2fa/setup
 * Two-step 2FA setup flow:
 * - step: "start" -> Generate secret and return otpauth URL
 * - step: "verify" + token -> Verify TOTP code and enable 2FA
 */
export async function setupTwoFactorHandler(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const { step, token } = req.body;

    if (step === 'start') {
      // Get user email for QR code label
      const [userRows] = await pool.query(
        'SELECT email FROM User WHERE id = ?',
        [userId]
      );
      
      if (userRows.length === 0) {
        return sendError(res, {
          code: "USER_NOT_FOUND",
          message: "User not found",
          statusCode: 404
        });
      }

      const userEmail = userRows[0].email;
      const setupData = await beginTwoFactorSetup(userId, userEmail);
      
      return sendOk(res, {
        otpauthUrl: setupData.otpauthUrl,
        secretMasked: setupData.secretMasked,
        method: setupData.method
      });
    } else if (step === 'verify') {
      if (!token || !/^\d{6}$/.test(token)) {
        return sendError(res, {
          code: "VALIDATION_ERROR",
          message: "Invalid token. Please enter a 6-digit code.",
          statusCode: 400
        });
      }

      // Verify the TOTP code
      try {
        await verifyTwoFactorCode({ userId, token });
        
        // Enable 2FA after successful verification
        await enableTwoFactor(userId);
        
        // Get user email for security alert
        const [userRows] = await pool.query(
          'SELECT email FROM User WHERE id = ?',
          [userId]
        );
        const userEmail = userRows[0]?.email;
        
        // Record 2FA enable activity
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(",")[0].trim() || req.socket?.remoteAddress || req.connection.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        try {
          await logUserActivity({
            userId,
            actorId: userId,
            type: 'TWO_FACTOR_ENABLED',
            ipAddress,
            userAgent,
            metadata: { method: 'TOTP' }
          });
        } catch (activityError) {
          console.error('Failed to record 2FA enable activity:', activityError);
        }
        
        // Phase 8.5: Send 2FA enabled alert email
        if (userEmail) {
          try {
            await sendTwoFactorStatusChangedEmail({
              to: userEmail,
              enabled: true,
              at: new Date(),
              ipAddress,
              userAgent,
            });
          } catch (emailErr) {
            // Do NOT fail the 2FA enable if email fails
            console.warn("[2FA] Failed to send 2FA change alert:", emailErr);
          }
        }
        
        return sendOk(res, {
          isEnabled: true,
          method: 'totp'
        });
      } catch (verifyError) {
        return sendError(res, {
          code: "TWO_FACTOR_INVALID_TOKEN",
          message: verifyError.message || "Invalid 2FA code. Please try again.",
          statusCode: 400
        });
      }
    } else {
      return sendError(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid step. Use 'start' or 'verify'.",
        statusCode: 400
      });
    }
  } catch (error) {
    console.error("setupTwoFactorHandler error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to setup 2FA",
      statusCode: 500
    });
  }
}

/**
 * POST /api/v1/user/security/2fa/verify
 * Verify 2FA code and enable 2FA
 * Body: { code: "123456" }
 */
export async function verifyTwoFactorHandler(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const { code } = req.body;

    if (!code || !/^\d{6}$/.test(code)) {
      return sendError(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid code. Please enter a 6-digit code.",
        statusCode: 400
      });
    }

    // Verify the TOTP code
    try {
      await verifyTwoFactorCode({ userId, token: code });
      
      // Enable 2FA after successful verification
      await enableTwoFactor(userId);
      
      // Get user email for security alert
      const [userRows] = await pool.query(
        'SELECT email FROM User WHERE id = ?',
        [userId]
      );
      const userEmail = userRows[0]?.email;
      
      // Record 2FA enable activity
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(",")[0].trim() || req.socket?.remoteAddress || req.connection.remoteAddress || null;
      const userAgent = req.headers['user-agent'] || null;
      try {
        await recordUserActivity({
          userId,
          type: 'TWO_FACTOR_ENABLED',
          ipAddress,
          userAgent,
          metadata: {}
        });
      } catch (activityError) {
        console.error('Failed to record 2FA enable activity:', activityError);
      }
      
      // Phase 8.5: Send 2FA enabled alert email
      if (userEmail) {
        try {
          await sendTwoFactorStatusChangedEmail({
            to: userEmail,
            enabled: true,
            at: new Date(),
            ipAddress,
            userAgent,
          });
        } catch (emailErr) {
          // Do NOT fail the 2FA enable if email fails
          console.warn("[2FA] Failed to send 2FA change alert:", emailErr);
        }
      }
      
      return sendOk(res, {
        isEnabled: true,
        method: 'totp'
      });
    } catch (verifyError) {
      return sendError(res, {
        code: "INVALID_2FA_CODE",
        message: verifyError.message || "Invalid authentication code",
        statusCode: 400
      });
    }
  } catch (error) {
    console.error("verifyTwoFactorHandler error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to verify 2FA code",
      statusCode: 500
    });
  }
}

/**
 * POST /api/v1/user/security/2fa/disable
 * Disable 2FA for the user
 */
export async function disableTwoFactorHandler(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    await disableTwoFactor(userId);
    
    // Get user email for security alert
    const [userRows] = await pool.query(
      'SELECT email FROM User WHERE id = ?',
      [userId]
    );
    const userEmail = userRows[0]?.email;
    
    // Record 2FA disable activity
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(",")[0].trim() || req.socket?.remoteAddress || req.connection.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    try {
      await logUserActivity({
        userId,
        actorId: userId,
        type: 'TWO_FACTOR_DISABLED',
        ipAddress,
        userAgent,
        metadata: { method: 'TOTP' }
      });
    } catch (activityError) {
      console.error('Failed to record 2FA disable activity:', activityError);
    }
    
    // Phase 8.5: Send 2FA disabled alert email
    if (userEmail) {
      try {
        await sendTwoFactorStatusChangedEmail({
          to: userEmail,
          enabled: false,
          at: new Date(),
          ipAddress,
          userAgent,
        });
      } catch (emailErr) {
        // Do NOT fail the 2FA disable if email fails
        console.warn("[2FA] Failed to send 2FA change alert:", emailErr);
      }
    }
    
    return sendOk(res, { 
      isEnabled: false,
      message: "2FA disabled successfully" 
    });
  } catch (error) {
    console.error("disableTwoFactorHandler error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to disable 2FA",
      statusCode: 500
    });
  }
}

// ============================================================================
// Phase 7.1 - Active Sessions & Device Security Controllers
// ============================================================================

/**
 * GET /api/v1/user/security/sessions
 * Get all active sessions for the current user
 * Returns: { status: "OK", data: { sessions: [...] } }
 */
export async function getSecuritySessions(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    // Get current token to identify current session
    const {
      JWT_COOKIE_ACCESS_NAME = 'ogc_access',
    } = process.env;
    const tokenFromCookie = req.cookies && req.cookies[JWT_COOKIE_ACCESS_NAME];
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const currentToken = tokenFromCookie || tokenFromHeader;

    const sessions = await getUserSessions(userId, currentToken);
    
    // Ensure we always return an array, even if empty
    return sendOk(res, { sessions: Array.isArray(sessions) ? sessions : [] });
  } catch (error) {
    console.error("getSecuritySessions error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to fetch sessions",
      statusCode: 500
    });
  }
}

/**
 * POST /api/v1/user/security/sessions/revoke
 * Revoke a specific session
 * Body: { sessionId }
 * Returns: { status: "OK", data: { success: true } }
 */
export async function revokeSecuritySession(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return sendError(res, {
        code: "VALIDATION_ERROR",
        message: "Session ID is required",
        statusCode: 400
      });
    }

    const revoked = await revokeSession(sessionId, userId);
    
    if (!revoked) {
      return sendError(res, {
        code: "SESSION_NOT_FOUND",
        message: "Session not found",
        statusCode: 404
      });
    }

    // Record activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: userId,
        type: 'SESSION_REVOKED',
        ipAddress,
        userAgent,
        metadata: { targetSessionId: sessionId }
      });
    } catch (activityError) {
      console.error('Failed to record session revocation activity:', activityError);
    }
    
    return sendOk(res, { success: true });
  } catch (error) {
    console.error("revokeSecuritySession error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to revoke session",
      statusCode: 500
    });
  }
}

/**
 * POST /api/v1/user/security/sessions/revoke-all-others
 * Revoke all sessions except the current one
 */
export async function revokeAllOtherSecuritySessions(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    // Get current token
    const {
      JWT_COOKIE_ACCESS_NAME = 'ogc_access',
    } = process.env;
    const tokenFromCookie = req.cookies && req.cookies[JWT_COOKIE_ACCESS_NAME];
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const currentToken = tokenFromCookie || tokenFromHeader;

    if (!currentToken) {
      return sendError(res, {
        code: "VALIDATION_ERROR",
        message: "Current session token not found",
        statusCode: 400
      });
    }

    const revokedCount = await revokeAllOtherSessions(userId, currentToken);

    // Record activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: userId,
        type: 'SESSIONS_REVOKED_ALL_OTHERS',
        ipAddress,
        userAgent,
        metadata: { revokedCount }
      });
    } catch (activityError) {
      console.error('Failed to record sessions revocation activity:', activityError);
    }
    
    return sendOk(res, { success: true });
  } catch (error) {
    console.error("revokeAllOtherSecuritySessions error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to revoke sessions",
      statusCode: 500
    });
  }
}

// ============================================================================
// Account System Expansion (Phase 5) - Role & Permissions Controllers
// ============================================================================

/**
 * GET /api/v1/user/role
 * Get current user's role, permissions, and feature flags
 */
export async function getUserRole(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const user = await getUserWithAccessData(userId);
    if (!user) {
      return sendError(res, {
        code: "USER_NOT_FOUND",
        message: "User not found",
        statusCode: 404
      });
    }

    // Return role, permissions, and feature flags
    return sendOk(res, {
      role: user.role,
      permissions: user.effectivePermissions, // Computed permissions
      featureFlags: user.featureFlags, // Merged feature flags
    });
  } catch (error) {
    console.error("getUserRole error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to fetch user role",
      statusCode: 500
    });
  }
}

/**
 * GET /api/v1/user/features
 * Get current user's feature flags (merged with defaults)
 */
export async function getUserFeatures(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, {
        code: "UNAUTHORIZED",
        message: "Authentication required",
        statusCode: 401
      });
    }

    const user = await getUserProfile(userId);
    if (!user) {
      return sendError(res, {
        code: "USER_NOT_FOUND",
        message: "User not found",
        statusCode: 404
      });
    }

    // Merge user flags with defaults
    const defaultFlags = getDefaultFeatureFlags();
    const mergedFlags = mergeFeatureFlags(user.featureFlags, defaultFlags);

    return sendOk(res, {
      featureFlags: mergedFlags,
    });
  } catch (error) {
    console.error("getUserFeatures error:", error);
    return sendError(res, {
      code: "DATABASE_ERROR",
      message: "Failed to fetch feature flags",
      statusCode: 500
    });
  }
}

/**
 * POST /api/v1/user/account/delete
 * Delete own account (soft delete with password confirmation) - Phase 9.1
 */
export async function deleteOwnAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password || typeof password !== "string") {
      return sendError(res, {
        statusCode: 400,
        code: "PASSWORD_REQUIRED",
        message: "Please provide your current password to delete your account.",
      });
    }

    // Fetch hashed password from DB
    const [rows] = await pool.query(
      "SELECT id, email, password, status FROM User WHERE id = ? LIMIT 1",
      [userId]
    );
    const user = rows[0];

    if (!user || user.status === "DELETED") {
      return sendError(res, {
        statusCode: 400,
        code: "ACCOUNT_NOT_FOUND",
        message: "Account not found or already deleted.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      await logUserActivity({
        userId: user.id,
        actorId: user.id,
        type: "ACCOUNT_DELETE_FAILED",
        ipAddress:
          req.ip ||
          (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
          req.socket?.remoteAddress ||
          null,
        userAgent: req.headers["user-agent"] || null,
        metadata: {
          reason: "INVALID_PASSWORD",
        },
      });

      return sendError(res, {
        statusCode: 401,
        code: "INVALID_PASSWORD",
        message: "The password you entered is incorrect.",
      });
    }

    const ipAddress =
      req.ip ||
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      null;

    const userAgent = req.headers["user-agent"] || null;

    // Soft delete
    const { deletedAt } = await softDeleteUserAccount(user.id, "USER_SELF_DELETE");

    // Revoke all sessions
    if (typeof revokeAllUserSessions === "function") {
      await revokeAllUserSessions(user.id);
    }

    // Log activity
    await logUserActivity({
      userId: user.id,
      actorId: user.id,
      type: "ACCOUNT_DELETED",
      ipAddress,
      userAgent,
      metadata: {
        via: "SELF",
        deletedAt,
      },
    });

    // Return generic response
    // Frontend will clear cookies and redirect to a goodbye / home page later.
    return sendOk(res, {
      message: "Your account has been deleted.",
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/user/account/export
 * Export own account data as JSON (Phase 9.3)
 */
export async function exportOwnAccountData(req, res, next) {
  try {
    const userId = req.user.id;

    // 1) Basic profile - select all available columns
    // Note: Migration ensures these columns exist, but we handle missing columns gracefully
    const [userRows] = await pool.query(
      `
      SELECT
        id,
        email,
        fullName,
        status,
        role,
        featureFlags,
        permissions,
        termsAccepted,
        termsAcceptedAt,
        termsVersion,
        termsSource,
        createdAt,
        updatedAt,
        deletedAt,
        deletedReason
      FROM User
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );
    
    // Try to get optional profile fields (username, country, bio, phone, avatarUrl)
    // These may not exist if migration hasn't run yet
    let optionalFields = { username: null, country: null, bio: null, phone: null, avatarUrl: null };
    try {
      const [optionalRows] = await pool.query(
        `SELECT username, country, bio, phone, avatarUrl FROM User WHERE id = ? LIMIT 1`,
        [userId]
      );
      if (optionalRows[0]) {
        optionalFields = {
          username: optionalRows[0].username || null,
          country: optionalRows[0].country || null,
          bio: optionalRows[0].bio || null,
          phone: optionalRows[0].phone || null,
          avatarUrl: optionalRows[0].avatarUrl || null,
        };
      }
    } catch (err) {
      // Columns don't exist yet (migration not run), use null values
      // This is expected during initial setup
    }

    const user = userRows[0];

    if (!user) {
      return sendError(res, {
        statusCode: 404,
        code: "ACCOUNT_NOT_FOUND",
        message: "Account not found.",
      });
    }

    // 2) Sessions - handle missing table gracefully
    let sessionRows = [];
    try {
      const [rows] = await pool.query(
        `
        SELECT
          id,
          ipAddress,
          userAgent,
          deviceLabel,
          isCurrent,
          createdAt,
          lastSeenAt
        FROM AuthSession
        WHERE userId = ?
        ORDER BY createdAt DESC
        `,
        [userId]
      );
      sessionRows = rows;
    } catch (err) {
      // Table doesn't exist yet (migration not run), return empty array
      if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
        sessionRows = [];
      } else {
        throw err;
      }
    }

    // 3) Security activity - handle missing table gracefully
    let activityRows = [];
    try {
      const [rows] = await pool.query(
        `
        SELECT
          id,
          activityType as type,
          ipAddress,
          userAgent,
          metadata,
          createdAt,
          actorId
        FROM UserActivityLog
        WHERE userId = ?
        ORDER BY createdAt DESC
        LIMIT 500
        `,
        [userId]
      );
      activityRows = rows;
    } catch (err) {
      // Table doesn't exist yet (migration not run), return empty array
      if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
        activityRows = [];
      } else {
        throw err;
      }
    }

    // 4) 2FA - handle missing table gracefully
    let twoFaRows = [];
    try {
      const [rows] = await pool.query(
        `
        SELECT
          isEnabled,
          enabledAt,
          lastVerifiedAt,
          createdAt,
          updatedAt
        FROM TwoFactorAuth
        WHERE userId = ?
        LIMIT 1
        `,
        [userId]
      );
      twoFaRows = rows;
    } catch (err) {
      // Table doesn't exist yet (migration not run), return empty array
      if (err.code === 'ER_NO_SUCH_TABLE' || err.code === '42S02') {
        twoFaRows = [];
      } else {
        throw err;
      }
    }

    const twoFa = (twoFaRows && twoFaRows.length > 0) ? twoFaRows[0] : null;

    // Normalize JSON fields and add optional profile fields
    const normalizedUser = {
      ...user,
      ...optionalFields,
      featureFlags: user.featureFlags ? (typeof user.featureFlags === 'string' ? JSON.parse(user.featureFlags) : user.featureFlags) : null,
      permissions: user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : null,
    };

    const sessions = sessionRows.map((row) => ({
      id: row.id,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      deviceLabel: row.deviceLabel,
      isCurrent: !!row.isCurrent,
      createdAt: row.createdAt,
      lastSeenAt: row.lastSeenAt,
    }));

    const activity = activityRows.map((row) => ({
      id: row.id,
      type: row.type,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
      createdAt: row.createdAt,
      actorId: row.actorId,
    }));

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user: normalizedUser,
      security: {
        twoFactor: twoFa
          ? {
              isEnabled: !!twoFa.isEnabled,
              enabledAt: twoFa.enabledAt,
              lastVerifiedAt: twoFa.lastVerifiedAt,
              createdAt: twoFa.createdAt,
              updatedAt: twoFa.updatedAt,
            }
          : null,
        sessions,
        activity,
      },
    };

    return sendOk(res, exportPayload);
  } catch (err) {
    return next(err);
  }
}

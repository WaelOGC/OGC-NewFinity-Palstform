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
} from "../services/userService.js";
import pool from "../db.js";

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
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
      });
    }

    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ 
        status: "ERROR", 
        message: "Profile not found" 
      });
    }

    // Remove sensitive fields before sending
    const { password, ...safeProfile } = profile;
    
    return res.json({ 
      status: "OK", 
      profile: safeProfile 
    });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch profile",
      error: error.message,
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
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
      });
    }

    const updatedProfile = await updateUserProfile(userId, req.body);
    
    // Phase 2: Record profile update activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await recordUserActivity({
        userId,
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
    
    return res.json({ 
      status: "OK", 
      message: "Profile updated successfully",
      profile: safeProfile 
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    
    // Handle duplicate username error
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        status: "ERROR",
        message: "Username already taken",
        code: "USERNAME_EXISTS"
      });
    }
    
    if (error.message === "No valid fields to update") {
      return res.status(400).json({
        status: "ERROR",
        message: error.message,
        code: "INVALID_REQUEST"
      });
    }
    
    if (error.message === "User not found") {
      return res.status(404).json({
        status: "ERROR",
        message: error.message,
        code: "USER_NOT_FOUND"
      });
    }
    
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to update profile",
      error: error.message,
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
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "ERROR",
        message: "currentPassword and newPassword are required",
        code: "MISSING_FIELDS"
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: "ERROR",
        message: "New password must be at least 8 characters",
        code: "PASSWORD_TOO_SHORT"
      });
    }

    await changePassword(userId, currentPassword, newPassword);
    
    // Phase 2: Record password change activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await recordUserActivity({
        userId,
        type: 'PASSWORD_CHANGED',
        ipAddress,
        userAgent,
        metadata: {}
      });
    } catch (activityError) {
      console.error('Failed to record password change activity:', activityError);
    }
    
    return res.json({ 
      status: "OK", 
      message: "Password changed successfully" 
    });
  } catch (error) {
    console.error("changePasswordHandler error:", error);
    
    if (error.message === "Current password is incorrect") {
      return res.status(401).json({
        status: "ERROR",
        message: error.message,
        code: "INVALID_PASSWORD"
      });
    }
    
    if (error.message === "User not found") {
      return res.status(404).json({
        status: "ERROR",
        message: error.message,
        code: "USER_NOT_FOUND"
      });
    }
    
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to change password",
      error: error.message,
    });
  }
}

/**
 * GET /api/v1/user/security/activity
 * Get user's security activity log
 */
export async function getSecurityActivity(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const activities = await getUserActivityLog(userId, { limit });
    
    return res.json({ 
      status: "OK", 
      data: { items: activities }
    });
  } catch (error) {
    console.error("getSecurityActivity error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch activity log",
      error: error.message,
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
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
      });
    }

    const devices = await getUserDevices(userId);
    
    return res.json({ 
      status: "OK", 
      data: { devices }
    });
  } catch (error) {
    console.error("getSecurityDevices error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch devices",
      error: error.message,
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
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
      });
    }

    const { deviceId } = req.params;
    if (!deviceId) {
      return res.status(400).json({
        status: "ERROR",
        message: "Device ID is required",
        code: "MISSING_DEVICE_ID"
      });
    }

    const revoked = await revokeDevice({ userId, deviceId });
    
    if (!revoked) {
      return res.status(404).json({
        status: "ERROR",
        message: "Device not found",
        code: "DEVICE_NOT_FOUND"
      });
    }

    // Record device revocation activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await recordUserActivity({
        userId,
        type: 'DEVICE_REVOKED',
        ipAddress,
        userAgent,
        metadata: { deviceId }
      });
    } catch (activityError) {
      console.error('Failed to record device revocation activity:', activityError);
    }
    
    return res.json({ 
      status: "OK", 
      message: "Device revoked successfully" 
    });
  } catch (error) {
    console.error("revokeSecurityDevice error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to revoke device",
      error: error.message,
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
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
      });
    }

    const status = await getTwoFactorStatus(userId);
    
    return res.json({ 
      status: "OK", 
      data: status
    });
  } catch (error) {
    console.error("getTwoFactorStatusHandler error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch 2FA status",
      error: error.message,
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
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
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
        return res.status(404).json({
          status: "ERROR",
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      const userEmail = userRows[0].email;
      const setupData = await beginTwoFactorSetup(userId, userEmail);
      
      return res.json({ 
        status: "OK", 
        data: {
          otpauthUrl: setupData.otpauthUrl,
          secretMasked: setupData.secretMasked,
          method: setupData.method
        }
      });
    } else if (step === 'verify') {
      if (!token || !/^\d{6}$/.test(token)) {
        return res.status(400).json({
          status: "ERROR",
          message: "Invalid token. Please enter a 6-digit code.",
          code: "INVALID_TOKEN_FORMAT"
        });
      }

      // Verify the TOTP code
      try {
        await verifyTwoFactorCode({ userId, token });
        
        // Enable 2FA after successful verification
        await enableTwoFactor(userId);
        
        // Record 2FA enable activity
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
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
        
        return res.json({ 
          status: "OK", 
          message: "2FA enabled successfully",
          data: {
            enabled: true,
            method: 'totp'
          }
        });
      } catch (verifyError) {
        return res.status(400).json({
          status: "ERROR",
          message: verifyError.message || "Invalid 2FA code. Please try again.",
          code: "TWO_FACTOR_INVALID_TOKEN"
        });
      }
    } else {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid step. Use 'start' or 'verify'.",
        code: "INVALID_STEP"
      });
    }
  } catch (error) {
    console.error("setupTwoFactorHandler error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to setup 2FA",
      error: error.message,
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
      return res.status(401).json({ 
        status: "ERROR", 
        message: "Authentication required" 
      });
    }

    await disableTwoFactor(userId);
    
    // Record 2FA disable activity
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await recordUserActivity({
        userId,
        type: 'TWO_FACTOR_DISABLED',
        ipAddress,
        userAgent,
        metadata: {}
      });
    } catch (activityError) {
      console.error('Failed to record 2FA disable activity:', activityError);
    }
    
    return res.json({ 
      status: "OK", 
      message: "2FA disabled successfully" 
    });
  } catch (error) {
    console.error("disableTwoFactorHandler error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to disable 2FA",
      error: error.message,
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
      return res.status(401).json({
        status: "ERROR",
        message: "Authentication required",
      });
    }

    const user = await getUserWithAccessData(userId);
    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
      });
    }

    // Return role, permissions, and feature flags
    return res.json({
      status: "OK",
      data: {
        role: user.role,
        permissions: user.effectivePermissions, // Computed permissions
        featureFlags: user.featureFlags, // Merged feature flags
      },
    });
  } catch (error) {
    console.error("getUserRole error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch user role",
      error: error.message,
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
      return res.status(401).json({
        status: "ERROR",
        message: "Authentication required",
      });
    }

    const user = await getUserProfile(userId);
    if (!user) {
      return res.status(404).json({
        status: "ERROR",
        message: "User not found",
      });
    }

    // Merge user flags with defaults
    const defaultFlags = getDefaultFeatureFlags();
    const mergedFlags = mergeFeatureFlags(user.featureFlags, defaultFlags);

    return res.json({
      status: "OK",
      data: {
        featureFlags: mergedFlags,
      },
    });
  } catch (error) {
    console.error("getUserFeatures error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Failed to fetch feature flags",
      error: error.message,
    });
  }
}

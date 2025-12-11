import { Router } from "express";
import { z } from "zod";
import {
  listUsers,
  getUser,
  createUserHandler,
  deleteUserHandler,
  getProfile,
  updateProfile,
  changePasswordHandler,
  getSecurityActivity,
  getSecurityDevices,
  revokeSecurityDevice,
  getSecuritySessions,
  revokeSecuritySession,
  revokeAllOtherSecuritySessions,
  getTwoFactorStatusHandler,
  setupTwoFactorHandler,
  disableTwoFactorHandler,
  getUserRole,
  getUserFeatures,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Validation schemas
// TODO: Expand in Phase 2 (permissions, device tracking, verification, wallet linking)
const updateProfileSchema = z.object({
  fullName: z.string().max(255).optional(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  country: z.string().max(100).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Legacy admin routes (keep for backward compatibility)
router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUserHandler);
router.delete("/:id", deleteUserHandler);

// ============================================================================
// Account System Expansion (Phase 1) - User Profile Routes
// ============================================================================
// All routes under /api/v1/user require authentication

/**
 * GET /api/v1/user/profile
 * Get current authenticated user's profile
 */
router.get("/profile", requireAuth, getProfile);

/**
 * PUT /api/v1/user/profile
 * Update current authenticated user's profile
 */
router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    req.body = body;
    return updateProfile(req, res);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid request data",
        code: "VALIDATION_ERROR",
        details: error.errors,
      });
    }
    return next(error);
  }
});

/**
 * PUT /api/v1/user/change-password
 * Change user password
 */
router.put("/change-password", requireAuth, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    req.body = body;
    return changePasswordHandler(req, res);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid request data",
        code: "VALIDATION_ERROR",
        details: error.errors,
      });
    }
    return next(error);
  }
});

/**
 * GET /api/v1/user/security/activity
 * Get user's security activity log
 */
router.get("/security/activity", requireAuth, getSecurityActivity);

/**
 * GET /api/v1/user/security/devices
 * Get user's registered devices
 */
router.get("/security/devices", requireAuth, getSecurityDevices);

/**
 * DELETE /api/v1/user/security/devices/:deviceId
 * Revoke a device
 */
router.delete("/security/devices/:deviceId", requireAuth, revokeSecurityDevice);

/**
 * GET /api/v1/security/sessions
 * Get all active sessions for the current user
 */
router.get("/security/sessions", requireAuth, getSecuritySessions);

/**
 * POST /api/v1/security/sessions/revoke
 * Revoke a specific session
 */
router.post("/security/sessions/revoke", requireAuth, revokeSecuritySession);

/**
 * POST /api/v1/security/sessions/revoke-all-others
 * Revoke all sessions except the current one
 */
router.post("/security/sessions/revoke-all-others", requireAuth, revokeAllOtherSecuritySessions);

/**
 * GET /api/v1/user/security/2fa/status
 * Get 2FA status
 */
router.get("/security/2fa/status", requireAuth, getTwoFactorStatusHandler);

/**
 * POST /api/v1/user/security/2fa/setup
 * Begin 2FA setup (placeholder - Phase 2 skeleton)
 */
router.post("/security/2fa/setup", requireAuth, setupTwoFactorHandler);

/**
 * POST /api/v1/user/security/2fa/disable
 * Disable 2FA
 */
router.post("/security/2fa/disable", requireAuth, disableTwoFactorHandler);

// ============================================================================
// Account System Expansion (Phase 5) - Role & Permissions Routes
// ============================================================================

/**
 * GET /api/v1/user/role
 * Get current user's role, permissions, and feature flags
 */
router.get("/role", requireAuth, getUserRole);

/**
 * GET /api/v1/user/features
 * Get current user's feature flags (merged with defaults)
 */
router.get("/features", requireAuth, getUserFeatures);

export default router;

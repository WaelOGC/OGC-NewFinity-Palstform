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
  verifyTwoFactorHandler,
  disableTwoFactorHandler,
  getUserRole,
  getUserFeatures,
  deleteOwnAccount,
  exportOwnAccountData,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Validation schemas
// TODO: Expand in Phase 2 (permissions, device tracking, verification, wallet linking)
const updateProfileSchema = z.object({
  fullName: z.string().max(255).optional().or(z.literal("")),
  username: z.union([
    z.literal(""), // Allow empty string
    z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/) // Or valid username
  ]).optional(),
  country: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  avatarUrl: z.union([
    z.literal(""), // Allow empty string
    z.string().url().max(500) // Or valid URL
  ]).optional(),
}).transform((data) => {
  // Convert empty strings to null for optional fields
  const transformed = { ...data };
  for (const key in transformed) {
    if (transformed[key] === "") {
      transformed[key] = null;
    }
  }
  return transformed;
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
 * 
 * Note: POST is also supported as an alias for PUT (RESTful alternative)
 */
router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    req.body = body;
    return updateProfile(req, res);
  } catch (error) {
    if (error.name === "ZodError") {
      // Provide more detailed error messages
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid request data",
        code: "VALIDATION_ERROR",
        details: errorMessages,
      });
    }
    return next(error);
  }
});

/**
 * POST /api/v1/user/profile
 * Update current authenticated user's profile (alias for PUT)
 */
router.post("/profile", requireAuth, async (req, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    req.body = body;
    return updateProfile(req, res);
  } catch (error) {
    if (error.name === "ZodError") {
      // Provide more detailed error messages
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid request data",
        code: "VALIDATION_ERROR",
        details: errorMessages,
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
 * GET /api/v1/user/security/sessions
 * Get all active sessions for the current user
 * Returns: { status: "OK", data: { sessions: [...] } }
 */
router.get("/security/sessions", requireAuth, getSecuritySessions);

/**
 * POST /api/v1/user/security/sessions/revoke
 * Revoke a specific session
 * Body: { sessionId }
 * Returns: { status: "OK", data: { success: true } }
 */
router.post("/security/sessions/revoke", requireAuth, revokeSecuritySession);

/**
 * POST /api/v1/user/security/sessions/revoke-all-others
 * Revoke all sessions except the current one
 * Returns: { status: "OK", data: { success: true } }
 */
router.post("/security/sessions/revoke-all-others", requireAuth, revokeAllOtherSecuritySessions);

/**
 * GET /api/v1/user/security/2fa/status
 * Get 2FA status
 */
router.get("/security/2fa/status", requireAuth, getTwoFactorStatusHandler);

/**
 * POST /api/v1/user/security/2fa/setup
 * Begin 2FA setup (step: "start" to generate QR code)
 */
router.post("/security/2fa/setup", requireAuth, setupTwoFactorHandler);

/**
 * POST /api/v1/user/security/2fa/verify
 * Verify 2FA code and enable 2FA
 */
router.post("/security/2fa/verify", requireAuth, verifyTwoFactorHandler);

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

/**
 * POST /api/v1/user/account/delete
 * Delete own account (soft delete with password confirmation) - Phase 9.1
 */
router.post("/account/delete", requireAuth, deleteOwnAccount);

/**
 * GET /api/v1/user/account/export
 * Export own account data as JSON (Phase 9.3)
 */
router.get("/account/export", requireAuth, exportOwnAccountData);

export default router;

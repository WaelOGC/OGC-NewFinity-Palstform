import { Router } from "express";
import { getDatabaseStatus, testEmail } from "../controllers/systemController.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePermission } from "../middleware/accessControl.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// Phase 5: Protect system routes with permission check
// All system routes require MANAGE_PLATFORM_SETTINGS permission
router.get("/db-check", requireAuth, requirePermission('MANAGE_PLATFORM_SETTINGS'), getDatabaseStatus);

// Email test endpoint (admin-only, dev-only unless ENABLE_EMAIL_TEST_ENDPOINT=true)
router.post("/email/test", requireAuth, requireAdmin, testEmail);

export default router;

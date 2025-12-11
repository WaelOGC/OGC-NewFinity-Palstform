import { Router } from "express";
import { getDatabaseStatus } from "../controllers/systemController.js";
import { requireAuth } from "../middleware/auth.js";
import { requirePermission } from "../middleware/accessControl.js";

const router = Router();

// Phase 5: Protect system routes with permission check
// All system routes require MANAGE_PLATFORM_SETTINGS permission
router.get("/db-check", requireAuth, requirePermission('MANAGE_PLATFORM_SETTINGS'), getDatabaseStatus);

export default router;

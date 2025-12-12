// backend/src/routes/account.routes.js

import express from 'express';
const router = express.Router();

import { requireAuth } from '../middleware/auth.js';
import accountController from '../controllers/account.controller.js';
import twoFactorController from '../controllers/twoFactor.controller.js';

// PHASE S1 — secure change password
router.post('/change-password', requireAuth, accountController.postChangePassword);

// PHASE S3 — account data export
router.get('/export', requireAuth, accountController.getAccountExport);

// PHASE S4 — account deletion
router.post('/delete', requireAuth, accountController.deleteAccount);

// 2FA routes
router.get('/2fa/status', requireAuth, twoFactorController.getStatus);
router.post('/2fa/setup', requireAuth, twoFactorController.startSetup);
router.post('/2fa/confirm', requireAuth, twoFactorController.confirmSetup);
router.post('/2fa/disable', requireAuth, twoFactorController.disable);

// 2FA Recovery codes (Phase S5)
router.get('/2fa/recovery', requireAuth, twoFactorController.getRecoveryCodesStatus);
router.post('/2fa/recovery/regenerate', requireAuth, twoFactorController.regenerateRecoveryCodes);

export default router;

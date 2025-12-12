// backend/src/routes/security.routes.js

import express from 'express';
const router = express.Router();

import { requireAuth } from '../middleware/auth.js';
import * as sessionsController from '../controllers/securitySessions.controller.js';

router.get('/sessions', requireAuth, sessionsController.getActiveSessions);
router.delete('/sessions/:sessionId', requireAuth, sessionsController.deleteSession);
router.delete('/sessions/others', requireAuth, sessionsController.deleteOtherSessions);

export default router;

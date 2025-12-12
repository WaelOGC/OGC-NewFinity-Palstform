// backend/src/routes/amy.routes.js

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as amyController from '../controllers/amyAgent.controller.js';

const router = express.Router();

// PHASE D3 — Amy Agent (mock)

router.get('/sessions', requireAuth, amyController.listSessions);
router.get('/sessions/:sessionId', requireAuth, amyController.getSession);
router.post('/sessions', requireAuth, amyController.createSession);
router.post('/sessions/:sessionId/messages', requireAuth, amyController.sendMessage);

export default router;

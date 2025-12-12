import { Router } from 'express';
import authRoutes from './auth.routes.js';
import walletRoutes from './wallet.routes.js';
import healthRoutes from './health.routes.js';
import systemRoutes from './systemRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './admin.routes.js';
import challengeRoutes from './challenge.routes.js';
import amyRoutes from './amy.routes.js';
import accountRoutes from './account.routes.js';
import securityRoutes from './security.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/system', systemRoutes);
router.use('/user', userRoutes); // Account System Expansion (Phase 1)
router.use('/admin', adminRoutes); // Account System Expansion (Phase 6) - Admin Console
router.use('/challenge', challengeRoutes); // PHASE D2 — Challenge Program
router.use('/amy', amyRoutes); // PHASE D3 — Amy Agent Shell (mock)
router.use('/account', accountRoutes); // PHASE S1 — Secure Change Password
router.use('/security', securityRoutes); // PHASE S2 — Sessions & Devices
router.use('/', healthRoutes);

export default router;


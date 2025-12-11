import { Router } from 'express';
import authRoutes from './auth.routes.js';
import walletRoutes from './wallet.routes.js';
import healthRoutes from './health.routes.js';
import systemRoutes from './systemRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/system', systemRoutes);
router.use('/user', userRoutes); // Account System Expansion (Phase 1)
router.use('/admin', adminRoutes); // Account System Expansion (Phase 6) - Admin Console
router.use('/', healthRoutes);

export default router;


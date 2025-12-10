import { Router } from 'express';
import authRoutes from './auth.routes.js';
import walletRoutes from './wallet.routes.js';
import healthRoutes from './health.routes.js';
import systemRoutes from './systemRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/system', systemRoutes);
router.use('/', healthRoutes);

export default router;


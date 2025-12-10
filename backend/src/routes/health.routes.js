import { Router } from 'express';
const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'OGC Backend API is healthy',
  });
});

router.get('/readyz', (_, res) => res.json({ ready: true }));
router.get('/version', (_, res) => res.json({ version: 'v1.0.0' }));

export default router;


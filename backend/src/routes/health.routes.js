import { Router } from 'express';
const router = Router();

// Health endpoint matching required format: { status: "OK", service: "backend", time: ISO string }
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'backend',
    time: new Date().toISOString(),
  });
});

router.get('/readyz', (_, res) => res.json({ ready: true }));
router.get('/version', (_, res) => res.json({ version: 'v1.0.0' }));

export default router;


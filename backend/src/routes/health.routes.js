import { Router } from 'express';
const router = Router();

router.get('/readyz', (_, res) => res.json({ ready: true }));
router.get('/version', (_, res) => res.json({ version: 'v1.0.0' }));

export default router;


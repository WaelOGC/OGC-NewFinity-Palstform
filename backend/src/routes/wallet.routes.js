import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import {
  getSummary,
  getWalletSummary,
  getWalletTransactions,
  getStakingSummary,
  getStakingPreview,
  getWalletOverview,
  getWalletActivity,
  getRewardsTimeline,
  getWalletBadges,
  transfer,
  stake,
  unstake,
  listTx,
  rewards,
  createDemoTransactions,
} from '../controllers/wallet.controller.js';

const router = Router();
router.use(requireAuth);

// Phase W2.1: Wallet Summary API endpoint
router.get('/summary', getWalletSummary);

// Phase W2.5: Wallet Transactions API endpoint (mock data)
router.get('/transactions', (req, res, next) => {
  // Debug logging in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Wallet Routes] GET /transactions hit', {
      path: req.path,
      originalUrl: req.originalUrl,
      query: req.query,
      userId: req.user?.id,
    });
  }
  getWalletTransactions(req, res, next);
});

// Phase W2.4: Staking endpoints (mock/preview only)
router.get('/staking/summary', getStakingSummary);
router.post('/staking/preview', getStakingPreview);

// Phase W2.6: Wallet Overview (snapshot + balances)
router.get('/overview', getWalletOverview);

// Phase W2.7: Wallet Activity + Charts
router.get('/activity', getWalletActivity);

// Phase W2.8: Rewards Timeline (mini bar chart)
router.get('/rewards/timeline', getRewardsTimeline);

// PHASE W2.9 — Wallet badges
router.get('/badges', getWalletBadges);

router.get('/', async (req, res, next) => {
  try {
    const data = await getSummary(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// Legacy /transactions route removed - using Phase W2.5 route at line 25 instead

router.get('/rewards', async (req, res, next) => {
  try {
    const data = await rewards(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

const transferSchema = z.object({
  to: z.string().min(3),
  amount: z.number().positive()
});

router.post('/transfer', async (req, res, next) => {
  try {
    const body = transferSchema.parse(req.body);
    const data = await transfer(req.user.id, body);
    res.json(data);
  } catch (err) { next(err); }
});

const amountSchema = z.object({ amount: z.number().positive() });

router.post('/stake', async (req, res, next) => {
  try {
    const body = amountSchema.parse(req.body);
    const data = await stake(req.user.id, body.amount);
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/unstake', async (req, res, next) => {
  try {
    const body = amountSchema.parse(req.body);
    const data = await unstake(req.user.id, body.amount);
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/demo-transactions', async (req, res, next) => {
  try {
    const data = await createDemoTransactions(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

// Debug: Log registered routes in development
if (process.env.NODE_ENV !== 'production') {
  console.log('[Wallet Routes] Registered routes:');
  router.stack
    .filter((layer) => layer.route)
    .forEach((layer) => {
      const { path, methods } = layer.route;
      console.log(`  ${Object.keys(methods).join(',').toUpperCase()} ${path}`);
    });
}

export default router;


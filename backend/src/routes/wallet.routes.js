import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { getSummary, transfer, stake, unstake, listTx, rewards, createDemoTransactions } from '../controllers/wallet.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const data = await getSummary(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/transactions', async (req, res, next) => {
  try {
    const data = await listTx(req.user.id, req.query);
    res.json(data);
  } catch (err) { next(err); }
});

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

export default router;


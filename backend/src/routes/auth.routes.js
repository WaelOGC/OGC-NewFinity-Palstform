import { Router } from 'express';
import { z } from 'zod';
import { login, register, refresh, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional()
});

const loginSchema = registerSchema;

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await register(body, res);
    res.status(201).json(result);
  } catch (err) { 
    next(err); 
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(body, res);
    res.status(200).json(result);
  } catch (err) { 
    next(err); 
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const result = await refresh(req, res);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await logout(req, res);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;


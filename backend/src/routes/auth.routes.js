import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { login, register, refresh, logout } from '../controllers/auth.controller.js';
import { activate, resendActivation } from '../controllers/activationController.js';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'Terms & Conditions must be accepted',
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await register(body, res);
    // Ensure consistent JSON format
    const responseData = {
      status: 'OK',
      success: true,
      message: result.message || 'Registration successful. Please check your email to activate your account.',
      requiresActivation: result.requiresActivation || true,
      ...result
    };
    console.log('REGISTER SUCCESS RESPONSE', responseData);
    res.status(201).json(responseData);
  } catch (err) { 
    console.error('REGISTER ERROR', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    next(err); 
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(body, res);
    
    // Fetch user data for response (user is already validated in login controller)
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, role, status FROM User WHERE email = ?',
      [body.email]
    );
    
    let userData = null;
    if (userRows.length > 0) {
      userData = {
        id: userRows[0].id,
        email: userRows[0].email,
        fullName: userRows[0].fullName,
        role: userRows[0].role || 'user',
        status: userRows[0].status
      };
    }
    
    // Ensure consistent JSON format
    res.status(200).json({
      status: 'OK',
      success: true,
      message: 'Login successful',
      access: result.access,
      refresh: result.refresh,
      user: userData
    });
  } catch (err) { 
    // Ensure error has proper format before passing to error handler
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    if (!err.code && err.message.includes('not activated')) {
      err.code = 'ACCOUNT_NOT_VERIFIED';
    }
    if (!err.code && err.message.includes('Invalid')) {
      err.code = 'INVALID_CREDENTIALS';
    }
    next(err); 
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const result = await refresh(req, res);
    // Ensure consistent JSON format
    res.status(200).json({
      status: 'OK',
      success: true,
      ...result
    });
  } catch (err) { 
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    if (!err.code) {
      err.code = 'INVALID_REFRESH_TOKEN';
    }
    next(err); 
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await logout(req, res);
    res.status(204).end();
  } catch (err) { next(err); }
});

// Protected route: returns current user
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    // req.user is set by requireAuth middleware
    // Fetch full user details from database
    const [rows] = await pool.query(
      'SELECT id, email, fullName, role, status FROM User WHERE id = ?',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = rows[0];
    
    return res.status(200).json({
      status: 'OK',
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'user',
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// Activation routes
router.get('/activate', async (req, res, next) => {
  try {
    await activate(req, res);
  } catch (err) {
    next(err);
  }
});

// Rate limiter for resend activation (5 requests per hour per IP)
const resendActivationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: { 
    status: 'ERROR',
    message: 'Too many activation email requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/resend-activation', resendActivationLimiter, async (req, res, next) => {
  try {
    await resendActivation(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;


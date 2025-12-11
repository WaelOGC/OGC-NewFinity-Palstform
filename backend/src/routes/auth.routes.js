import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { login, register, refresh, logout, forgotPassword, resetPassword, validateResetToken, socialLoginCallback } from '../controllers/auth.controller.js';
import { activate, resendActivation } from '../controllers/activationController.js';
import { requireAuth } from '../middleware/auth.js';
import { createAuthSessionForUser } from '../utils/authSession.js';
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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const validateResetTokenSchema = z.object({
  token: z.string().min(1),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
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

// Rate limiter for forgot password (5 requests per hour per IP)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: { 
    status: 'ERROR',
    message: 'Too many password reset requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Forgot password route
router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const result = await forgotPassword(body);
    res.status(200).json({
      status: 'OK',
      success: true,
      message: result.message,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 400;
    }
    if (!err.code) {
      err.code = 'VALIDATION_ERROR';
    }
    next(err);
  }
});

// Validate reset token route
router.post('/reset-password/validate', async (req, res, next) => {
  try {
    const body = validateResetTokenSchema.parse(req.body);
    const result = await validateResetToken(body);
    res.status(200).json({
      status: 'OK',
      success: true,
      message: result.message,
      code: result.code,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 400;
    }
    if (!err.code) {
      err.code = 'VALIDATION_ERROR';
    }
    next(err);
  }
});

// Reset password route
router.post('/reset-password', async (req, res, next) => {
  try {
    const body = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(body);
    res.status(200).json({
      status: 'OK',
      success: true,
      message: result.message,
      code: result.code,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 400;
    }
    if (!err.code) {
      err.code = 'RESET_PASSWORD_ERROR';
    }
    next(err);
  }
});

// ============================================================================
// Social OAuth Routes
// ============================================================================

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SOCIAL_SUCCESS_REDIRECT = `${FRONTEND_URL}/auth/social/callback?status=success`;
const SOCIAL_FAILURE_REDIRECT = `${FRONTEND_URL}/auth/social/callback?status=error`;

// Google OAuth Routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: SOCIAL_FAILURE_REDIRECT }),
  async (req, res, next) => {
    try {
      const user = req.user; // set by passport verify callback
      await createAuthSessionForUser(res, user);
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=google');
    } catch (err) {
      console.error('[GOOGLE_CALLBACK] Error:', err);
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=google');
    }
  }
);

// GitHub OAuth Routes
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/auth/login?provider=github',
    session: false,
  }),
  socialLoginCallback
);

// Twitter/X OAuth Routes
router.get('/twitter', passport.authenticate('twitter', {
  session: false
}));

router.get('/twitter/callback',
  passport.authenticate('twitter', { session: false, failureRedirect: SOCIAL_FAILURE_REDIRECT }),
  async (req, res, next) => {
    try {
      const user = req.user;
      await createAuthSessionForUser(res, user);
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=twitter');
    } catch (err) {
      console.error('[TWITTER_CALLBACK] Error:', err);
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=twitter');
    }
  }
);

// LinkedIn OAuth Routes
router.get('/linkedin', passport.authenticate('linkedin', {
  scope: ['openid', 'profile', 'email'],
  session: false
}));

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: SOCIAL_FAILURE_REDIRECT }),
  async (req, res, next) => {
    try {
      const user = req.user;
      await createAuthSessionForUser(res, user);
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=linkedin');
    } catch (err) {
      console.error('[LINKEDIN_CALLBACK] Error:', err);
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=linkedin');
    }
  }
);

// Discord OAuth Routes
router.get('/discord', passport.authenticate('discord', {
  scope: ['identify', 'email'],
  session: false
}));

router.get('/discord/callback',
  passport.authenticate('discord', { session: false, failureRedirect: SOCIAL_FAILURE_REDIRECT }),
  async (req, res, next) => {
    try {
      const user = req.user;
      await createAuthSessionForUser(res, user);
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=discord');
    } catch (err) {
      console.error('[DISCORD_CALLBACK] Error:', err);
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=discord');
    }
  }
);

export default router;


import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { login, register, refresh, logout, forgotPassword, resetPassword, validateResetToken, socialLoginCallback, verifyTwoFactorLogin } from '../controllers/auth.controller.js';
import { activate, resendActivation } from '../controllers/activationController.js';
import { requireAuth } from '../middleware/auth.js';
import { createAuthSessionForUser } from '../utils/authSession.js';
import { recordLoginActivity, registerDevice, recordUserActivity } from '../services/userService.js';
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
    const result = await login(body, res, req);
    
    // Phase 3: Check if 2FA is required
    if (result.twoFactorRequired) {
      // Record 2FA challenge activity
      try {
        const [userRows] = await pool.query(
          'SELECT id FROM User WHERE email = ?',
          [body.email]
        );
        
        if (userRows.length > 0) {
          const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
          const userAgent = req.headers['user-agent'];
          try {
            await recordUserActivity({
              userId: userRows[0].id,
              type: 'LOGIN_CHALLENGE_2FA',
              ipAddress,
              userAgent,
              metadata: { loginMethod: 'email_password' }
            });
          } catch (activityError) {
            console.error('Failed to record 2FA challenge activity:', activityError);
          }
        }
      } catch (dbError) {
        // Log but don't fail login if query fails
        console.error('Failed to fetch user for 2FA activity recording:', dbError);
      }
      
      return res.status(200).json({
        status: 'OK',
        data: {
          twoFactorRequired: true,
          challengeToken: result.challengeToken
        }
      });
    }
    
    // Fetch user data for response (user is already validated in login controller)
    let userData = null;
    try {
      const [userRows] = await pool.query(
        'SELECT id, email, fullName, role, status FROM User WHERE email = ?',
        [body.email]
      );
      
      if (userRows.length > 0) {
        userData = {
          id: userRows[0].id,
          email: userRows[0].email,
          fullName: userRows[0].fullName,
          role: userRows[0].role || 'STANDARD_USER',
          status: userRows[0].status
        };
        
        // Phase 2: Record login activity and register device
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        try {
          // Record login activity
          await recordLoginActivity(userRows[0].id, {
            ipAddress,
            userAgent,
            metadata: { loginMethod: 'email_password' }
          });
          
          // Register/update device
          await registerDevice({
            userId: userRows[0].id,
            userAgent,
            ipAddress
          });
        } catch (activityError) {
          // Log but don't fail login if activity recording fails
          console.error('Failed to record login activity or register device:', activityError);
        }
      }
    } catch (dbError) {
      // Log but don't fail login if user data fetch fails
      console.error('Failed to fetch user data for response:', dbError);
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
    // Wrap database errors to ensure they're handled as JSON
    if (err.code && err.code.startsWith('ER_')) {
      console.error('[AuthRoutes] Database error during login:', {
        code: err.code,
        message: err.message,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
      err.statusCode = 500;
      err.code = 'DATABASE_ERROR';
      err.message = 'Database error occurred. Please try again later.';
    }
    next(err); 
  }
});

// Phase 3: 2FA verification endpoint for login flow
const verifyTwoFactorSchema = z.object({
  challengeToken: z.string().min(1),
  token: z.string().regex(/^\d{6}$/, 'Token must be a 6-digit code'),
});

router.post('/2fa/verify', async (req, res, next) => {
  try {
    const body = verifyTwoFactorSchema.parse(req.body);
    const result = await verifyTwoFactorLogin({ body, ip: req.ip, headers: req.headers }, res);
    
    // Register device after successful 2FA login
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await registerDevice({
        userId: result.user.id,
        userAgent,
        ipAddress
      });
    } catch (deviceError) {
      console.error('Failed to register device after 2FA login:', deviceError);
    }
    
    res.status(200).json({
      status: 'OK',
      success: true,
      message: 'Login successful',
      access: result.access,
      refresh: result.refresh,
      user: result.user
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    if (!err.code) {
      err.code = 'TWO_FACTOR_VERIFICATION_FAILED';
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
// This endpoint is the single source of truth for the frontend auth store and must always include user.role
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
    
    // Return user with role - use STANDARD_USER as fallback if role is null (shouldn't happen after Phase 5 migration)
    return res.status(200).json({
      status: 'OK',
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'STANDARD_USER', // Role must always be present for frontend auth checks
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
router.get('/google', (req, res, next) => {
  // Wrap passport.authenticate to catch any initialization errors
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })(req, res, (err) => {
    if (err) {
      console.error('[GOOGLE_AUTH] Error:', err);
      // If this is an API request (has Accept: application/json), return JSON
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({
          status: 'ERROR',
          message: 'OAuth authentication failed',
          code: 'OAUTH_ERROR'
        });
      }
      // Otherwise redirect to frontend with error
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=google&error=oauth_init_failed');
    }
    next();
  });
});

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: SOCIAL_FAILURE_REDIRECT }),
  async (req, res, next) => {
    try {
      const user = req.user; // set by passport verify callback
      
      if (!user) {
        console.error('[GOOGLE_CALLBACK] No user object from passport');
        return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=google&error=authentication_failed');
      }
      
      await createAuthSessionForUser(res, user, req);
      
      // Phase 2: Record login activity and register device for social login
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      try {
        await recordLoginActivity(user.id, {
          ipAddress,
          userAgent,
          metadata: { loginMethod: 'google_oauth' }
        });
        await registerDevice({
          userId: user.id,
          userAgent,
          ipAddress
        });
      } catch (activityError) {
        console.error('Failed to record social login activity:', activityError);
        // Don't fail login if activity recording fails
      }
      
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=google');
    } catch (err) {
      console.error('[GOOGLE_CALLBACK] Error:', {
        message: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
      // Ensure we always redirect, never return raw error
      const errorMsg = encodeURIComponent(err.message || 'Authentication failed');
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=google&error=' + errorMsg);
    }
  }
);

// GitHub OAuth Routes
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: SOCIAL_FAILURE_REDIRECT + '&provider=github',
    session: false,
  }),
  async (req, res, next) => {
    try {
      const user = req.user; // set by passport verify callback
      await createAuthSessionForUser(res, user, req);
      
      // Phase 2: Record login activity and register device for social login
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      try {
        await recordLoginActivity(user.id, {
          ipAddress,
          userAgent,
          metadata: { loginMethod: 'github_oauth' }
        });
        await registerDevice({
          userId: user.id,
          userAgent,
          ipAddress
        });
      } catch (activityError) {
        console.error('Failed to record social login activity:', activityError);
      }
      
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=github');
    } catch (err) {
      console.error('[GITHUB_CALLBACK] Error:', err);
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=github');
    }
  }
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
      await createAuthSessionForUser(res, user, req);
      
      // Phase 2: Record login activity and register device for social login
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      try {
        await recordLoginActivity(user.id, {
          ipAddress,
          userAgent,
          metadata: { loginMethod: 'twitter_oauth' }
        });
        await registerDevice({
          userId: user.id,
          userAgent,
          ipAddress
        });
      } catch (activityError) {
        console.error('Failed to record social login activity:', activityError);
      }
      
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=twitter');
    } catch (err) {
      console.error('[TWITTER_CALLBACK] Error:', err);
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=twitter');
    }
  }
);

// LinkedIn OAuth Routes
router.get('/linkedin', (req, res, next) => {
  // Wrap passport.authenticate to catch any initialization errors
  passport.authenticate('linkedin', {
    scope: ['openid', 'profile', 'email'],
    session: false
  })(req, res, (err) => {
    if (err) {
      console.error('[LINKEDIN_AUTH] Error:', err);
      // If this is an API request (has Accept: application/json), return JSON
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({
          status: 'ERROR',
          message: 'OAuth authentication failed',
          code: 'OAUTH_ERROR'
        });
      }
      // Otherwise redirect to frontend with error
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=linkedin&error=oauth_init_failed');
    }
    next();
  });
});

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: SOCIAL_FAILURE_REDIRECT }),
  async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        console.error('[LINKEDIN_CALLBACK] No user object from passport');
        return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=linkedin&error=authentication_failed');
      }
      
      await createAuthSessionForUser(res, user, req);
      
      // Phase 2: Record login activity and register device for social login
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      try {
        await recordLoginActivity(user.id, {
          ipAddress,
          userAgent,
          metadata: { loginMethod: 'linkedin_oauth' }
        });
        await registerDevice({
          userId: user.id,
          userAgent,
          ipAddress
        });
      } catch (activityError) {
        console.error('Failed to record social login activity:', activityError);
        // Don't fail login if activity recording fails
      }
      
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=linkedin');
    } catch (err) {
      console.error('[LINKEDIN_CALLBACK] Error:', {
        message: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
      // Ensure we always redirect, never return raw error
      const errorMsg = encodeURIComponent(err.message || 'Authentication failed');
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=linkedin&error=' + errorMsg);
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
      await createAuthSessionForUser(res, user, req);
      
      // Phase 2: Record login activity and register device for social login
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      try {
        await recordLoginActivity(user.id, {
          ipAddress,
          userAgent,
          metadata: { loginMethod: 'discord_oauth' }
        });
        await registerDevice({
          userId: user.id,
          userAgent,
          ipAddress
        });
      } catch (activityError) {
        console.error('Failed to record social login activity:', activityError);
      }
      
      return res.redirect(SOCIAL_SUCCESS_REDIRECT + '&provider=discord');
    } catch (err) {
      console.error('[DISCORD_CALLBACK] Error:', err);
      return res.redirect(SOCIAL_FAILURE_REDIRECT + '&provider=discord');
    }
  }
);

export default router;


import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { login, register, refresh, logout, forgotPassword, resetPassword, validateResetToken, socialLoginCallback, handleOAuthCallback, verifyTwoFactorLogin, requestPasswordReset, validatePasswordResetToken, resetPasswordWithToken, postLoginTwoFactor, checkSession } from '../controllers/auth.controller.js';
import { activate, resendActivation } from '../controllers/activationController.js';
import { requireAuth } from '../middleware/auth.js';
import { createAuthSessionForUser } from '../utils/authSession.js';
import { recordLoginActivity, registerDevice } from '../services/userService.js';
import { logUserActivity } from '../services/activityService.js';
import { sendOk, sendError, ok, fail } from '../utils/apiResponse.js';
import { AUTH_OK, AUTH_ERROR } from '../constants/authCodes.js';
import { normalizeAccountStatus, ACCOUNT_STATUS } from '../utils/accountStatus.js';
import pool from '../db.js';
import env from '../config/env.js';

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
});

router.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await register(body, res);
    // Use standardized response format
    return ok(res, {
      code: AUTH_OK.AUTH_REGISTER_OK,
      message: result.message || 'Registration successful. Please check your email to activate your account.',
      data: {
        requiresActivation: result.requiresActivation !== false,
        userId: result.userId,
      },
    }, 201);
  } catch (err) { 
    next(err); 
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(body, res, req);
    
    // Phase S6: Check if 2FA is required (new format)
    if (result.status === 'OK' && result.code === AUTH_OK.AUTH_2FA_REQUIRED) {
      // Activity logging is already done in the login controller
      // Return the 2FA_REQUIRED response directly
      return ok(res, {
        code: result.code,
        message: result.message,
        data: result.data
      }, 200);
    }
    
    // Phase 3: Check if 2FA is required (legacy format)
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
            await logUserActivity({
              userId: userRows[0].id,
              actorId: userRows[0].id,
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
      
      return ok(res, {
        code: AUTH_OK.AUTH_2FA_REQUIRED,
        message: 'Two-factor authentication is required.',
        data: {
          twoFactorRequired: true,
          challengeToken: result.challengeToken
        }
      }, 200);
    }
    
    // Normal login success - result already contains session data from createAuthSessionForUser
    return ok(res, {
      code: AUTH_OK.AUTH_LOGIN_OK,
      message: 'Login successful.',
      data: result
    }, 200);
    
    // Use standardized response format
    return sendOk(
      res,
      {
        user: userData // no password - userData only contains id, email, fullName, role, status
      },
      200,
      'LOGIN_SUCCESS',
      'Login successful.'
    );
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

// Phase S6: New 2FA login endpoint with ticket system
// Accept both 'ticket'/'twoFactorTicket' and 'mode'/'method' for backward compatibility
const loginTwoFactorSchema = z.object({
  ticket: z.string().min(1).optional(),
  twoFactorTicket: z.string().min(1).optional(),
  mode: z.enum(['totp', 'recovery']).optional(),
  method: z.enum(['totp', 'recovery']).optional(),
  code: z.string().min(1),
}).refine((data) => (data.ticket || data.twoFactorTicket) && (data.mode || data.method), {
  message: 'Either ticket/twoFactorTicket and mode/method must be provided',
});

// Rate limiter for 2FA login (stricter than general rate limit - 10 attempts per 15 minutes)
const loginTwoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: { 
    status: 'ERROR',
    message: 'Too many 2FA verification attempts. Please try again later.',
    code: AUTH_ERROR.AUTH_RATE_LIMITED,
    data: {}
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login/2fa', loginTwoFactorLimiter, async (req, res, next) => {
  try {
    const body = loginTwoFactorSchema.parse(req.body);
    // Normalize to use 'ticket' and 'mode' internally
    req.body.ticket = req.body.ticket || req.body.twoFactorTicket;
    req.body.mode = req.body.mode || req.body.method;
    await postLoginTwoFactor(req, res, next);
  } catch (err) {
    if (err.name === 'ZodError') {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data. Ticket, mode/method, and code are required.',
        statusCode: 400,
      });
    }
    next(err);
  }
});

// Phase 3: 2FA verification endpoint for login flow (legacy - kept for backward compatibility)
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
    
    return sendOk(res, {
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
    return sendOk(res, result);
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

// Lightweight session health check endpoint (no database calls, no auth required)
router.get('/session', checkSession);

// Protected route: returns current user with stable, schema-drift-tolerant response
// Task 10: This endpoint must never crash due to DB schema drift and must return consistent JSON shape
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    // req.user is set by requireAuth middleware (req.user.id is the userId)
    const { getAuthMe } = await import('../services/authMeService.js');
    
    // Get normalized user object (schema-drift safe)
    const user = await getAuthMe(req.user.id);
    
    if (!user) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_NOT_AUTHENTICATED,
        message: 'User not found',
        data: {}
      }, 404);
    }
    
    // Check account status (if available)
    if (user.accountStatus) {
      const accountStatus = normalizeAccountStatus(user.accountStatus);
      if (accountStatus === ACCOUNT_STATUS.DISABLED) {
        return fail(res, {
          code: AUTH_ERROR.AUTH_ACCOUNT_DISABLED,
          message: 'This account has been disabled.',
          data: {}
        }, 403);
      }
    }
    
    // Return consistent response shape as per Task 10 requirements
    return ok(res, {
      code: AUTH_OK.AUTH_ME_OK,
      message: 'Authenticated.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          accountStatus: user.accountStatus,
          provider: user.provider,
          roles: user.roles,
          permissions: user.permissions
        }
      }
    }, 200);
  } catch (err) {
    // Handle database errors gracefully
    if (err.code && err.code.startsWith('ER_')) {
      console.error('[AUTH_ME] Database error:', {
        code: err.code,
        message: err.message,
      });
      // Return minimal safe response instead of crashing
      return fail(res, {
        code: AUTH_ERROR.AUTH_SERVER_ERROR,
        message: 'Database error occurred. Please try again later.',
        data: {}
      }, 500);
    }
    // Pass other errors to error handler
    next(err);
  }
});

// Activation route
// Canonical format: POST /api/v1/auth/activate with JSON body { "token": "<TOKEN>" }
router.post('/activate', async (req, res, next) => {
  try {
    await activate(req, res, next);
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
    code: AUTH_ERROR.AUTH_RATE_LIMITED,
    data: {}
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
    code: AUTH_ERROR.AUTH_RATE_LIMITED,
    data: {}
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Forgot password route
router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const result = await forgotPassword(body);
    // Return the result directly (controller already formats it correctly)
    res.status(200).json(result);
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

// Rate limiter for password reset request (Phase 8.1) - 5 requests per hour per IP
const passwordResetRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: { 
    status: 'ERROR',
    message: 'Too many password reset requests. Please try again later.',
    code: AUTH_ERROR.AUTH_RATE_LIMITED,
    data: {}
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset request route (Phase 8.1)
router.post('/password/reset/request', passwordResetRequestLimiter, requestPasswordReset);

// Password reset validation and completion routes (Phase 8.2)
router.post('/password/reset/validate', validatePasswordResetToken);
router.post('/password/reset/complete', resetPasswordWithToken);

// Validate reset token route (legacy - kept for backward compatibility)
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
    // Return the result directly (controller already formats it correctly)
    res.status(200).json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 400;
    }
    // Map error codes to match requirements
    if (!err.code) {
      if (err.message?.includes('token')) {
        err.code = 'RESET_TOKEN_INVALID_OR_EXPIRED';
      } else if (err.message?.includes('password')) {
        err.code = 'PASSWORD_INVALID';
      } else {
        err.code = 'RESET_PASSWORD_ERROR';
      }
    }
    next(err);
  }
});

// ============================================================================
// Social OAuth Routes
// ============================================================================

const SOCIAL_SUCCESS_REDIRECT = `${env.FRONTEND_BASE_URL}/auth/social/callback?status=success`;
const SOCIAL_FAILURE_REDIRECT = `${env.FRONTEND_BASE_URL}/auth/social/callback?status=error`;

// Google OAuth Routes
router.get('/google', (req, res, next) => {
  // Check if state parameter is present (for connect flow)
  // Pass it through to the OAuth provider
  const stateParam = req.query.state;
  
  // Wrap passport.authenticate to catch any initialization errors
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: stateParam || undefined, // Pass state through if present
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
    await handleOAuthCallback(req, res, next, 'google');
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
    await handleOAuthCallback(req, res, next, 'github');
  }
);

// Twitter/X OAuth Routes
router.get('/twitter', passport.authenticate('twitter', {
  session: false
}));

router.get('/twitter/callback',
  passport.authenticate('twitter', { session: false, failureRedirect: SOCIAL_FAILURE_REDIRECT }),
  async (req, res, next) => {
    await handleOAuthCallback(req, res, next, 'twitter');
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
    await handleOAuthCallback(req, res, next, 'linkedin');
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
    await handleOAuthCallback(req, res, next, 'discord');
  }
);

// ============================================================================
// OAuth Connect Routes (for linking providers to existing accounts)
// ============================================================================
// These routes require authentication and allow logged-in users to connect OAuth providers

/**
 * Connect OAuth provider to existing account
 * Requires: User must be logged in
 * Usage: GET /api/v1/auth/oauth/connect/:provider
 */
router.get('/oauth/connect/:provider', requireAuth, async (req, res, next) => {
  try {
    const provider = req.params.provider.toLowerCase();
    const validProviders = ['google', 'github', 'twitter', 'linkedin', 'discord'];
    
    if (!validProviders.includes(provider)) {
      return sendError(res, {
        code: 'INVALID_PROVIDER',
        message: `Invalid OAuth provider: ${provider}`,
        statusCode: 400,
      });
    }
    
    // Store userId in OAuth state for connect flow
    // We'll use a signed JWT as state to pass the userId securely
    const jwt = await import('jsonwebtoken');
    const stateToken = jwt.sign(
      { userId: req.user.id, action: 'connect' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '10m' }
    );
    
    // Redirect to OAuth provider with state parameter
    const oauthUrl = `/api/v1/auth/${provider}?state=${encodeURIComponent(stateToken)}`;
    return res.redirect(oauthUrl);
  } catch (err) {
    next(err);
  }
});

/**
 * Complete OAuth authentication when email was missing
 * This endpoint is called after user provides email for OAuth flow where provider didn't return email
 * Usage: POST /api/v1/auth/oauth/complete
 * Body: { "ticket": "<ticket>", "email": "<email>" }
 */
router.post('/oauth/complete', async (req, res, next) => {
  try {
    const { ticket, email } = req.body;
    
    if (!ticket || !email) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_VALIDATION_ERROR,
        message: 'Ticket and email are required.',
        data: {},
      }, 400);
    }
    
    // Import required utilities
    const { verifyOAuthEmailTicket } = await import('../utils/oauthEmailTicket.js');
    const { syncOAuthProfile } = await import('../services/userService.js');
    const { createAuthSessionForUser } = await import('../utils/authSession.js');
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const { getOAuthSuccessRedirect } = require('../utils/oauthConfig.cjs');
    
    // Verify ticket
    let ticketData;
    try {
      ticketData = verifyOAuthEmailTicket(ticket);
    } catch (ticketError) {
      if (ticketError.code === 'OAUTH_TICKET_EXPIRED' || ticketError.code === 'OAUTH_TICKET_INVALID') {
        return fail(res, {
          code: AUTH_ERROR.AUTH_OAUTH_TICKET_INVALID,
          message: 'OAuth ticket is invalid or has expired. Please try logging in again.',
          data: {},
        }, 401);
      }
      throw ticketError;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_VALIDATION_ERROR,
        message: 'Please provide a valid email address.',
        data: {},
      }, 400);
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const { provider, providerUserId, displayName, avatarUrl } = ticketData;
    
    // Check if user exists with this email
    const [emailRows] = await pool.query(
      'SELECT id, email FROM User WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );
    
    if (emailRows.length > 0) {
      // User exists - link provider to existing user
      const existingUser = emailRows[0];
      
      try {
        const syncResult = await syncOAuthProfile({
          provider,
          providerUserId,
          email: normalizedEmail,
          emailVerified: false, // User-provided email, not verified by provider
          displayName,
          avatarUrl,
          existingUserId: existingUser.id, // Link to existing user
        });
        
        const user = syncResult.user;
        
        // Create session
        await createAuthSessionForUser(res, user, req);
        
        // Record login activity
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || req.socket?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        try {
          const { recordLoginActivity, registerDevice } = await import('../services/userService.js');
          await recordLoginActivity(user.id, {
            ipAddress,
            userAgent,
            metadata: { loginMethod: `${provider}_oauth`, completedViaEmail: true }
          });
          await registerDevice({
            userId: user.id,
            userAgent,
            ipAddress
          });
        } catch (activityError) {
          console.error('[OAuth Complete] Failed to record login activity:', activityError);
        }
        
        console.log(`[OAuth Complete] Successfully linked ${provider} to existing user ${user.id} with email ${normalizedEmail}`);
        
        // Return success
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return sendOk(res, {
            provider,
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              role: user.role,
            },
          }, 200, 'OAUTH_COMPLETED', 'OAuth completed successfully.');
        }
        
        // Browser redirect
        const redirectUrl = getOAuthSuccessRedirect(provider);
        return res.redirect(redirectUrl);
        
      } catch (linkError) {
        console.error(`[OAuth Complete] Error linking ${provider} to user ${existingUser.id}:`, linkError);
        
        if (linkError.code === 'OAUTH_ACCOUNT_ALREADY_LINKED' || linkError.code === 'OAUTH_EMAIL_CONFLICT') {
          return fail(res, {
            code: AUTH_ERROR.AUTH_VALIDATION_ERROR,
            message: linkError.message || 'This email is already associated with a different account.',
            data: {},
          }, 409);
        }
        
        return fail(res, {
          code: AUTH_ERROR.AUTH_SERVER_ERROR,
          message: 'Failed to link OAuth provider to account.',
          data: {},
        }, 500);
      }
    } else {
      // User doesn't exist - create new user with provided email
      try {
        const syncResult = await syncOAuthProfile({
          provider,
          providerUserId,
          email: normalizedEmail,
          emailVerified: false, // User-provided email, not verified by provider
          displayName,
          avatarUrl,
          // No existingUserId - will create new user
        });
        
        const user = syncResult.user;
        
        // Create session
        await createAuthSessionForUser(res, user, req);
        
        // Record login activity
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || req.socket?.remoteAddress;
        const userAgent = req.headers['user-agent'];
        try {
          const { recordLoginActivity, registerDevice } = await import('../services/userService.js');
          await recordLoginActivity(user.id, {
            ipAddress,
            userAgent,
            metadata: { loginMethod: `${provider}_oauth`, completedViaEmail: true, isNewUser: true }
          });
          await registerDevice({
            userId: user.id,
            userAgent,
            ipAddress
          });
        } catch (activityError) {
          console.error('[OAuth Complete] Failed to record login activity:', activityError);
        }
        
        console.log(`[OAuth Complete] Successfully created new user ${user.id} with ${provider} OAuth and email ${normalizedEmail}`);
        
        // Return success
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return ok(res, {
            code: AUTH_OK.AUTH_OAUTH_OK,
            message: 'OAuth completed successfully.',
            data: {
              provider,
              user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
              },
            },
          }, 200);
        }
        
        // Browser redirect
        const redirectUrl = getOAuthSuccessRedirect(provider);
        return res.redirect(redirectUrl);
        
      } catch (createError) {
        return fail(res, {
          code: AUTH_ERROR.AUTH_SERVER_ERROR,
          message: createError.message || 'Failed to complete OAuth authentication.',
          data: {},
        }, 500);
      }
    }
  } catch (err) {
    console.error('[OAuth Complete] Unexpected error:', err);
    return next(err);
  }
});

/**
 * Disconnect OAuth provider from account
 * Requires: User must be logged in
 * Usage: POST /api/v1/auth/oauth/disconnect/:provider
 */
router.post('/oauth/disconnect/:provider', requireAuth, async (req, res, next) => {
  try {
    const provider = req.params.provider.toLowerCase();
    const validProviders = ['google', 'github', 'twitter', 'linkedin', 'discord'];
    
    if (!validProviders.includes(provider)) {
      return sendError(res, {
        code: 'INVALID_PROVIDER',
        message: `Invalid OAuth provider: ${provider}`,
        statusCode: 400,
      });
    }
    
    const providerColumnMap = {
      google: 'googleId',
      github: 'githubId',
      twitter: 'twitterId',
      linkedin: 'linkedinId',
      discord: 'discordId',
    };
    
    const providerColumn = providerColumnMap[provider];
    const userId = req.user.id;
    
    // Check if provider is connected
    const [rows] = await pool.query(
      `SELECT ${providerColumn} FROM User WHERE id = ?`,
      [userId]
    );
    
    if (rows.length === 0 || !rows[0][providerColumn]) {
      return sendError(res, {
        code: 'PROVIDER_NOT_CONNECTED',
        message: `This ${provider} account is not connected to your account.`,
        statusCode: 400,
      });
    }
    
    // Disconnect provider (set column to NULL)
    await pool.query(
      `UPDATE User SET ${providerColumn} = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [userId]
    );
    
    // If this was the only auth method, prevent disconnection (user would be locked out)
    const [userRows] = await pool.query(
      `SELECT password, googleId, githubId, twitterId, linkedinId, discordId FROM User WHERE id = ?`,
      [userId]
    );
    
    if (userRows.length > 0) {
      const user = userRows[0];
      const hasPassword = !!user.password;
      const hasOtherProviders = !!(user.googleId || user.githubId || user.twitterId || user.linkedinId || user.discordId);
      
      if (!hasPassword && !hasOtherProviders) {
        // Revert the disconnect - user would be locked out
        await pool.query(
          `UPDATE User SET ${providerColumn} = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
          [rows[0][providerColumn], userId]
        );
        
        return sendError(res, {
          code: 'CANNOT_DISCONNECT_LAST_AUTH',
          message: 'Cannot disconnect the last authentication method. Please set a password first.',
          statusCode: 400,
        });
      }
    }
    
    return sendOk(res, {
      provider,
      disconnected: true,
    }, 200, 'OAUTH_DISCONNECTED', `${provider} account disconnected successfully.`);
  } catch (err) {
    next(err);
  }
});

export default router;


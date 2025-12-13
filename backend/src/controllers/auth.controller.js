import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import env from '../config/env.js';
import { createActivationToken, getTermsVersion } from '../services/activationService.js';
import { sendActivationEmail, sendPasswordResetEmail, sendPasswordChangedAlertEmail } from '../services/emailService.js';
import { createAuthSessionForUser } from '../utils/authSession.js';
import { getTwoFactorStatus, verifyTwoFactorCode, recordLoginActivity, registerDevice } from '../services/userService.js';
import { getTwoFactorStatusForUser, verifyUserTotpCode } from '../services/twoFactorService.js';
import { getRecoveryCodesStatusForUser, consumeRecoveryCode } from '../services/twoFactorRecoveryService.js';
import { createTwoFactorTicket, verifyTwoFactorTicket } from '../utils/twoFactorTicket.js';
import { logUserActivity } from '../services/activityService.js';
import { sendOk, sendError, ok, fail } from '../utils/apiResponse.js';
import { validatePasswordStrength } from '../utils/passwordPolicy.js';
import { AUTH_OK, AUTH_ERROR } from '../constants/authCodes.js';
import { authLog, AUTH_EVENTS } from '../utils/authLogger.js';
import { createPasswordResetToken, findValidPasswordResetToken, markPasswordResetTokenUsed, findValidPasswordResetTokenByToken, updateUserPassword } from '../services/passwordResetService.js';
import { revokeAllUserSessions } from '../services/sessionService.js';
import { normalizeAccountStatus, ACCOUNT_STATUS, canUserLogin } from '../utils/accountStatus.js';
import { createOAuthEmailTicket } from '../utils/oauthEmailTicket.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { getOAuthNeedsEmailRedirect, getOAuthSuccessRedirect } = require('../utils/oauthConfig.cjs');

// Note: JWT configuration and session creation logic moved to utils/authSession.js
// This keeps the code DRY and allows both email/password and social login to share the same session logic

export async function register({ email, password, fullName, termsAccepted }, res) {
  try {
    // Validate terms acceptance
    if (!termsAccepted) {
      const error = new Error('Terms & Conditions must be accepted');
      error.statusCode = 400;
      error.code = AUTH_ERROR.AUTH_VALIDATION_ERROR;
      throw error;
    }

    // Check if user already exists
    let existing;
    try {
      [existing] = await pool.query(
        'SELECT id FROM User WHERE email = ?',
        [email]
      );
    } catch (dbError) {
      authLog(AUTH_EVENTS.REGISTER_FAILED, { email, error: dbError.message, code: dbError.code });
      // Handle database connection errors
      if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        const error = new Error('Database connection failed. Please check your database configuration.');
        error.statusCode = 503;
        error.code = AUTH_ERROR.AUTH_SERVER_ERROR;
        throw error;
      }
      throw dbError;
    }
    if (existing.length > 0) {
      authLog(AUTH_EVENTS.REGISTER_FAILED, { email, reason: 'EMAIL_ALREADY_EXISTS' });
      const error = new Error('Email already in use');
      error.statusCode = 409;
      error.code = AUTH_ERROR.AUTH_VALIDATION_ERROR;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const termsVersion = getTermsVersion();
    const now = new Date();

    // Determine default role: first user becomes FOUNDER, others become STANDARD_USER
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM User');
    const initialRole = totalUsers === 0 ? 'FOUNDER' : 'STANDARD_USER';

    // Create user with PENDING status and default role
    let result;
    try {
      [result] = await pool.query(
        `INSERT INTO User (email, password, fullName, role, status, accountStatus, termsAccepted, termsAcceptedAt, termsVersion, termsSource) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'email_password')`,
        [email, passwordHash, fullName || null, initialRole, ACCOUNT_STATUS.PENDING, ACCOUNT_STATUS.PENDING, true, now, termsVersion]
      );
    } catch (dbError) {
      authLog(AUTH_EVENTS.REGISTER_FAILED, { email, error: dbError.message, code: dbError.code });
      throw dbError;
    }

    const userId = result.insertId;

    // Create activation token
    const { token: activationToken } = await createActivationToken(userId);

    // Send activation email
    try {
      await sendActivationEmail({ to: email, token: activationToken, fullName });
      authLog(AUTH_EVENTS.REGISTER_SUCCESS, { userId, email });
    } catch (emailError) {
      // Log email error but don't fail registration
      authLog(AUTH_EVENTS.REGISTER_SUCCESS, { userId, email, emailError: 'Failed to send activation email' });
      // In production, you might want to queue this for retry
    }

    // DO NOT log user in - they must activate first
    return { 
      success: true, 
      userId,
      message: `Registration successful. We've sent an activation link to ${email}. Please check your inbox and click the link to activate your account.`,
      requiresActivation: true
    };
  } catch (error) {
    authLog(AUTH_EVENTS.REGISTER_FAILED, { email, error: error.message, code: error.code });
    
    // Handle MySQL duplicate entry error
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      const dupError = new Error('Email already in use');
      dupError.statusCode = 409;
      dupError.code = AUTH_ERROR.AUTH_VALIDATION_ERROR;
      throw dupError;
    }
    // Re-throw with status code if already set
    if (error.statusCode) {
      throw error;
    }
    // Wrap database errors
    if (error.code && error.code.startsWith('ER_')) {
      const dbError = new Error(`Database error: ${error.message}`);
      dbError.statusCode = 500;
      dbError.code = AUTH_ERROR.AUTH_SERVER_ERROR;
      throw dbError;
    }
    throw error;
  }
}

export async function login({ email, password }, res, req = null) {
  try {
    let rows;
    try {
      [rows] = await pool.query(
        'SELECT id, email, password, role, status FROM User WHERE email = ?',
        [email]
      );
    } catch (dbError) {
      // Handle database connection errors
      if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ECONNREFUSED') {
        authLog(AUTH_EVENTS.LOGIN_FAILED, { email, error: 'Database connection failed', code: dbError.code });
        const error = new Error('Database connection failed. Please check your database configuration.');
        error.statusCode = 503;
        error.code = AUTH_ERROR.AUTH_SERVER_ERROR;
        throw error;
      }
      // Handle missing column errors (log detailed error for debugging)
      if (dbError.code === 'ER_BAD_FIELD_ERROR' || (dbError.message && dbError.message.includes('Unknown column'))) {
        authLog(AUTH_EVENTS.LOGIN_FAILED, { email, error: 'Database schema error', code: dbError.code });
        const error = new Error('Database error occurred. Please try again later.');
        error.statusCode = 500;
        error.code = AUTH_ERROR.AUTH_SERVER_ERROR;
        error.originalError = dbError;
        throw error;
      }
      throw dbError;
    }
    const user = rows[0];
    
    // Always return generic error for invalid credentials (security: don't reveal if email exists)
    if (!user) {
      authLog(AUTH_EVENTS.LOGIN_FAILED, { email, reason: 'INVALID_CREDENTIALS' });
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = AUTH_ERROR.AUTH_INVALID_CREDENTIALS;
      throw error;
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      authLog(AUTH_EVENTS.LOGIN_FAILED, { email, userId: user.id, reason: 'INVALID_CREDENTIALS' });
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = AUTH_ERROR.AUTH_INVALID_CREDENTIALS;
      throw error;
    }

    // Check account status using normalized values
    const accountStatus = normalizeAccountStatus(user.accountStatus || user.status);
    
    if (accountStatus === ACCOUNT_STATUS.DISABLED) {
      authLog(AUTH_EVENTS.LOGIN_FAILED, { email, userId: user.id, reason: 'ACCOUNT_DISABLED' });
      const error = new Error('Account is disabled');
      error.statusCode = 403;
      error.code = AUTH_ERROR.AUTH_ACCOUNT_DISABLED;
      throw error;
    }

    if (accountStatus === ACCOUNT_STATUS.PENDING) {
      authLog(AUTH_EVENTS.LOGIN_FAILED, { email, userId: user.id, reason: 'ACCOUNT_PENDING' });
      const error = new Error('Account not activated');
      error.statusCode = 403;
      error.code = AUTH_ERROR.AUTH_ACCOUNT_PENDING;
      throw error;
    }

    if (!canUserLogin(accountStatus)) {
      authLog(AUTH_EVENTS.LOGIN_FAILED, { email, userId: user.id, reason: 'ACCOUNT_STATUS_INVALID' });
      const error = new Error('Account status invalid');
      error.statusCode = 403;
      error.code = AUTH_ERROR.AUTH_ACCOUNT_DISABLED;
      throw error;
    }

    // Phase S6: Check if 2FA is enabled using new service
    const twoFactorStatus = await getTwoFactorStatusForUser(user.id);
    const recoveryStatus = await getRecoveryCodesStatusForUser(user.id);
    
    if (twoFactorStatus?.enabled) {
      // Do not create a session yet
      // Generate a 2FA ticket
      const ticket = createTwoFactorTicket(user.id);
      
      // Log 2FA required event
      const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || req?.connection?.remoteAddress;
      const userAgent = req?.headers['user-agent'];
      try {
        await logUserActivity({
          userId: user.id,
          actorId: user.id,
          type: 'LOGIN_2FA_REQUIRED',
          ipAddress,
          userAgent,
          metadata: { loginMethod: 'email_password' }
        });
      } catch (activityError) {
        console.error('Failed to record 2FA required activity:', activityError);
      }
      
      // Return 2FA_REQUIRED response
      authLog(AUTH_EVENTS.AUTH_2FA_REQUIRED, { userId: user.id, email });
      return {
        status: 'OK',
        code: AUTH_OK.AUTH_2FA_REQUIRED,
        message: 'Two-factor authentication is required to complete login.',
        data: {
          ticket,
          methods: {
            totp: true,
            recovery: recoveryStatus && recoveryStatus.filter(c => !c.used).length > 0,
          },
        },
      };
    }

    // Use shared session creation helper (same logic for email/password and social login)
    const sessionResult = await createAuthSessionForUser(res, user, req);
    authLog(AUTH_EVENTS.LOGIN_SUCCESS, { userId: user.id, email });
    return sessionResult;
  } catch (error) {
    // Re-throw with status code if already set
    if (error.statusCode) {
      throw error;
    }
    // Wrap database errors
    if (error.code && error.code.startsWith('ER_')) {
      // If it's a schema error (missing column), log detailed error
      if (error.code === 'ER_BAD_FIELD_ERROR' || (error.message && error.message.includes('Unknown column'))) {
        authLog(AUTH_EVENTS.LOGIN_FAILED, { email, error: 'Database schema error', code: error.code });
        const dbError = new Error('Database error occurred. Please try again later.');
        dbError.statusCode = 500;
        dbError.code = AUTH_ERROR.AUTH_SERVER_ERROR;
        throw dbError;
      }
      authLog(AUTH_EVENTS.LOGIN_FAILED, { email, error: error.message, code: error.code });
      const dbError = new Error(`Database error: ${error.message}`);
      dbError.statusCode = 500;
      dbError.code = AUTH_ERROR.AUTH_SERVER_ERROR;
      throw dbError;
    }
    throw error;
  }
}

export async function refresh(req, res) {
  try {
    // Get refresh token from cookie first, then from body
    const refreshToken = req.cookies?.[env.JWT_COOKIE_REFRESH_NAME] || req.body?.refreshToken;
    
    if (!refreshToken) {
      const error = new Error('Refresh token required');
      error.statusCode = 401;
      error.code = AUTH_ERROR.AUTH_TOKEN_INVALID;
      throw error;
    }

    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: payload.userId, role: payload.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    // Set new access token cookie if res is provided
    if (res) {
      const { getCookieOptions } = await import('../utils/authSession.js');
      function parseExpiresIn(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return 15 * 60 * 1000;
        const [, value, unit] = match;
        const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
        return parseInt(value) * (multipliers[unit] || 1000);
      }
      res.cookie(env.JWT_COOKIE_ACCESS_NAME, accessToken, getCookieOptions(parseExpiresIn(env.JWT_ACCESS_EXPIRES_IN)));
    }

    authLog(AUTH_EVENTS.SESSION_REFRESH, { userId: payload.userId });
    return { access: accessToken };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const error = new Error('Refresh token expired');
      error.statusCode = 401;
      error.code = AUTH_ERROR.AUTH_TOKEN_EXPIRED;
      throw error;
    }
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    error.code = AUTH_ERROR.AUTH_TOKEN_INVALID;
    throw error;
  }
}

export async function logout(req, res) {
  const userId = req.user?.id;
  
  // PHASE S2: Revoke current session if available
  if (req.session && req.session.id && userId) {
    try {
      const { revokeSession } = await import('../services/sessionService.js');
      await revokeSession(userId, req.session.id);
    } catch (err) {
      // Log but don't fail logout if session revocation fails
      authLog(AUTH_EVENTS.LOGOUT, { userId, warning: 'Failed to revoke session', error: err.message });
    }
  }
  
  // Clear cookies with same options used to set them
  if (res) {
    const { getCookieOptions } = await import('../utils/authSession.js');
    const cookieOptions = getCookieOptions(0); // 0 = expired immediately
    
    res.clearCookie(env.JWT_COOKIE_ACCESS_NAME, cookieOptions);
    res.clearCookie(env.JWT_COOKIE_REFRESH_NAME, cookieOptions);
    res.clearCookie('ogc_session', cookieOptions); // PHASE S2: Clear session cookie
  }
  
  authLog(AUTH_EVENTS.LOGOUT, { userId });
  return { success: true, userId };
}

/**
 * Generate a secure random password reset token
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 hex characters
}

/**
 * Hash password reset token for storage
 */
function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Forgot password handler
 * Generates a reset token and sends password reset email
 * Uses PasswordResetToken table for secure token storage
 */
export async function forgotPassword({ email }) {
  try {
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find user by email (case-insensitive)
    let rows;
    try {
      [rows] = await pool.query(
        'SELECT id, email, fullName, password FROM User WHERE LOWER(email) = LOWER(?)',
        [normalizedEmail]
      );
    } catch (dbError) {
      authLog(AUTH_EVENTS.FORGOT_PASSWORD_FAILED, { email: normalizedEmail, error: dbError.message, code: dbError.code });
      if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        const error = new Error('Database connection failed. Please check your database configuration.');
        error.statusCode = 503;
        error.code = AUTH_ERROR.AUTH_SERVER_ERROR;
        throw error;
      }
      throw dbError;
    }

    // Always return success message (security: don't reveal if email exists)
    // If user exists, generate token and send email (ALL users, including OAuth-only)
    if (rows.length > 0) {
      const user = rows[0];
      
      // Create reset token using PasswordResetToken table
      // ALL users can reset password, including OAuth-only accounts
      let emailSent = false;
      let emailError = null;
      
      try {
        const tokenResult = await createPasswordResetToken(user.id);
        const expiresAt = tokenResult.expiresAt;
        
        // Build reset URL (canonical format: /reset-password?token=<TOKEN>)
        const resetUrl = `${env.FRONTEND_BASE_URL.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(tokenResult.tokenPlain)}`;
        
        // Send password reset email
        try {
          await sendPasswordResetEmail({
            to: user.email,
            resetLink: resetUrl,
            expiresAt: expiresAt
          });
          emailSent = true;
          authLog(AUTH_EVENTS.FORGOT_PASSWORD_SENT, { userId: user.id, email: user.email });
        } catch (err) {
          emailError = err;
          authLog(AUTH_EVENTS.FORGOT_PASSWORD_FAILED, { userId: user.id, email: user.email, error: err.message });
          // Don't throw - still return success to client (security best practice)
        }
      } catch (tokenError) {
        authLog(AUTH_EVENTS.FORGOT_PASSWORD_FAILED, { userId: user.id, email: user.email, error: tokenError.message });
        // Don't reveal error to user - still return generic success
      }
    }
    
    // Always return the same generic message (security best practice)
    // Never reveal whether email exists or if email was actually sent
    return {
      status: 'OK',
      code: AUTH_OK.AUTH_PASSWORD_RESET_SENT,
      message: "If an account exists for that email, a reset link has been sent.",
      data: {},
    };
  } catch (error) {
    authLog(AUTH_EVENTS.FORGOT_PASSWORD_FAILED, { email, error: error.message, code: error.code });
    
    // Re-throw with status code if already set
    if (error.statusCode) {
      throw error;
    }
    // Wrap database errors
    if (error.code && error.code.startsWith('ER_')) {
      const dbError = new Error(`Database error: ${error.message}`);
      dbError.statusCode = 500;
      dbError.code = AUTH_ERROR.AUTH_SERVER_ERROR;
      throw dbError;
    }
    throw error;
  }
}

/**
 * Validate reset token handler
 * Checks if a reset token is valid and not expired
 * Uses PasswordResetToken table for secure token validation
 */
export async function validateResetToken({ token }) {
  try {
    console.log(`[VALIDATE_RESET_TOKEN] Request received`);
    
    // Ensure token is provided
    if (!token) {
      const error = new Error('Reset token is required.');
      error.statusCode = 400;
      error.code = 'RESET_TOKEN_REQUIRED';
      throw error;
    }
    
    // Find valid reset token using PasswordResetToken table
    const resetToken = await findValidPasswordResetTokenByToken(token);
    
    if (!resetToken) {
      const error = new Error('This reset link is invalid or has expired.');
      error.statusCode = 400;
      error.code = 'RESET_TOKEN_INVALID_OR_EXPIRED';
      throw error;
    }
    
    // Token is valid
    return {
      success: true,
      message: 'Reset token is valid.',
      code: 'RESET_TOKEN_VALID',
      email: resetToken.email, // Include email for frontend convenience
    };
  } catch (error) {
    console.error('[VALIDATE_RESET_TOKEN] Error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    });
    
    // Re-throw with status code if already set
    if (error.statusCode) {
      throw error;
    }
    // Wrap database errors
    if (error.code && error.code.startsWith('ER_')) {
      const dbError = new Error(`Database error: ${error.message}`);
      dbError.statusCode = 500;
      dbError.code = error.code;
      throw dbError;
    }
    throw error;
  }
}

/**
 * Reset password handler
 * Validates token and updates user password
 * Uses PasswordResetToken table for secure token validation
 */
export async function resetPassword({ token, password }) {
  try {
    // Validate required fields
    if (!token) {
      const error = new Error('Reset token is required.');
      error.statusCode = 400;
      error.code = AUTH_ERROR.AUTH_PASSWORD_RESET_INVALID;
      throw error;
    }
    
    if (!password) {
      const error = new Error('Password is required.');
      error.statusCode = 400;
      error.code = AUTH_ERROR.AUTH_VALIDATION_ERROR;
      throw error;
    }
    
    // Validate password strength using password policy
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.ok) {
      const error = new Error(passwordValidation.errors.join(' '));
      error.statusCode = 400;
      error.code = AUTH_ERROR.AUTH_VALIDATION_ERROR;
      throw error;
    }
    
    // Find valid reset token
    const resetToken = await findValidPasswordResetTokenByToken(token);
    
    if (!resetToken) {
      authLog(AUTH_EVENTS.RESET_PASSWORD_FAILED, { reason: 'INVALID_OR_EXPIRED_TOKEN' });
      const error = new Error('This reset link is invalid or has expired.');
      error.statusCode = 400;
      error.code = AUTH_ERROR.AUTH_PASSWORD_RESET_EXPIRED;
      throw error;
    }
    
    // Check if token is already used
    if (resetToken.usedAt) {
      authLog(AUTH_EVENTS.RESET_PASSWORD_FAILED, { userId: resetToken.userId, reason: 'TOKEN_ALREADY_USED' });
      const error = new Error('This reset link has already been used.');
      error.statusCode = 400;
      error.code = AUTH_ERROR.AUTH_PASSWORD_RESET_USED;
      throw error;
    }
    
    // Check if user exists
    if (!resetToken.userId) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = AUTH_ERROR.AUTH_VALIDATION_ERROR;
      throw error;
    }
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update user's password
    try {
      await updateUserPassword(resetToken.userId, passwordHash);
    } catch (dbError) {
      authLog(AUTH_EVENTS.RESET_PASSWORD_FAILED, { userId: resetToken.userId, error: dbError.message });
      throw dbError;
    }
    
    // Mark token as used (single-use token)
    try {
      await markPasswordResetTokenUsed(resetToken.id);
    } catch (tokenError) {
      authLog(AUTH_EVENTS.RESET_PASSWORD_FAILED, { userId: resetToken.userId, warning: 'Failed to mark token as used' });
      // Don't fail the request if token marking fails - password is already updated
    }
    
    // Revoke all sessions for that user (force re-login everywhere)
    try {
      await revokeAllUserSessions(resetToken.userId);
    } catch (sessionError) {
      // Don't fail the request if session revocation fails
    }
    
    // Log security activity
    try {
      await logUserActivity({
        userId: resetToken.userId,
        actorId: resetToken.userId, // Self-action
        type: 'PASSWORD_CHANGED',
        metadata: {
          via: 'RESET_TOKEN',
          resetTokenId: resetToken.id,
        },
      });
    } catch (logError) {
      // Don't fail the request if logging fails
    }
    
    // Send password changed alert email (optional, don't fail if it fails)
    try {
      await sendPasswordChangedAlertEmail({
        to: resetToken.email,
        changedAt: new Date(),
      });
    } catch (emailError) {
      // Don't fail the request if email fails
    }
    
    authLog(AUTH_EVENTS.RESET_PASSWORD_SUCCESS, { userId: resetToken.userId, email: resetToken.email });
    return {
      status: 'OK',
      code: AUTH_OK.AUTH_PASSWORD_RESET_OK,
      message: 'Your password has been reset successfully.',
      data: {},
    };
  } catch (error) {
    authLog(AUTH_EVENTS.RESET_PASSWORD_FAILED, { error: error.message, code: error.code });
    
    // Re-throw with status code if already set
    if (error.statusCode) {
      throw error;
    }
    // Wrap database errors
    if (error.code && error.code.startsWith('ER_')) {
      const dbError = new Error(`Database error: ${error.message}`);
      dbError.statusCode = 500;
      dbError.code = AUTH_ERROR.AUTH_SERVER_ERROR;
      throw dbError;
    }
    throw error;
  }
}

/**
 * Request password reset (Phase 8.1)
 * Creates a reset token and sends password reset email
 * @param {Object} req - Express request with email in body
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return sendError(res, {
        code: "INVALID_EMAIL",
        message: "Please provide a valid email address.",
        statusCode: 400,
      });
    }

    // Normalize email (trim + lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    // Look up user by email
    const [rows] = await pool.query(
      "SELECT id, email, status FROM User WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );
    const user = rows[0];

    // To avoid leaking whether an account exists, always return OK.
    // Only create token if user exists and is active-ish.
    const userStatus = user ? normalizeAccountStatus(user.status) : null;
    if (!user || userStatus === ACCOUNT_STATUS.DISABLED) {
      // Log internally for debugging but don't reveal to client
      if (env.NODE_ENV !== "production") {
        console.log("[PasswordReset] Request for non-existing or banned email", {
          email: normalizedEmail,
        });
      }

      return sendOk(res, {
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    // Optional: check if user is allowed (status not 'pending_verification' etc.), or just allow anyway.

    // Create reset token
    const { tokenPlain, expiresAt } = await createPasswordResetToken(user.id);

    // Build reset link
    const resetLink = `${env.FRONTEND_BASE_URL.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(
      tokenPlain
    )}&email=${encodeURIComponent(user.email)}`;

    // Send email
    await sendPasswordResetEmail({
      to: user.email,
      resetLink,
      expiresAt,
    });

    return sendOk(res, {
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Validate password reset token (Phase 8.2)
 * Called by frontend when reset page loads to check if link is valid/expired
 * Supports both email+token (preferred) and token-only (backward compatibility) validation
 * @param {Object} req - Express request with email (optional) and token in body
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export async function validatePasswordResetToken(req, res, next) {
  try {
    const { email, token } = req.body;

    if (!token) {
      return sendError(res, {
        code: "INVALID_RESET_REQUEST",
        message: "Reset link is invalid.",
        statusCode: 400,
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    let user = null;
    let resetToken = null;

    // If email is provided, use it to find user (preferred path)
    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();

      // Find user by email
      const [userRows] = await pool.query(
        "SELECT id, email, status FROM User WHERE email = ? LIMIT 1",
        [normalizedEmail]
      );
      user = userRows[0];

      if (user) {
        resetToken = await findValidPasswordResetToken(user.id, token);
      }
    } else {
      // Token-only lookup (for backward compatibility with old links)
      // Find token first, then get user from token's userId
      const [tokenRows] = await pool.query(
        `SELECT prt.userId, u.email, u.status 
         FROM PasswordResetToken prt
         INNER JOIN User u ON prt.userId = u.id
         WHERE prt.token = ?
           AND prt.usedAt IS NULL
           AND prt.expiresAt > NOW()
         ORDER BY prt.createdAt DESC
         LIMIT 1`,
        [tokenHash]
      );

      if (tokenRows.length > 0) {
        const tokenRow = tokenRows[0];
        user = {
          id: tokenRow.userId,
          email: tokenRow.email,
          status: tokenRow.status,
        };
        // Verify token is valid for this user
        resetToken = await findValidPasswordResetToken(user.id, token);
      }
    }

    if (!user || !resetToken) {
      return sendError(res, {
        code: "INVALID_RESET_TOKEN",
        message: "Reset link is invalid or has expired.",
        statusCode: 400,
      });
    }

    return sendOk(res, {
      valid: true,
      email: user.email,
      // optional: expiresAt: resetToken.expiresAt
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Complete password reset with token (Phase 8.2)
 * Validates token, resets password, marks token as used, and revokes all sessions
 * Supports both email+token (preferred) and token-only (backward compatibility) validation
 * @param {Object} req - Express request with email (optional), token, and password in body
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export async function resetPasswordWithToken(req, res, next) {
  try {
    const { email, token, password } = req.body;

    if (!token || !password) {
      return sendError(res, {
        code: "INVALID_RESET_REQUEST",
        message: "Missing required fields.",
        statusCode: 400,
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return sendError(res, {
        code: "WEAK_PASSWORD",
        message: "Password must be at least 8 characters long.",
        statusCode: 400,
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    let user = null;
    let resetToken = null;

    // If email is provided, use it to find user (preferred path)
    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();

      // Find user by email
      const [userRows] = await pool.query(
        "SELECT id, email, status FROM User WHERE email = ? LIMIT 1",
        [normalizedEmail]
      );
      user = userRows[0];

      if (user) {
        // Validate token
        resetToken = await findValidPasswordResetToken(user.id, token);
      }
    } else {
      // Token-only lookup (for backward compatibility with old links)
      // Find token first, then get user from token's userId
      const [tokenRows] = await pool.query(
        `SELECT prt.userId, prt.id as tokenId, u.email, u.status 
         FROM PasswordResetToken prt
         INNER JOIN User u ON prt.userId = u.id
         WHERE prt.token = ?
           AND prt.usedAt IS NULL
           AND prt.expiresAt > NOW()
         ORDER BY prt.createdAt DESC
         LIMIT 1`,
        [tokenHash]
      );

      if (tokenRows.length > 0) {
        const tokenRow = tokenRows[0];
        user = {
          id: tokenRow.userId,
          email: tokenRow.email,
          status: tokenRow.status,
        };
        // Verify token is valid for this user and get full token record
        resetToken = await findValidPasswordResetToken(user.id, token);
      }
    }

    if (!user || !resetToken) {
      return sendError(res, {
        code: "INVALID_RESET_TOKEN",
        message: "Reset link is invalid or has expired.",
        statusCode: 400,
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await pool.query(
      "UPDATE User SET password = ? WHERE id = ?",
      [passwordHash, user.id]
    );

    // Mark token as used
    await markPasswordResetTokenUsed(resetToken.id);

    // Revoke all sessions for that user (force re-login everywhere)
    await revokeAllUserSessions(user.id);

    // Log security activity
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(",")[0].trim() || req.socket?.remoteAddress || req.connection.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    await logUserActivity({
      userId: user.id,
      actorId: user.id, // Self-action (user resetting their own password)
      type: 'PASSWORD_CHANGED',
      ipAddress,
      userAgent,
      metadata: {
        via: 'RESET_TOKEN',
        resetTokenId: resetToken.id,
      },
    });

    // Phase 8.3: Send password changed alert email
    try {
      await sendPasswordChangedAlertEmail({
        to: user.email,
        changedAt: new Date(),
        ipAddress,
        userAgent,
      });
    } catch (emailErr) {
      // Do NOT fail the password reset if email fails
      console.warn("[Auth] Failed to send password-changed alert (reset):", emailErr);
    }

    return sendOk(res, {
      message: "Your password has been reset. You can now sign in with your new password.",
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Verify 2FA code during login and complete authentication
 * @param {Object} req - Express request with challengeToken and token
 * @param {Object} res - Express response
 */
export async function verifyTwoFactorLogin(req, res) {
  try {
    const { challengeToken, token } = req.body;

    if (!challengeToken || !token) {
      const error = new Error('Challenge token and 2FA code are required');
      error.statusCode = 400;
      error.code = 'MISSING_FIELDS';
      throw error;
    }

    if (!/^\d{6}$/.test(token)) {
      const error = new Error('Invalid token format. Please enter a 6-digit code.');
      error.statusCode = 400;
      error.code = 'INVALID_TOKEN_FORMAT';
      throw error;
    }

    // Verify and decode challenge token
    let decoded;
    try {
      decoded = jwt.verify(challengeToken, env.JWT_ACCESS_SECRET);
    } catch (jwtError) {
      const error = new Error('Invalid or expired challenge token');
      error.statusCode = 401;
      error.code = 'INVALID_CHALLENGE_TOKEN';
      throw error;
    }

    if (decoded.type !== '2fa_challenge' || !decoded.userId) {
      const error = new Error('Invalid challenge token');
      error.statusCode = 401;
      error.code = 'INVALID_CHALLENGE_TOKEN';
      throw error;
    }

    const userId = decoded.userId;

    // Verify the TOTP code
    try {
      await verifyTwoFactorCode({ userId, token });
    } catch (verifyError) {
      // Record failed 2FA attempt
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      try {
        await logUserActivity({
          userId,
          actorId: userId,
          type: 'TWO_FACTOR_FAILED',
          ipAddress,
          userAgent,
          metadata: {}
        });
      } catch (activityError) {
        console.error('Failed to record 2FA failure activity:', activityError);
      }

      const error = new Error('Invalid 2FA code. Please try again.');
      error.statusCode = 401;
      error.code = 'TWO_FACTOR_INVALID_TOKEN';
      throw error;
    }

    // Get user data for session creation
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, role, status FROM User WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const user = userRows[0];

    // Check account status using normalized values
    const accountStatus = normalizeAccountStatus(user.accountStatus || user.status);
    
    if (accountStatus === ACCOUNT_STATUS.DISABLED) {
      const error = new Error('Account is disabled');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DISABLED';
      throw error;
    }

    if (accountStatus === ACCOUNT_STATUS.PENDING) {
      const error = new Error('Account not activated');
      error.statusCode = 403;
      error.code = 'ACCOUNT_NOT_VERIFIED';
      throw error;
    }

    if (!canUserLogin(accountStatus)) {
      const error = new Error('Account status invalid');
      error.statusCode = 403;
      error.code = 'ACCOUNT_STATUS_INVALID';
      throw error;
    }

    // Create auth session
    const sessionResult = await createAuthSessionForUser(res, user, req);

    // Record successful 2FA login
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await logUserActivity({
        userId,
        actorId: userId,
        type: 'LOGIN_SUCCESS_2FA',
        ipAddress,
        userAgent,
        metadata: { loginMethod: 'email_password_2fa' }
      });
    } catch (activityError) {
      console.error('Failed to record 2FA login activity:', activityError);
    }

    return {
      access: sessionResult.access,
      refresh: sessionResult.refresh,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'user',
        status: user.status
      }
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw error;
  }
}

/**
 * Phase S6: Complete 2FA login with ticket + TOTP or recovery code
 * @param {Object} req - Express request with ticket, mode, and code in body
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export async function postLoginTwoFactor(req, res, next) {
  try {
    const { ticket, mode, code } = req.body;

    // Validate input
    if (!ticket || !mode || !code) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_VALIDATION_ERROR,
        message: 'Ticket, mode, and code are required.',
        data: {},
      }, 400);
    }

    if (mode !== 'totp' && mode !== 'recovery') {
      return fail(res, {
        code: AUTH_ERROR.AUTH_VALIDATION_ERROR,
        message: 'Mode must be either "totp" or "recovery".',
        data: {},
      }, 400);
    }

    // Verify the ticket
    let decoded;
    try {
      decoded = verifyTwoFactorTicket(ticket);
    } catch (err) {
      authLog(AUTH_EVENTS.AUTH_2FA_FAILED, { reason: 'INVALID_TICKET' });
      return fail(res, {
        code: AUTH_ERROR.AUTH_2FA_INVALID,
        message: 'Two-factor challenge has expired or is invalid.',
        data: {},
      }, 401);
    }

    const userId = decoded.userId;

    // Fetch user record
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, role, status FROM User WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_NOT_AUTHENTICATED,
        message: 'User account not found.',
        data: {},
      }, 401);
    }

    const user = userRows[0];

    // Check account status using normalized values
    const accountStatus = normalizeAccountStatus(user.accountStatus || user.status);
    
    if (accountStatus === ACCOUNT_STATUS.DISABLED) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_ACCOUNT_DISABLED,
        message: 'Account is disabled.',
        data: {},
      }, 403);
    }

    if (accountStatus === ACCOUNT_STATUS.PENDING) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_ACCOUNT_PENDING,
        message: 'Account not activated.',
        data: {},
      }, 403);
    }

    if (!canUserLogin(accountStatus)) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_ACCOUNT_DISABLED,
        message: 'Account status invalid.',
        data: {},
      }, 403);
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Verify 2FA code based on mode
    if (mode === 'totp') {
      // Validate TOTP code format
      if (!/^\d{6}$/.test(code)) {
        return fail(res, {
          code: AUTH_ERROR.AUTH_2FA_INVALID,
          message: 'TOTP code must be 6 digits.',
          data: {},
        }, 400);
      }

      try {
        await verifyUserTotpCode(userId, code);
      } catch (verifyError) {
        // Log failed 2FA attempt
        try {
          await logUserActivity({
            userId,
            actorId: userId,
            type: 'LOGIN_2FA_FAILED',
            ipAddress,
            userAgent,
            metadata: { method: 'totp' }
          });
        } catch (activityError) {
          // Don't fail if activity logging fails
        }

        authLog(AUTH_EVENTS.AUTH_2FA_FAILED, { userId, method: 'totp' });
        return fail(res, {
          code: AUTH_ERROR.AUTH_2FA_INVALID,
          message: 'The code from your authenticator app is not correct.',
          data: {},
        }, 400);
      }
    } else if (mode === 'recovery') {
      // Normalize recovery code (remove spaces and dashes, convert to uppercase)
      const normalizedCode = code.replace(/[\s-]/g, '').toUpperCase();
      // Re-add dashes for validation (format: XXXX-XXXX-XXXX-XXXX)
      const formattedCode = normalizedCode.length === 16 
        ? `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4, 8)}-${normalizedCode.slice(8, 12)}-${normalizedCode.slice(12, 16)}`
        : code;

      const result = await consumeRecoveryCode(userId, formattedCode);
      if (!result.ok) {
        // Log failed recovery code attempt
        try {
          await logUserActivity({
            userId,
            actorId: userId,
            type: 'LOGIN_2FA_FAILED',
            ipAddress,
            userAgent,
            metadata: { method: 'recovery', reason: result.reason }
          });
        } catch (activityError) {
          console.error('Failed to record recovery code failure activity:', activityError);
        }

        authLog(AUTH_EVENTS.AUTH_2FA_FAILED, { userId, method: 'recovery', reason: result.reason });
        return fail(res, {
          code: AUTH_ERROR.AUTH_2FA_INVALID,
          message: 'This recovery code is invalid or has already been used.',
          data: {},
        }, 400);
      }

      // Log recovery code usage
      try {
        await logUserActivity({
          userId,
          actorId: userId,
          type: 'LOGIN_RECOVERY_CODE_USED',
          ipAddress,
          userAgent,
          metadata: { method: 'recovery' }
        });
      } catch (activityError) {
        console.error('Failed to record recovery code usage activity:', activityError);
      }
    }

    // 2FA verification successful - create session
    const sessionResult = await createAuthSessionForUser(res, user, req);

    // Record successful 2FA login
    try {
      await logUserActivity({
        userId,
        actorId: userId,
        type: 'LOGIN_2FA_SUCCEEDED',
        ipAddress,
        userAgent,
        metadata: { loginMethod: 'email_password_2fa', method: mode }
      });
    } catch (activityError) {
      // Don't fail if activity logging fails
    }

    authLog(AUTH_EVENTS.AUTH_2FA_SUCCESS, { userId, method: mode });
    // Return success response matching the normal login format
    return ok(res, {
      code: AUTH_OK.AUTH_LOGIN_OK,
      message: 'Two-factor verification successful.',
      data: {
        access: sessionResult.access,
        refresh: sessionResult.refresh,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role || 'STANDARD_USER',
          status: user.status
        }
      }
    }, 200);
  } catch (err) {
    return next(err);
  }
}

/**
 * Shared OAuth callback handler
 * Handles both login and connect flows
 * Supports JSON responses for API-first approach
 * 
 * Connect flow: If state parameter contains a JWT with userId, link provider to that user
 * Login flow: Creates a normal auth session (cookies) so the user stays logged in
 */
export async function handleOAuthCallback(req, res, next, providerName) {
  const SOCIAL_FAILURE_REDIRECT = `${env.FRONTEND_BASE_URL}/auth/social/callback?status=error`;
  
  try {
    // Check if this is a connect flow (state parameter contains userId)
    let existingUserId = null;
    let isConnectFlow = false;
    const stateParam = req.query.state;
    
    if (stateParam) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(stateParam, env.JWT_ACCESS_SECRET);
        
        if (decoded.action === 'connect' && decoded.userId) {
          existingUserId = decoded.userId;
          isConnectFlow = true;
        }
      } catch (stateError) {
        // Invalid state token - treat as normal login flow
        console.warn('[OAuth] Invalid state token, treating as login flow:', stateError.message);
      }
    }
    
    // Get user from passport verify callback (passport already called syncOAuthProfile)
    let user = req.user;
    
    if (!user) {
      // Check if this is an API request (JSON preferred)
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendError(res, {
          code: 'OAUTH_AUTHENTICATION_FAILED',
          message: 'OAuth authentication failed. No user data received from provider.',
          statusCode: 401,
        });
      }
      return res.redirect(`${SOCIAL_FAILURE_REDIRECT}&provider=${providerName}&error=authentication_failed`);
    }
    
    // Check if email is missing (passport verify callback passes special marker object)
    if (user && user.__oauthMissingEmail) {
      console.log(`[OAUTH] Missing email from ${providerName}. Redirecting to needs_email flow.`);
      
      // Create email ticket with profile data
      const ticket = createOAuthEmailTicket({
        provider: user.provider || providerName,
        providerUserId: user.providerUserId,
        displayName: user.displayName || null,
        avatarUrl: user.avatarUrl || null,
      });
      
      // Redirect to frontend with needs_email parameter and ticket
      const redirectUrl = getOAuthNeedsEmailRedirect(providerName, ticket);
      
      // Check if this is an API request (JSON preferred)
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendError(res, {
          code: 'OAUTH_EMAIL_REQUIRED',
          message: 'OAuth provider did not provide an email address. Please complete authentication by providing your email.',
          statusCode: 400,
          data: { ticket, provider: providerName },
        });
      }
      
      return res.redirect(redirectUrl);
    }
    
    // If this is a connect flow, re-sync with existingUserId to properly link the provider
    if (isConnectFlow && existingUserId && user.id !== existingUserId) {
      try {
        const { syncOAuthProfile } = await import('../services/userService.js');
        
        // Get provider column map
        const providerColumnMap = {
          google: 'googleId',
          github: 'githubId',
          twitter: 'twitterId',
          linkedin: 'linkedinId',
          discord: 'discordId',
        };
        const providerColumn = providerColumnMap[providerName.toLowerCase()];
        
        if (providerColumn) {
          // Get providerUserId from the user that was created/linked by passport
          const [oauthUserRows] = await pool.query(
            `SELECT ${providerColumn}, email, fullName, avatarUrl, emailVerified FROM User WHERE id = ?`,
            [user.id]
          );
          
          if (oauthUserRows.length > 0 && oauthUserRows[0][providerColumn]) {
            const providerUserId = oauthUserRows[0][providerColumn];
            const oauthUser = oauthUserRows[0];
            
            // Re-sync with existingUserId to properly link the provider
            // We extract profile data from the user object and re-sync
            const syncResult = await syncOAuthProfile({
              provider: providerName,
              providerUserId: providerUserId,
              email: oauthUser.email || null,
              emailVerified: oauthUser.emailVerified === 1 || false,
              displayName: oauthUser.fullName || null,
              avatarUrl: oauthUser.avatarUrl || null,
              existingUserId: existingUserId,
            });
            
            user = syncResult.user;
          }
        }
      } catch (linkError) {
        console.error('[OAuth] Failed to link provider in connect flow:', linkError);
        // If it's a conflict error, return that
        if (linkError.code === 'OAUTH_ACCOUNT_ALREADY_LINKED' || linkError.code === 'OAUTH_EMAIL_CONFLICT') {
          if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return sendError(res, {
              code: linkError.code,
              message: linkError.message,
              statusCode: linkError.statusCode || 409,
            });
          }
          return res.redirect(`${SOCIAL_FAILURE_REDIRECT}&provider=${providerName}&error=conflict&message=${encodeURIComponent(linkError.message)}`);
        }
        // For other errors, continue with the OAuth user - better than failing completely
      }
    }
    
    // Check account status (same checks as normal login) using normalized values
    const accountStatus = normalizeAccountStatus(user.accountStatus || user.status);
    
    if (accountStatus === ACCOUNT_STATUS.DISABLED) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendError(res, {
          code: 'ACCOUNT_DISABLED',
          message: 'Account is disabled.',
          statusCode: 403,
        });
      }
      return res.redirect(`${SOCIAL_FAILURE_REDIRECT}&provider=${providerName}&error=account_disabled`);
    }
    
    if (accountStatus === ACCOUNT_STATUS.PENDING) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendError(res, {
          code: 'ACCOUNT_NOT_VERIFIED',
          message: 'Account not activated.',
          statusCode: 403,
        });
      }
      return res.redirect(`${SOCIAL_FAILURE_REDIRECT}&provider=${providerName}&error=account_not_verified`);
    }

    if (!canUserLogin(accountStatus)) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendError(res, {
          code: 'ACCOUNT_STATUS_INVALID',
          message: 'Account status invalid.',
          statusCode: 403,
        });
      }
      return res.redirect(`${SOCIAL_FAILURE_REDIRECT}&provider=${providerName}&error=account_status_invalid`);
    }
    
    // If this is a connect flow (existingUserId set and user matches), don't create a new session
    // Just link the provider and return success
    if (isConnectFlow && existingUserId && user.id === existingUserId) {
      // Provider successfully linked to existing account
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendOk(res, {
          userId: user.id,
          provider: providerName,
          linked: true,
        }, 200, 'OAUTH_PROVIDER_LINKED', `${providerName} account linked successfully.`);
      }
      // Browser redirect - go back to security page
      return res.redirect(`${env.FRONTEND_BASE_URL}/dashboard/security?oauth=connected&provider=${providerName}`);
    }
    
    // LOGIN FLOW: Create normal auth session (same as email/password login)
    // This sets cookies so the user stays logged in
    await createAuthSessionForUser(res, user, req);
    
    // Record login activity and register device
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    try {
      await recordLoginActivity(user.id, {
        ipAddress,
        userAgent,
        metadata: { loginMethod: `${providerName}_oauth` }
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
    
    // Check if this is an API request (JSON preferred)
    if (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html')) {
      return sendOk(res, {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      }, 200, 'OAUTH_LOGIN_SUCCESS', 'Login via OAuth successful.');
    }
    
    // Browser redirect flow: cookies are already set by createAuthSessionForUser above
    // Cookies are set synchronously via res.cookie() before redirect, so they will be sent in the response
    // Redirect to frontend with oauth=success parameter (canonical redirect URL)
    // The frontend will verify cookies via /auth/me and then redirect to dashboard
    const successRedirect = getOAuthSuccessRedirect(providerName);
    return res.redirect(successRedirect);
  } catch (err) {
    console.error(`[${providerName.toUpperCase()}_CALLBACK] Error:`, {
      message: err.message,
      code: err.code,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    // Handle specific OAuth errors
    if (err.code === 'OAUTH_EMAIL_REQUIRED') {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendError(res, {
          code: 'OAUTH_EMAIL_REQUIRED',
          message: err.message,
          statusCode: 400,
        });
      }
      return res.redirect(`${SOCIAL_FAILURE_REDIRECT}&provider=${providerName}&error=email_required&message=${encodeURIComponent(err.message)}`);
    }
    
    if (err.code === 'OAUTH_EMAIL_CONFLICT' || err.code === 'OAUTH_ACCOUNT_ALREADY_LINKED') {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return sendError(res, {
          code: err.code,
          message: err.message,
          statusCode: 409,
        });
      }
      return res.redirect(`${SOCIAL_FAILURE_REDIRECT}&provider=${providerName}&error=conflict&message=${encodeURIComponent(err.message)}`);
    }
    
    // Generic error handling
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return sendError(res, {
        code: 'OAUTH_CALLBACK_ERROR',
        message: err.message || 'OAuth callback failed.',
        statusCode: 500,
      });
    }
    
    const errorMsg = encodeURIComponent(err.message || 'Authentication failed');
    return res.redirect(`${SOCIAL_FAILURE_REDIRECT}&provider=${providerName}&error=${errorMsg}`);
  }
}

// Legacy function name for backward compatibility
export async function socialLoginCallback(req, res, next) {
  return handleOAuthCallback(req, res, next, req.user?.authProvider || 'github');
}

/**
 * Lightweight session health check endpoint
 * Checks if user has a valid JWT token (no database calls)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function checkSession(req, res) {
  try {
    // Try to get token from cookie first
    const tokenFromCookie = req.cookies && req.cookies[env.JWT_COOKIE_ACCESS_NAME];

    // Fallback to Authorization header
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return res.status(200).json({ authenticated: false });
    }

    // Verify JWT (lightweight check - no database calls)
    try {
      jwt.verify(token, env.JWT_ACCESS_SECRET);
      return res.status(200).json({ authenticated: true });
    } catch (jwtError) {
      // Token invalid or expired
      return res.status(200).json({ authenticated: false });
    }
  } catch (err) {
    // On any error, assume not authenticated
    return res.status(200).json({ authenticated: false });
  }
}


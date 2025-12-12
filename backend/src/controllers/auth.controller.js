import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { createActivationToken, getTermsVersion } from '../services/activationService.js';
import { sendActivationEmail, sendPasswordResetEmail, sendPasswordChangedAlertEmail } from '../services/emailService.js';
import { createAuthSessionForUser } from '../utils/authSession.js';
import { getTwoFactorStatus, verifyTwoFactorCode } from '../services/userService.js';
import { getTwoFactorStatusForUser, verifyUserTotpCode } from '../services/twoFactorService.js';
import { getRecoveryCodesStatusForUser, consumeRecoveryCode } from '../services/twoFactorRecoveryService.js';
import { createTwoFactorTicket, verifyTwoFactorTicket } from '../utils/twoFactorTicket.js';
import { logUserActivity } from '../services/activityService.js';
import { sendOk, sendError } from '../utils/apiResponse.js';
import { createPasswordResetToken, findValidPasswordResetToken, markPasswordResetTokenUsed } from '../services/passwordResetService.js';
import { revokeAllUserSessions } from '../services/sessionService.js';

// Note: JWT configuration and session creation logic moved to utils/authSession.js
// This keeps the code DRY and allows both email/password and social login to share the same session logic

export async function register({ email, password, fullName, termsAccepted }, res) {
  try {
    console.log(`[REGISTER] Attempting registration for: ${email}`);
    
    // Validate terms acceptance
    if (!termsAccepted) {
      const error = new Error('Terms & Conditions must be accepted');
      error.statusCode = 400;
      error.code = 'TERMS_NOT_ACCEPTED';
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
      console.error('[REGISTER] Database error checking existing user:', {
        code: dbError.code,
        message: dbError.message,
        sqlState: dbError.sqlState
      });
      // Handle database connection errors
      if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        const error = new Error('Database connection failed. Please check your database configuration.');
        error.statusCode = 503;
        error.code = dbError.code;
        throw error;
      }
      throw dbError;
    }
    if (existing.length > 0) {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const termsVersion = getTermsVersion();
    const now = new Date();

    // Create user with pending_verification status
    let result;
    try {
      [result] = await pool.query(
        `INSERT INTO User (email, password, fullName, status, termsAccepted, termsAcceptedAt, termsVersion, termsSource) 
         VALUES (?, ?, ?, 'pending_verification', ?, ?, ?, 'email_password')`,
        [email, passwordHash, fullName || null, true, now, termsVersion]
      );
    } catch (dbError) {
      console.error('[REGISTER] Database error creating user:', {
        code: dbError.code,
        message: dbError.message,
        sqlState: dbError.sqlState
      });
      throw dbError;
    }

    const userId = result.insertId;
    console.log(`[REGISTER] User created with ID: ${userId}`);

    // Create activation token
    const { token: activationToken } = await createActivationToken(userId);

    // Send activation email
    try {
      await sendActivationEmail({ to: email, token: activationToken, fullName });
      console.log(`✅ Registration successful for ${email}, activation email sent`);
    } catch (emailError) {
      // Log email error but don't fail registration
      console.error(`⚠️  Registration succeeded but failed to send activation email:`, emailError);
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
    console.error('[REGISTER] Registration error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      sqlState: error.sqlState
    });
    
    // Handle MySQL duplicate entry error
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      const dupError = new Error('Email already in use');
      dupError.statusCode = 409;
      dupError.code = 'EMAIL_ALREADY_EXISTS';
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
      dbError.code = error.code;
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
        const error = new Error('Database connection failed. Please check your database configuration.');
        error.statusCode = 503;
        error.code = dbError.code;
        throw error;
      }
      // Handle missing column errors (log detailed error for debugging)
      if (dbError.code === 'ER_BAD_FIELD_ERROR' || (dbError.message && dbError.message.includes('Unknown column'))) {
        console.error('[AuthLogin] Database schema error during login:', {
          code: dbError.code,
          message: dbError.message,
          sqlState: dbError.sqlState,
          sqlMessage: dbError.sqlMessage
        });
        const error = new Error('Database error occurred. Please try again later.');
        error.statusCode = 500;
        error.code = 'DATABASE_SCHEMA_ERROR';
        error.originalError = dbError;
        throw error;
      }
      throw dbError;
    }
    const user = rows[0];
    
    // Always return generic error for invalid credentials (security: don't reveal if email exists)
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check account status
    if (user.status === 'DELETED') {
      const error = new Error('This account has been deleted and can no longer be used to sign in.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DELETED';
      throw error;
    }

    if (user.status === 'disabled') {
      const error = new Error('Account is disabled');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DISABLED';
      throw error;
    }

    if (user.status === 'pending_verification') {
      const error = new Error('Account not activated');
      error.statusCode = 403;
      error.code = 'ACCOUNT_NOT_VERIFIED';
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
      return {
        status: '2FA_REQUIRED',
        code: 'TWO_FACTOR_REQUIRED',
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
    return await createAuthSessionForUser(res, user, req);
  } catch (error) {
    // Re-throw with status code if already set
    if (error.statusCode) {
      throw error;
    }
    // Wrap database errors
    if (error.code && error.code.startsWith('ER_')) {
      // If it's a schema error (missing column), log detailed error
      if (error.code === 'ER_BAD_FIELD_ERROR' || (error.message && error.message.includes('Unknown column'))) {
        console.error('[AuthLogin] Database schema error during login:', {
          code: error.code,
          message: error.message,
          sqlState: error.sqlState,
          sqlMessage: error.sqlMessage
        });
        const dbError = new Error('Database error occurred. Please try again later.');
        dbError.statusCode = 500;
        dbError.code = 'DATABASE_SCHEMA_ERROR';
        throw dbError;
      }
      const dbError = new Error(`Database error: ${error.message}`);
      dbError.statusCode = 500;
      dbError.code = error.code;
      throw dbError;
    }
    throw error;
  }
}

export async function refresh(req, res) {
  try {
    // Get refresh token from cookie first, then from body
    const refreshToken = req.cookies?.[JWT_COOKIE_REFRESH_NAME] || req.body?.refreshToken;
    
    if (!refreshToken) {
      throw new Error('Refresh token required');
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: payload.userId, role: payload.role },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    );

    // Set new access token cookie if res is provided
    if (res) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie(JWT_COOKIE_ACCESS_NAME, accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: parseExpiresIn(JWT_ACCESS_EXPIRES_IN),
      });
    }

    return { access: accessToken };
  } catch {
    throw new Error('Invalid refresh token');
  }
}

export async function logout(req, res) {
  // PHASE S2: Revoke current session if available
  if (req.session && req.session.id && req.user && req.user.id) {
    try {
      const { revokeSession } = await import('../services/sessionService.js');
      await revokeSession(req.user.id, req.session.id);
    } catch (err) {
      // Log but don't fail logout if session revocation fails
      console.warn('[Logout] Failed to revoke session:', err.message);
    }
  }
  
  // Clear cookies
  if (res) {
    const {
      JWT_COOKIE_ACCESS_NAME = 'ogc_access',
      JWT_COOKIE_REFRESH_NAME = 'ogc_refresh',
    } = process.env;
    
    res.clearCookie(JWT_COOKIE_ACCESS_NAME);
    res.clearCookie(JWT_COOKIE_REFRESH_NAME);
    res.clearCookie('ogc_session'); // PHASE S2: Clear session cookie
  }
  
  return { success: true, userId: req.user?.id };
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
 */
export async function forgotPassword({ email }) {
  try {
    console.log(`[FORGOT_PASSWORD] Request received for: ${email}`);
    
    // Find user by email (case-insensitive)
    let rows;
    try {
      [rows] = await pool.query(
        'SELECT id, email, fullName FROM User WHERE LOWER(email) = LOWER(?)',
        [email]
      );
    } catch (dbError) {
      console.error('[FORGOT_PASSWORD] Database error:', {
        code: dbError.code,
        message: dbError.message,
      });
      if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        const error = new Error('Database connection failed. Please check your database configuration.');
        error.statusCode = 503;
        error.code = dbError.code;
        throw error;
      }
      throw dbError;
    }

    // Always return success message (security: don't reveal if email exists)
    // If user exists, generate token and send email
    if (rows.length > 0) {
      const user = rows[0];
      
      // Generate reset token
      const plainToken = generateResetToken();
      const hashedToken = hashResetToken(plainToken);
      
      // Set expiry to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Store hashed token and expiry in database
      try {
        await pool.query(
          'UPDATE User SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?',
          [hashedToken, expiresAt, user.id]
        );
        console.log(`[FORGOT_PASSWORD] Reset token generated for user ID: ${user.id}`);
      } catch (dbError) {
        console.error('[FORGOT_PASSWORD] Database error storing token:', {
          code: dbError.code,
          message: dbError.message,
        });
        throw dbError;
      }
      
      // Build reset URL
      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/auth/reset-password?token=${encodeURIComponent(plainToken)}`;
      
      // Send password reset email
      try {
        await sendPasswordResetEmail({
          to: user.email,
          resetLink: resetUrl,
          expiresAt: expiresAt
        });
        console.log(`✅ Password reset email sent to ${user.email}`);
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error(`⚠️  Failed to send password reset email:`, emailError);
        // In production, you might want to queue this for retry
      }
    } else {
      console.log(`[FORGOT_PASSWORD] Email not found (returning generic message): ${email}`);
    }
    
    // Always return the same generic message
    return {
      success: true,
      message: "If this email is registered, we sent a password reset link.",
    };
  } catch (error) {
    console.error('[FORGOT_PASSWORD] Error:', {
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
 * Validate reset token handler
 * Checks if a reset token is valid and not expired
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
    
    // Hash the provided token to look it up
    const hashedToken = hashResetToken(token);
    
    // Lookup user by resetPasswordToken
    let rows;
    try {
      [rows] = await pool.query(
        'SELECT id, resetPasswordToken, resetPasswordExpires FROM User WHERE resetPasswordToken = ?',
        [hashedToken]
      );
    } catch (dbError) {
      console.error('[VALIDATE_RESET_TOKEN] Database error:', {
        code: dbError.code,
        message: dbError.message,
      });
      if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        const error = new Error('Database connection failed. Please check your database configuration.');
        error.statusCode = 503;
        error.code = dbError.code;
        throw error;
      }
      throw dbError;
    }
    
    // Check if token exists
    if (rows.length === 0) {
      const error = new Error('This reset link is invalid or has expired.');
      error.statusCode = 400;
      error.code = 'RESET_TOKEN_INVALID_OR_EXPIRED';
      throw error;
    }
    
    const user = rows[0];
    
    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.resetPasswordExpires);
    
    if (expiresAt < now) {
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
 */
export async function resetPassword({ token, password, confirmPassword }) {
  try {
    console.log(`[RESET_PASSWORD] Request received`);
    
    // Validate password and confirmPassword match
    if (!token || !password || !confirmPassword) {
      const error = new Error('Token, password, and confirm password are required.');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    
    if (password !== confirmPassword) {
      const error = new Error('Passwords do not match.');
      error.statusCode = 400;
      error.code = 'PASSWORD_MISMATCH';
      throw error;
    }
    
    // Validate password length (same as registration: min 8 chars)
    if (password.length < 8) {
      const error = new Error('Password does not meet security requirements.');
      error.statusCode = 400;
      error.code = 'PASSWORD_WEAK';
      throw error;
    }
    
    // Hash the provided token to look it up
    const hashedToken = hashResetToken(token);
    
    // Lookup user by resetPasswordToken
    let rows;
    try {
      [rows] = await pool.query(
        'SELECT id, email, resetPasswordToken, resetPasswordExpires FROM User WHERE resetPasswordToken = ?',
        [hashedToken]
      );
    } catch (dbError) {
      console.error('[RESET_PASSWORD] Database error:', {
        code: dbError.code,
        message: dbError.message,
      });
      if (dbError.code === 'ER_ACCESS_DENIED_ERROR' || dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        const error = new Error('Database connection failed. Please check your database configuration.');
        error.statusCode = 503;
        error.code = dbError.code;
        throw error;
      }
      throw dbError;
    }
    
    // Check if token exists
    if (rows.length === 0) {
      const error = new Error('This reset link is invalid or has expired.');
      error.statusCode = 400;
      error.code = 'RESET_TOKEN_INVALID_OR_EXPIRED';
      throw error;
    }
    
    const user = rows[0];
    
    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.resetPasswordExpires);
    
    if (expiresAt < now) {
      const error = new Error('This reset link is invalid or has expired.');
      error.statusCode = 400;
      error.code = 'RESET_TOKEN_INVALID_OR_EXPIRED';
      throw error;
    }
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update user's password and clear reset fields
    try {
      await pool.query(
        'UPDATE User SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?',
        [passwordHash, user.id]
      );
      console.log(`✅ Password reset successful for user ID: ${user.id}`);
    } catch (dbError) {
      console.error('[RESET_PASSWORD] Database error updating password:', {
        code: dbError.code,
        message: dbError.message,
      });
      throw dbError;
    }
    
    // Note: We don't invalidate existing sessions/refresh tokens here
    // since JWT tokens are stateless. If you want to invalidate sessions,
    // you would need to implement a token blacklist or track token versions.
    
    return {
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.',
      code: 'PASSWORD_RESET_SUCCESS',
    };
  } catch (error) {
    console.error('[RESET_PASSWORD] Error:', {
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
    if (!user || user.status === "banned") {
      // Log internally for debugging but don't reveal to client
      if (process.env.NODE_ENV !== "production") {
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

    // Build reset link – FRONTEND_URL should already exist (or create BACKEND_APP_BASE_URL)
    const baseUrl = process.env.FRONTEND_APP_URL || process.env.APP_BASE_URL || process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${baseUrl.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(
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
      decoded = jwt.verify(challengeToken, process.env.JWT_ACCESS_SECRET);
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

    // Check account status
    if (user.status === 'DELETED') {
      const error = new Error('This account has been deleted and can no longer be used to sign in.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DELETED';
      throw error;
    }

    if (user.status === 'disabled') {
      const error = new Error('Account is disabled');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DISABLED';
      throw error;
    }

    if (user.status === 'pending_verification') {
      const error = new Error('Account not activated');
      error.statusCode = 403;
      error.code = 'ACCOUNT_NOT_VERIFIED';
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
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Ticket, mode, and code are required.',
        statusCode: 400,
      });
    }

    if (mode !== 'totp' && mode !== 'recovery') {
      return sendError(res, {
        code: 'VALIDATION_ERROR',
        message: 'Mode must be either "totp" or "recovery".',
        statusCode: 400,
      });
    }

    // Verify the ticket
    let decoded;
    try {
      decoded = verifyTwoFactorTicket(ticket);
    } catch (err) {
      return sendError(res, {
        code: 'INVALID_2FA_TICKET',
        message: 'Two-factor challenge has expired or is invalid.',
        statusCode: 401,
      });
    }

    const userId = decoded.userId;

    // Fetch user record
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, role, status FROM User WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return sendError(res, {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'User account not found.',
        statusCode: 401,
      });
    }

    const user = userRows[0];

    // Check account status
    if (user.status === 'DELETED') {
      return sendError(res, {
        code: 'ACCOUNT_DELETED',
        message: 'This account has been deleted and can no longer be used to sign in.',
        statusCode: 403,
      });
    }

    if (user.status === 'disabled') {
      return sendError(res, {
        code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled.',
        statusCode: 403,
      });
    }

    if (user.status === 'pending_verification') {
      return sendError(res, {
        code: 'ACCOUNT_NOT_VERIFIED',
        message: 'Account not activated.',
        statusCode: 403,
      });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Verify 2FA code based on mode
    if (mode === 'totp') {
      // Validate TOTP code format
      if (!/^\d{6}$/.test(code)) {
        return sendError(res, {
          code: 'INVALID_TOTP_CODE',
          message: 'TOTP code must be 6 digits.',
          statusCode: 400,
        });
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
          console.error('Failed to record 2FA failure activity:', activityError);
        }

        return sendError(res, {
          code: 'INVALID_TOTP_CODE',
          message: 'The code from your authenticator app is not correct.',
          statusCode: 400,
        });
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

        return sendError(res, {
          code: 'INVALID_RECOVERY_CODE',
          message: 'This recovery code is invalid or has already been used.',
          statusCode: 400,
        });
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
      console.error('Failed to record 2FA login activity:', activityError);
    }

    // Return success response matching the normal login format
    return sendOk(res, {
      access: sessionResult.access,
      refresh: sessionResult.refresh,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'STANDARD_USER',
        status: user.status
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Social login callback handler
 * Called after successful OAuth authentication
 * Creates auth session and redirects to frontend
 */
export async function socialLoginCallback(req, res, next) {
  try {
    const user = req.user; // set by passport verify callback
    
    if (!user) {
      return res.redirect('/auth/login?provider=github&error=authentication_failed');
    }
    
    // Pass req parameter to ensure session is created with IP and user agent
    await createAuthSessionForUser(res, user, req);
    
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const provider = req.user?.authProvider || 'github';
    return res.redirect(`${FRONTEND_URL}/auth/social/callback?status=success&provider=${provider}`);
  } catch (err) {
    console.error('[SOCIAL_LOGIN_CALLBACK] Error:', err);
    return res.redirect('/auth/login?provider=github&error=callback_error');
  }
}


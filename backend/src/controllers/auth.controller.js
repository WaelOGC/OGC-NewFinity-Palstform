import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { createActivationToken, getTermsVersion } from '../services/activationService.js';
import { sendActivationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { createAuthSessionForUser } from '../utils/authSession.js';
import { getTwoFactorStatus, verifyTwoFactorCode } from '../services/userService.js';
import { recordUserActivity } from '../services/userService.js';

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

    // Phase 3: Check if 2FA is enabled
    const twoFactorStatus = await getTwoFactorStatus(user.id);
    
    if (twoFactorStatus.enabled) {
      // Generate a short-lived challenge token (5 minutes)
      const challengeToken = jwt.sign(
        { userId: user.id, type: '2fa_challenge' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '5m' }
      );
      
      // Return challenge token instead of full login
      return {
        twoFactorRequired: true,
        challengeToken
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
  // Clear cookies
  if (res) {
    const {
      JWT_COOKIE_ACCESS_NAME = 'ogc_access',
      JWT_COOKIE_REFRESH_NAME = 'ogc_refresh',
    } = process.env;
    
    res.clearCookie(JWT_COOKIE_ACCESS_NAME);
    res.clearCookie(JWT_COOKIE_REFRESH_NAME);
  }
  
  // stateless JWT: optionally implement refresh token blacklist
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
        await sendPasswordResetEmail(
          { email: user.email, fullName: user.fullName },
          resetUrl
        );
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
        await recordUserActivity({
          userId,
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
      await recordUserActivity({
        userId,
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
    
    await createAuthSessionForUser(res, user);
    
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const provider = req.user?.authProvider || 'github';
    return res.redirect(`${FRONTEND_URL}/auth/social/callback?status=success&provider=${provider}`);
  } catch (err) {
    console.error('[SOCIAL_LOGIN_CALLBACK] Error:', err);
    return res.redirect('/auth/login?provider=github&error=callback_error');
  }
}


import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { createActivationToken, getTermsVersion } from '../services/activationService.js';
import { sendActivationEmail } from '../services/emailService.js';

// Standardized JWT configuration
// Note: These are read from process.env at module load time
// Ensure dotenv.config() is called in the entry point (index.js or server.js) before importing this module
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN = '15m',
  JWT_REFRESH_EXPIRES_IN = '7d',
  JWT_COOKIE_ACCESS_NAME = 'ogc_access',
  JWT_COOKIE_REFRESH_NAME = 'ogc_refresh',
} = process.env;

// Validate required JWT secrets (warning only at module load - actual validation happens in functions)
if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  console.warn('WARNING: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
  console.warn('Make sure .env file exists in backend/ directory and contains these variables');
}

// Helper to convert time string to milliseconds
function parseExpiresIn(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes
  const [, value, unit] = match;
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return parseInt(value) * (multipliers[unit] || 1000);
}

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
      await sendActivationEmail(email, activationToken, fullName);
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

export async function login({ email, password }, res) {
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

    // Only allow login if status is 'active'
    if (user.status !== 'active') {
      const error = new Error('Account status invalid');
      error.statusCode = 403;
      error.code = 'ACCOUNT_STATUS_INVALID';
      throw error;
    }

    const payload = { userId: user.id, role: user.role || 'user' };

    // Validate JWT secrets before signing
    if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
      const error = new Error('JWT secrets not configured');
      error.statusCode = 500;
      throw error;
    }

    // Generate tokens
    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    // Set cookies if res is provided
    if (res) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie(JWT_COOKIE_ACCESS_NAME, accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: parseExpiresIn(JWT_ACCESS_EXPIRES_IN),
      });
      res.cookie(JWT_COOKIE_REFRESH_NAME, refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: parseExpiresIn(JWT_REFRESH_EXPIRES_IN),
      });
    }

    return { access: accessToken, refresh: refreshToken };
  } catch (error) {
    // Re-throw with status code if already set
    if (error.statusCode) {
      throw error;
    }
    // Wrap database errors
    if (error.code && error.code.startsWith('ER_')) {
      const dbError = new Error(`Database error: ${error.message}`);
      dbError.statusCode = 500;
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


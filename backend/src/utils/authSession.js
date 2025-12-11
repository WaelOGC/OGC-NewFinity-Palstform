import jwt from 'jsonwebtoken';
import pool from '../db.js';

// Standardized JWT configuration
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN = '15m',
  JWT_REFRESH_EXPIRES_IN = '7d',
  JWT_COOKIE_ACCESS_NAME = 'ogc_access',
  JWT_COOKIE_REFRESH_NAME = 'ogc_refresh',
} = process.env;

// Helper to convert time string to milliseconds
function parseExpiresIn(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes
  const [, value, unit] = match;
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return parseInt(value) * (multipliers[unit] || 1000);
}

/**
 * Create authentication session for a user
 * This function sets JWT cookies and returns tokens, reusing the exact logic from email/password login
 * 
 * @param {Object} res - Express response object
 * @param {Object} user - User object with at least { id, role }
 * @returns {Object} - Object with access and refresh tokens
 */
export async function createAuthSessionForUser(res, user) {
  // Validate JWT secrets before signing
  if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    const error = new Error('JWT secrets not configured');
    error.statusCode = 500;
    throw error;
  }

  // Check account status (same validation as regular login)
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
}


import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

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

export async function register({ email, password, fullName }, res) {
  try {
    // Check if user already exists
    let existing;
    try {
      [existing] = await pool.query(
        'SELECT id FROM User WHERE email = ?',
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
    if (existing.length > 0) {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO User (email, password, fullName) VALUES (?, ?, ?)',
      [email, passwordHash, fullName || null]
    );

    const userId = result.insertId;
    const payload = { userId };

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

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
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

    return { success: true, userId, access: accessToken, refresh: refreshToken };
  } catch (error) {
    // Handle MySQL duplicate entry error
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      const dupError = new Error('Email already in use');
      dupError.statusCode = 409;
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
        'SELECT id, email, password, role FROM User WHERE email = ?',
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
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
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


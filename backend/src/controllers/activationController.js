/**
 * Activation Controller
 * Handles account activation and resend activation email
 */

import pool from '../db.js';
import { activateAccount, createActivationToken } from '../services/activationService.js';
import { sendResendActivationEmail } from '../services/emailService.js';
import jwt from 'jsonwebtoken';

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN = '15m',
  JWT_REFRESH_EXPIRES_IN = '7d',
  JWT_COOKIE_ACCESS_NAME = 'ogc_access',
  JWT_COOKIE_REFRESH_NAME = 'ogc_refresh',
} = process.env;

function parseExpiresIn(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const [, value, unit] = match;
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return parseInt(value) * (multipliers[unit] || 1000);
}

/**
 * Activate user account with token
 */
export async function activate(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Activation token is required',
        code: 'TOKEN_MISSING',
      });
    }

    // Activate account
    const result = await activateAccount(token);

    // Get user details
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, role FROM User WHERE id = ?',
      [result.userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found',
      });
    }

    const user = userRows[0];

    // Generate tokens for automatic login
    const payload = { userId: user.id, role: user.role || 'user' };

    if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
      return res.status(500).json({
        status: 'ERROR',
        message: 'JWT secrets not configured',
      });
    }

    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    // Set cookies
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

    console.log(`✅ Account activated and user logged in: ${user.email}`);

    return res.status(200).json({
      status: 'OK',
      message: 'Account activated successfully',
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('Activation error:', error);

    // Generic error message to avoid revealing token validity
    return res.status(400).json({
      status: 'ERROR',
      message: 'This activation link is invalid or has expired',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Resend activation email
 */
export async function resendActivation(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Email is required',
      });
    }

    // Check if user exists with pending_verification status
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, status FROM User WHERE email = ?',
      [email]
    );

    // Always return success to avoid user enumeration
    // But only send email if user exists and is pending
    if (userRows.length > 0) {
      const user = userRows[0];

      if (user.status === 'pending_verification') {
        // Create new activation token
        const { token: activationToken } = await createActivationToken(user.id);

        // Send activation email
        try {
          await sendResendActivationEmail(user.email, activationToken, user.fullName);
          console.log(`✅ Resend activation email sent to ${user.email}`);
        } catch (emailError) {
          console.error(`⚠️  Failed to send resend activation email:`, emailError);
          // Still return success to avoid revealing email existence
        }
      }
    }

    // Generic success message
    return res.status(200).json({
      status: 'OK',
      message: 'If an account exists for this email, a new activation link has been sent',
    });
  } catch (error) {
    console.error('Resend activation error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to process request',
    });
  }
}


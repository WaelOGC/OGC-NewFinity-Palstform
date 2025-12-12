import jwt from 'jsonwebtoken';
import pool from '../db.js';
import crypto from 'crypto';
import { createSessionForUser, isNewDeviceOrIpForUser } from '../services/sessionService.js';
import { sendNewLoginAlertEmail } from '../services/emailService.js';
import { logUserActivity } from '../services/activityService.js';

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
 * @param {Object} [req] - Express request object (optional, for session tracking)
 * @returns {Object} - Object with access and refresh tokens
 */
export async function createAuthSessionForUser(res, user, req = null) {
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
  let sessionId = null;

  // PHASE S2: Create session record first if request is provided (so we can include sessionId in JWT)
  if (req) {
    try {
      // Extract IP address with proper fallback chain
      const forwardedFor = req.headers['x-forwarded-for'];
      const ipFromForwarded = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
      const ipAddress = req.ip || ipFromForwarded || req.connection?.remoteAddress || req.socket?.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Generate device fingerprint from userAgent (simple hash for now)
      const deviceFingerprint = userAgent ? crypto.createHash('sha256').update(userAgent).digest('hex') : null;
      
      // Create session with new opaque token system
      const { sessionId: newSessionId, sessionToken } = await createSessionForUser(user.id, {
        ipAddress,
        userAgent,
        deviceFingerprint,
      });
      
      sessionId = newSessionId;
      
      // Add sessionId to JWT payload
      payload.sessionId = sessionId;
      
      // Set ogc_session cookie with the session token
      const isProd = process.env.NODE_ENV === 'production';
      if (res) {
        res.cookie('ogc_session', sessionToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'strict' : 'lax',
          maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        });
      }

      // Phase 8.4: Check if this is a new device or IP and send alert if needed
      try {
        const { isNew } = await isNewDeviceOrIpForUser({
          userId: user.id,
          ipAddress,
          userAgent,
        });

        if (isNew && user.email) {
          try {
            await sendNewLoginAlertEmail({
              to: user.email,
              loggedInAt: new Date(),
              ipAddress,
              userAgent,
            });
          } catch (emailErr) {
            // Do NOT fail login if email sending fails
            console.warn("[AuthSession] Failed to send new login alert:", emailErr);
          }
        }
      } catch (newDeviceCheckError) {
        // Do NOT fail login if new device check fails
        console.warn("[AuthSession] Error while computing new-device logic:", newDeviceCheckError);
      }

      // Phase 8.6: Log login success activity (if session was created successfully)
      // Note: The 'via' field in metadata should be set by the caller if needed
      // For now, we default to 'PASSWORD' but this will be overridden by recordLoginActivity
      // which is called by auth routes with proper metadata
      // We're not logging here to avoid double-logging, as recordLoginActivity handles it
    } catch (sessionError) {
      // Log but don't fail login if session creation fails
      console.error('[AuthSession] Failed to create session record:', sessionError);
    }
  }

  // Generate tokens (with sessionId in payload if available)
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


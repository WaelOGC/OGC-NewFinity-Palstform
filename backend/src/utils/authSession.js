import jwt from 'jsonwebtoken';
import pool from '../db.js';
import crypto from 'crypto';
import { createSessionForUser, isNewDeviceOrIpForUser } from '../services/sessionService.js';
import { sendNewLoginAlertEmail } from '../services/emailService.js';
import { logUserActivity } from '../services/activityService.js';
import env from '../config/env.js';
import { normalizeAccountStatus, ACCOUNT_STATUS, canUserLogin } from './accountStatus.js';
import { getUserSchema } from './userSchemaResolver.js';
import { writeAdminAuditLog } from './auditLogger.js';

// Helper to convert time string to milliseconds
function parseExpiresIn(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes
  const [, value, unit] = match;
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return parseInt(value) * (multipliers[unit] || 1000);
}

/**
 * Get standardized cookie options based on environment
 * Centralized configuration to ensure consistency across all cookie-setting code
 * 
 * Rules:
 * - Development: httpOnly=true, secure=false, sameSite='lax', domain=undefined
 * - Production: httpOnly=true, secure=true, sameSite='none' (cross-site) or 'lax' (same-site), domain from env
 * - If secure=true, sameSite cannot be 'lax' or 'strict' for cross-site; must be 'none'
 * - If sameSite='none', secure must be true (browser requirement)
 * - Never set domain like 'localhost' (invalid / breaks cookies)
 * 
 * @param {number} maxAge - Cookie max age in milliseconds
 * @returns {Object} Cookie options object
 */
export function getCookieOptions(maxAge) {
  const isProduction = env.NODE_ENV === 'production';
  
  // Base options
  const options = {
    httpOnly: true,
    path: '/',
    maxAge: maxAge,
  };
  
  // Development defaults
  if (!isProduction) {
    options.secure = false;
    options.sameSite = 'lax';
    // DO NOT set domain in dev (localhost is invalid)
    options.domain = undefined;
  } else {
    // Production defaults
    options.secure = true;
    
    // Determine sameSite based on whether frontend is on different domain
    // If COOKIE_SAMESITE is explicitly set, use it; otherwise default to 'none' for cross-site
    const sameSite = env.COOKIE_SAMESITE || 'none';
    
    // Enforce browser requirement: if sameSite='none', secure must be true
    if (sameSite === 'none' && !options.secure) {
      console.warn('[CookieConfig] sameSite="none" requires secure=true. Forcing secure=true.');
      options.secure = true;
    }
    
    // Enforce: if secure=true and cross-site, sameSite cannot be 'lax' or 'strict'
    if (options.secure && sameSite !== 'none' && env.COOKIE_DOMAIN) {
      console.warn('[CookieConfig] Cross-site cookies (domain set) with secure=true require sameSite="none". Using "none".');
      options.sameSite = 'none';
    } else {
      options.sameSite = sameSite;
    }
    
    // Only set domain if explicitly configured (and not localhost)
    if (env.COOKIE_DOMAIN && env.COOKIE_DOMAIN !== 'localhost' && !env.COOKIE_DOMAIN.includes('localhost')) {
      options.domain = env.COOKIE_DOMAIN;
    } else {
      options.domain = undefined;
    }
  }
  
  return options;
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
  // Validate JWT secrets before signing (should already be validated at startup, but double-check)
  if (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
    const error = new Error('JWT secrets not configured');
    error.statusCode = 500;
    throw error;
  }

  // Check account status (same validation as regular login) using normalized values
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

  // Only allow login if status is ACTIVE
  if (!canUserLogin(accountStatus)) {
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
      if (res) {
        res.cookie('ogc_session', sessionToken, getCookieOptions(1000 * 60 * 60 * 24 * 30)); // 30 days
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

      // Update lastLoginAt timestamp (schema-drift tolerant - won't crash if column missing)
      // Falls back to updatedAt if lastLogin column doesn't exist
      try {
        const schema = getUserSchema();
        const requestId = req?.requestId || 'n/a';
        
        if (!schema || !schema.table) {
          // Schema not initialized - fallback to updatedAt
          await pool.query(
            `UPDATE \`User\` SET \`updatedAt\` = NOW() WHERE id = ?`,
            [user.id]
          );
          console.log(`[AUTH] last login updated userId=${user.id} via=updatedAt requestId=${requestId}`);
        } else {
          const tableName = schema.table;
          const lastLoginColumn = schema.columns.lastLogin;
          
          if (lastLoginColumn) {
            // Update lastLogin column if found
            await pool.query(
              `UPDATE \`${tableName}\` SET \`${lastLoginColumn}\` = NOW() WHERE id = ?`,
              [user.id]
            );
            console.log(`[AUTH] last login updated userId=${user.id} via=${lastLoginColumn} requestId=${requestId}`);
          } else {
            // Fallback: update updatedAt if lastLogin column not found
            await pool.query(
              `UPDATE \`${tableName}\` SET \`updatedAt\` = NOW() WHERE id = ?`,
              [user.id]
            );
            console.log(`[AUTH] last login updated userId=${user.id} via=updatedAt requestId=${requestId}`);
          }
        }
      } catch (lastLoginError) {
        // Don't fail login if update fails
        // Log a safe error reason (no secrets/tokens/sql)
        const requestId = req?.requestId || 'n/a';
        let safeReason = 'unknown error';
        if (lastLoginError.code === 'ER_BAD_FIELD_ERROR' || lastLoginError.message?.includes('Unknown column')) {
          safeReason = 'column not found';
        } else if (lastLoginError.code) {
          safeReason = `db error ${lastLoginError.code}`;
        } else {
          safeReason = 'update failed';
        }
        console.log(`[AUTH] last login update skipped reason=${safeReason} requestId=${requestId}`);
        // Continue with login even if lastLoginAt update fails
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
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId: user.id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  // Set cookies if res is provided
  if (res) {
    res.cookie(env.JWT_COOKIE_ACCESS_NAME, accessToken, getCookieOptions(parseExpiresIn(env.JWT_ACCESS_EXPIRES_IN)));
    res.cookie(env.JWT_COOKIE_REFRESH_NAME, refreshToken, getCookieOptions(parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN)));
  }

  // Log admin login success (only for admin/founder users)
  if (req && user) {
    const userRole = (user.role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'FOUNDER' || userRole.includes('ADMIN') || userRole.includes('FOUNDER');
    
    if (isAdmin) {
      try {
        await writeAdminAuditLog({
          req,
          actorUserId: user.id,
          actorEmail: user.email,
          action: 'ADMIN_LOGIN_SUCCESS',
          status: 'SUCCESS',
          message: 'Admin user logged in successfully',
        });
      } catch (auditError) {
        // Silently fail - audit logging should not break login
      }
    }
  }

  return { access: accessToken, refresh: refreshToken };
}


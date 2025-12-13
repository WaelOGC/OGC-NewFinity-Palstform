import jwt from 'jsonwebtoken';
import { findValidSessionByToken, touchSession } from '../services/sessionService.js';
import env from '../config/env.js';
import { getCookieOptions } from '../utils/authSession.js';
import { fail } from '../utils/apiResponse.js';
import { AUTH_ERROR } from '../constants/authCodes.js';

export async function requireAuth(req, res, next) {
  try {
    // Try to get token from cookie first
    const cookieName = env.JWT_COOKIE_ACCESS_NAME;
    const tokenFromCookie = req.cookies && req.cookies[cookieName];

    // Fallback to Authorization header
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_NOT_AUTHENTICATED,
        message: 'Not authenticated.',
        data: {},
      }, 401);
    }

    // Verify JWT
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    
    // Support both 'userId' and 'sub' for backward compatibility
    const userId = decoded.userId || decoded.sub;
    
    // PHASE S2: Validate session from ogc_session cookie
    const sessionToken = req.cookies?.ogc_session || null;
    const session = await findValidSessionByToken(sessionToken);

    if (!session) {
      // Session revoked or expired – log out user
      // Clear cookies with same options used to set them
      const cookieOptions = getCookieOptions(0); // 0 = expired immediately
      
      res.clearCookie('ogc_session', cookieOptions);
      res.clearCookie(cookieName, cookieOptions);
      return fail(res, {
        code: AUTH_ERROR.AUTH_NOT_AUTHENTICATED,
        message: 'Not authenticated.',
        data: {},
      }, 401);
    }

    // Verify session belongs to the user from JWT
    if (session.userId !== userId) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_NOT_AUTHENTICATED,
        message: 'Not authenticated.',
        data: {},
      }, 401);
    }

    // Attach user and session to request
    req.user = { 
      id: userId, 
      role: decoded.role || 'STANDARD_USER' // Phase 5: Default to STANDARD_USER
    };
    req.session = { 
      id: session.id, 
      token: session.sessionToken 
    };

    // Update lastSeen (async, don't block request)
    touchSession(session.id).catch(err => {
      // Log but don't fail request if session update fails
      if (env.NODE_ENV !== 'production') {
        console.warn('[AuthSession] Failed to update session lastSeenAt (non-fatal):', err.message);
      }
    });

    return next();
  } catch (err) {
    // Clear cookies on any auth error with same options used to set them
    const cookieOptions = getCookieOptions(0); // 0 = expired immediately
    
    res.clearCookie('ogc_session', cookieOptions);
    res.clearCookie(env.JWT_COOKIE_ACCESS_NAME, cookieOptions);
    
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return fail(res, {
        code: err.name === 'TokenExpiredError' ? AUTH_ERROR.AUTH_TOKEN_EXPIRED : AUTH_ERROR.AUTH_TOKEN_INVALID,
        message: 'Not authenticated.',
        data: {},
      }, 401);
    }
    
    return fail(res, {
      code: AUTH_ERROR.AUTH_NOT_AUTHENTICATED,
      message: 'Not authenticated.',
      data: {},
    }, 401);
  }
}


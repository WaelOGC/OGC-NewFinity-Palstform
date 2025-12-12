import jwt from 'jsonwebtoken';
import { findValidSessionByToken, touchSession } from '../services/sessionService.js';

// Standardized JWT configuration
const {
  JWT_ACCESS_SECRET,
  JWT_COOKIE_ACCESS_NAME = 'ogc_access',
} = process.env;

export async function requireAuth(req, res, next) {
  try {
    // Try to get token from cookie first
    const cookieName = JWT_COOKIE_ACCESS_NAME;
    const tokenFromCookie = req.cookies && req.cookies[cookieName];

    // Fallback to Authorization header
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ 
        status: 'ERROR',
        message: 'Authentication required',
        code: 'UNAUTHENTICATED'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    
    // Support both 'userId' and 'sub' for backward compatibility
    const userId = decoded.userId || decoded.sub;
    
    // PHASE S2: Validate session from ogc_session cookie
    const sessionToken = req.cookies?.ogc_session || null;
    const session = await findValidSessionByToken(sessionToken);

    if (!session) {
      // Session revoked or expired – log out user
      res.clearCookie('ogc_session');
      res.clearCookie(cookieName);
      return res.status(401).json({
        status: 'ERROR',
        message: 'Session expired or revoked. Please log in again.',
        code: 'SESSION_INVALID',
      });
    }

    // Verify session belongs to the user from JWT
    if (session.userId !== userId) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Session mismatch.',
        code: 'SESSION_MISMATCH',
      });
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
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[AuthSession] Failed to update session lastSeenAt (non-fatal):', err.message);
      }
    });

    return next();
  } catch (err) {
    // Clear cookies on any auth error
    res.clearCookie('ogc_session');
    res.clearCookie(JWT_COOKIE_ACCESS_NAME);
    
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'ERROR',
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }
    
    return res.status(401).json({ 
      status: 'ERROR',
      message: 'Not authenticated.',
      code: 'UNAUTHENTICATED'
    });
  }
}


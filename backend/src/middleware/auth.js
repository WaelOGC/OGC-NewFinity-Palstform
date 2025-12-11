import jwt from 'jsonwebtoken';
import { updateSessionLastSeen } from '../services/sessionService.js';

// Standardized JWT configuration
const {
  JWT_ACCESS_SECRET,
  JWT_COOKIE_ACCESS_NAME = 'ogc_access',
} = process.env;

export function requireAuth(req, res, next) {
  try {
    // Try to get token from cookie first
    const cookieName = JWT_COOKIE_ACCESS_NAME;
    const tokenFromCookie = req.cookies && req.cookies[cookieName];

    // Fallback to Authorization header
    const authHeader = req.headers.authorization || '';
    const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    
    // Support both 'userId' and 'sub' for backward compatibility
    const userId = decoded.userId || decoded.sub;
    req.user = { 
      id: userId, 
      role: decoded.role || 'STANDARD_USER' // Phase 5: Default to STANDARD_USER
    };

    // Phase 7.1: Update session lastSeenAt (async, don't block request)
    updateSessionLastSeen(token).catch(err => {
      // Log but don't fail request if session update fails
      console.error('Failed to update session lastSeenAt:', err);
    });

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


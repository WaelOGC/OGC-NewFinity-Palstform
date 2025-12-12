// backend/src/controllers/securitySessions.controller.js

import { getSessionsForUser, revokeSession, revokeOtherSessions } from '../services/sessionService.js';

/**
 * Derive a human-readable device label from user agent
 * @param {string} userAgent - User agent string
 * @returns {string} Device label (e.g., "Windows • Chrome")
 */
function deriveDeviceLabel(userAgent) {
  if (!userAgent) return 'Unknown device';

  const ua = userAgent.toLowerCase();
  const isWindows = ua.includes('windows');
  const isMac = ua.includes('macintosh') || ua.includes('mac os');
  const isLinux = ua.includes('linux') && !ua.includes('android');
  const isAndroid = ua.includes('android');
  const isIOS = ua.includes('iphone') || ua.includes('ipad');

  let os = 'Other OS';
  if (isWindows) os = 'Windows';
  else if (isMac) os = 'macOS';
  else if (isLinux) os = 'Linux';
  else if (isAndroid) os = 'Android';
  else if (isIOS) os = 'iOS';

  let browser = 'Browser';
  if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('brave')) browser = 'Chrome';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';

  return `${os} • ${browser}`;
}

/**
 * GET /api/v1/security/sessions
 * Get all active sessions for the current user
 */
export async function getActiveSessions(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const currentSessionId = req.session && req.session.id;

    if (!userId) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Not authenticated.',
        code: 'UNAUTHENTICATED',
      });
    }

    const rawSessions = await getSessionsForUser(userId, currentSessionId);

    const sessions = rawSessions.map((s) => ({
      id: s.id,
      deviceLabel: deriveDeviceLabel(s.userAgent),
      ipAddress: s.ipAddress || 'Unknown IP',
      userAgent: s.userAgent || 'Unknown',
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      expiresAt: s.expiresAt,
      isCurrent: s.isCurrent,
      isRevoked: s.isRevoked,
      isExpired: s.isExpired,
    }));

    return res.status(200).json({
      status: 'OK',
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/security/sessions/:sessionId
 * Revoke a specific session
 */
export async function deleteSession(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const currentSessionId = req.session && req.session.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Not authenticated.',
        code: 'UNAUTHENTICATED',
      });
    }

    if (Number(sessionId) === Number(currentSessionId)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'You cannot revoke the current session from here.',
        code: 'CANNOT_REVOKE_CURRENT',
      });
    }

    await revokeSession(userId, sessionId);

    return res.status(200).json({
      status: 'OK',
      message: 'Session revoked.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/security/sessions/others
 * Revoke all other sessions (except current)
 */
export async function deleteOtherSessions(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const currentSessionId = req.session && req.session.id;

    if (!userId) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Not authenticated.',
        code: 'UNAUTHENTICATED',
      });
    }

    if (!currentSessionId) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Current session not found.',
        code: 'NO_CURRENT_SESSION',
      });
    }

    await revokeOtherSessions(userId, currentSessionId);

    return res.status(200).json({
      status: 'OK',
      message: 'Signed out from other devices.',
    });
  } catch (err) {
    next(err);
  }
}

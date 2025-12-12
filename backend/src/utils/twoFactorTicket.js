import jwt from 'jsonwebtoken';

const TWO_FACTOR_TICKET_TTL_SECONDS = 10 * 60; // 10 minutes

/**
 * Create a short-lived JWT ticket for 2FA verification during login
 * @param {number} userId - User ID
 * @returns {string} JWT ticket token
 */
export function createTwoFactorTicket(userId) {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    const err = new Error('JWT secret not configured');
    err.code = 'JWT_SECRET_MISSING';
    throw err;
  }

  return jwt.sign(
    {
      kind: '2FA_TICKET',
      userId,
    },
    secret,
    { expiresIn: TWO_FACTOR_TICKET_TTL_SECONDS }
  );
}

/**
 * Verify and decode a 2FA ticket
 * @param {string} token - JWT ticket token
 * @returns {Object} Decoded ticket with userId
 * @throws {Error} If ticket is invalid or expired
 */
export function verifyTwoFactorTicket(token) {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    const err = new Error('JWT secret not configured');
    err.code = 'JWT_SECRET_MISSING';
    throw err;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (jwtError) {
    const err = new Error('Invalid or expired 2FA ticket');
    err.code = 'INVALID_2FA_TICKET';
    err.statusCode = 401;
    throw err;
  }

  if (!decoded || decoded.kind !== '2FA_TICKET' || !decoded.userId) {
    const err = new Error('Invalid 2FA ticket');
    err.code = 'INVALID_2FA_TICKET';
    err.statusCode = 401;
    throw err;
  }

  return decoded;
}

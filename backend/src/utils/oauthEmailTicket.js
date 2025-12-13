/**
 * OAuth Email Ticket Utility
 * 
 * Creates short-lived JWT tickets for OAuth flows where email is missing.
 * These tickets allow users to complete OAuth authentication by providing
 * their email address after the OAuth provider callback.
 * 
 * Ticket TTL: 10 minutes
 * Payload: { provider, providerUserId, displayName, avatarUrl }
 */

import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Get the secret for signing OAuth email tickets
 * Uses OAUTH_EMAIL_TICKET_SECRET if set, otherwise falls back to JWT_ACCESS_SECRET (dev only)
 * @returns {string} Secret key
 */
function getTicketSecret() {
  const secret = process.env.OAUTH_EMAIL_TICKET_SECRET || env.JWT_ACCESS_SECRET;
  
  if (!process.env.OAUTH_EMAIL_TICKET_SECRET && env.NODE_ENV !== 'production') {
    console.warn('[OAuth Email Ticket] WARNING: OAUTH_EMAIL_TICKET_SECRET not set. Using JWT_ACCESS_SECRET as fallback (dev only).');
  }
  
  if (!secret) {
    throw new Error('OAuth email ticket secret is missing. Set OAUTH_EMAIL_TICKET_SECRET or JWT_ACCESS_SECRET in environment variables.');
  }
  
  return secret;
}

/**
 * Create an OAuth email ticket
 * @param {Object} payload - Ticket payload
 * @param {string} payload.provider - Provider name (google, github, discord, twitter, linkedin)
 * @param {string} payload.providerUserId - Provider-specific user ID
 * @param {string|null} [payload.displayName] - Display name from provider
 * @param {string|null} [payload.avatarUrl] - Avatar URL from provider
 * @returns {string} JWT ticket token
 */
export function createOAuthEmailTicket(payload) {
  const { provider, providerUserId, displayName = null, avatarUrl = null } = payload;
  
  if (!provider || !providerUserId) {
    throw new Error('Provider and providerUserId are required for OAuth email ticket');
  }
  
  const secret = getTicketSecret();
  
  const ticketPayload = {
    provider: provider.toLowerCase(),
    providerUserId,
    displayName,
    avatarUrl,
    type: 'oauth_email_ticket',
  };
  
  // Ticket expires in 10 minutes
  const token = jwt.sign(ticketPayload, secret, { expiresIn: '10m' });
  
  return token;
}

/**
 * Verify and decode an OAuth email ticket
 * @param {string} token - JWT ticket token
 * @returns {Object} Decoded ticket payload
 * @throws {Error} If ticket is invalid or expired
 */
export function verifyOAuthEmailTicket(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid ticket token');
  }
  
  const secret = getTicketSecret();
  
  try {
    const decoded = jwt.verify(token, secret);
    
    // Verify ticket type
    if (decoded.type !== 'oauth_email_ticket') {
      throw new Error('Invalid ticket type');
    }
    
    // Verify required fields
    if (!decoded.provider || !decoded.providerUserId) {
      throw new Error('Invalid ticket payload: missing provider or providerUserId');
    }
    
    return {
      provider: decoded.provider,
      providerUserId: decoded.providerUserId,
      displayName: decoded.displayName || null,
      avatarUrl: decoded.avatarUrl || null,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('OAuth email ticket has expired');
      expiredError.code = 'OAUTH_TICKET_EXPIRED';
      expiredError.statusCode = 401;
      throw expiredError;
    }
    if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid OAuth email ticket');
      invalidError.code = 'OAUTH_TICKET_INVALID';
      invalidError.statusCode = 401;
      throw invalidError;
    }
    // Re-throw other errors
    throw error;
  }
}

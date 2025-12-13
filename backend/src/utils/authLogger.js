/**
 * Structured Authentication Logger
 * 
 * Provides consistent, secure logging for authentication events.
 * Automatically redacts sensitive fields (passwords, tokens, secrets).
 * 
 * Usage:
 *   import { authLog } from '../utils/authLogger.js';
 *   authLog('LOGIN_SUCCESS', { userId: 123, email: 'user@example.com' });
 */

/**
 * Fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'JWT_',
  'SMTP_PASS',
  'secret',
  'refreshToken',
  'accessToken',
  'activationToken',
  'resetToken',
];

/**
 * Recursively redact sensitive fields from an object
 * @param {any} obj - Object to redact
 * @param {number} depth - Current recursion depth (prevents infinite loops)
 * @returns {any} - Redacted object
 */
function redactSensitiveFields(obj, depth = 0) {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveFields(item, depth + 1));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    
    // Check if this key should be redacted
    const shouldRedact = SENSITIVE_FIELDS.some(field => 
      keyLower.includes(field.toLowerCase())
    );

    if (shouldRedact) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveFields(value, depth + 1);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Log an authentication event with structured metadata
 * 
 * @param {string} event - Event name (e.g., 'LOGIN_SUCCESS', 'LOGIN_FAILED')
 * @param {Object} meta - Metadata object (will be redacted automatically)
 */
export function authLog(event, meta = {}) {
  const redactedMeta = redactSensitiveFields(meta);
  const timestamp = new Date().toISOString();
  
  // Format: [AUTH] <timestamp> <event> <meta-json>
  console.log(`[AUTH] ${timestamp} ${event}`, JSON.stringify(redactedMeta));
}

/**
 * Event names for common auth flows
 */
export const AUTH_EVENTS = {
  // Login
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // Registration
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILED: 'REGISTER_FAILED',
  
  // Activation
  ACTIVATION_SUCCESS: 'ACTIVATION_SUCCESS',
  ACTIVATION_FAILED: 'ACTIVATION_FAILED',
  
  // Password reset
  FORGOT_PASSWORD_SENT: 'FORGOT_PASSWORD_SENT',
  FORGOT_PASSWORD_FAILED: 'FORGOT_PASSWORD_FAILED',
  RESET_PASSWORD_SUCCESS: 'RESET_PASSWORD_SUCCESS',
  RESET_PASSWORD_FAILED: 'RESET_PASSWORD_FAILED',
  
  // OAuth
  OAUTH_SUCCESS: 'OAUTH_SUCCESS',
  OAUTH_NEEDS_EMAIL: 'OAUTH_NEEDS_EMAIL',
  OAUTH_FAILED: 'OAUTH_FAILED',
  
  // 2FA
  AUTH_2FA_REQUIRED: 'AUTH_2FA_REQUIRED',
  AUTH_2FA_SUCCESS: 'AUTH_2FA_SUCCESS',
  AUTH_2FA_FAILED: 'AUTH_2FA_FAILED',
  
  // Session
  SESSION_REFRESH: 'SESSION_REFRESH',
  LOGOUT: 'LOGOUT',
};

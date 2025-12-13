// backend/src/middleware/rateLimit.js

/**
 * Simple in-memory rate limiter for admin endpoints
 * Uses sliding window approach
 */

import { fail } from '../utils/apiResponse.js';

// In-memory store: { key: [timestamps...] }
const requestStore = new Map();

// Configuration
const DEFAULT_MAX_REQUESTS = parseInt(process.env.ADMIN_AUDIT_RATE_LIMIT_MAX || '60', 10);
const DEFAULT_WINDOW_MS = parseInt(process.env.ADMIN_AUDIT_RATE_LIMIT_WINDOW_MS || '60000', 10);

// Cleanup expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  const cutoff = now - DEFAULT_WINDOW_MS;
  
  for (const [key, timestamps] of requestStore.entries()) {
    // Filter out old timestamps
    const recent = timestamps.filter(ts => ts > cutoff);
    if (recent.length === 0) {
      requestStore.delete(key);
    } else {
      requestStore.set(key, recent);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Create rate limiter middleware for audit logs endpoint
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window
 * @param {number} [options.windowMs] - Window size in milliseconds
 * @returns {Function} Express middleware
 */
export function createAuditLogsRateLimiter({ 
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (user id if authenticated, otherwise IP)
    const userId = req.user?.id || req.currentUser?.id;
    const userEmail = req.user?.email || req.currentUser?.email;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key
    const key = userId ? `user:${userId}` : `ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

/**
 * Create rate limiter middleware for bulk user status endpoint
 * Max 5 requests per minute per admin
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window (default: 5)
 * @param {number} [options.windowMs] - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Express middleware
 */
export function createBulkStatusRateLimiter({ 
  maxRequests = 5,
  windowMs = 60000 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (user id if authenticated, otherwise IP)
    const userId = req.user?.id || req.currentUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key
    const key = userId ? `bulk-status:user:${userId}` : `bulk-status:ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many bulk status requests. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

/**
 * Create rate limiter middleware for audit logs CSV export endpoint
 * Max 3 exports per minute per admin user
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window (default: 3)
 * @param {number} [options.windowMs] - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Express middleware
 */
export function createAuditExportRateLimiter({ 
  maxRequests = 3,
  windowMs = 60000 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (must be authenticated admin - req.currentUser or req.user should exist)
    const userId = req.user?.id || req.currentUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key - prefer user ID for admin users
    const key = userId ? `audit-export:user:${userId}` : `audit-export:ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many export requests. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

/**
 * Create rate limiter middleware for admin settings write endpoint
 * Max 20 changes per minute per admin user
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window (default: 20)
 * @param {number} [options.windowMs] - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Express middleware
 */
export function createAdminSettingsWriteRateLimiter({ 
  maxRequests = 20,
  windowMs = 60000 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (must be authenticated admin - req.currentUser or req.user should exist)
    const userId = req.user?.id || req.currentUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key - prefer user ID for admin users
    const key = userId ? `admin-settings-write:user:${userId}` : `admin-settings-write:ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many settings changes. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

/**
 * Create rate limiter middleware for system health endpoint
 * Max 60 requests per minute per admin user
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window (default: 60)
 * @param {number} [options.windowMs] - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Express middleware
 */
export function createSystemHealthRateLimiter({ 
  maxRequests = 60,
  windowMs = 60000 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (must be authenticated admin - req.currentUser or req.user should exist)
    const userId = req.user?.id || req.currentUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key - prefer user ID for admin users
    const key = userId ? `system-health:user:${userId}` : `system-health:ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many health check requests. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

/**
 * Create rate limiter middleware for system jobs read endpoints (list, get)
 * Max 120 requests per minute per admin user
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window (default: 120)
 * @param {number} [options.windowMs] - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Express middleware
 */
export function createSystemJobsReadRateLimiter({ 
  maxRequests = 120,
  windowMs = 60000 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (must be authenticated admin - req.currentUser or req.user should exist)
    const userId = req.user?.id || req.currentUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key - prefer user ID for admin users
    const key = userId ? `system-jobs-read:user:${userId}` : `system-jobs-read:ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many job requests. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

/**
 * Create rate limiter middleware for system jobs write endpoints (retry, cancel)
 * Max 20 requests per minute per admin user
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window (default: 20)
 * @param {number} [options.windowMs] - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Express middleware
 */
export function createSystemJobsWriteRateLimiter({ 
  maxRequests = 20,
  windowMs = 60000 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (must be authenticated admin - req.currentUser or req.user should exist)
    const userId = req.user?.id || req.currentUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key - prefer user ID for admin users
    const key = userId ? `system-jobs-write:user:${userId}` : `system-jobs-write:ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many job action requests. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

/**
 * Create rate limiter middleware for admin sessions read endpoints (list)
 * Max 120 requests per minute per admin user
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window (default: 120)
 * @param {number} [options.windowMs] - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Express middleware
 */
export function createAdminSessionsReadRateLimiter({ 
  maxRequests = 120,
  windowMs = 60000 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (must be authenticated admin - req.currentUser or req.user should exist)
    const userId = req.user?.id || req.currentUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key - prefer user ID for admin users
    const key = userId ? `admin-sessions-read:user:${userId}` : `admin-sessions-read:ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many session requests. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

/**
 * Create rate limiter middleware for admin sessions write endpoints (revoke)
 * Max 20 requests per minute per admin user
 * @param {Object} options - Rate limit options
 * @param {number} [options.maxRequests] - Maximum requests per window (default: 20)
 * @param {number} [options.windowMs] - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Express middleware
 */
export function createAdminSessionsWriteRateLimiter({ 
  maxRequests = 20,
  windowMs = 60000 
} = {}) {
  return (req, res, next) => {
    // Get user identifier (must be authenticated admin - req.currentUser or req.user should exist)
    const userId = req.user?.id || req.currentUser?.id;
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
    
    // Create rate limit key - prefer user ID for admin users
    const key = userId ? `admin-sessions-write:user:${userId}` : `admin-sessions-write:ip:${ip}`;
    
    const now = Date.now();
    const cutoff = now - windowMs;
    
    // Get existing timestamps for this key
    let timestamps = requestStore.get(key) || [];
    
    // Filter out old timestamps (outside window)
    timestamps = timestamps.filter(ts => ts > cutoff);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      // Calculate retry after (time until oldest request expires)
      const oldestTimestamp = Math.min(...timestamps);
      const retryAfterMs = windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      
      // Set Retry-After header
      res.setHeader('Retry-After', retryAfterSeconds);
      
      return fail(res, {
        code: 'RATE_LIMITED',
        message: 'Too many session action requests. Please try again later.',
        details: {
          retryAfterMs,
          maxRequests,
          windowMs,
        },
      }, 429);
    }
    
    // Add current timestamp
    timestamps.push(now);
    requestStore.set(key, timestamps);
    
    // Continue
    next();
  };
}

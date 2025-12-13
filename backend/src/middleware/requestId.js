// backend/src/middleware/requestId.js

/**
 * Request ID Middleware
 * 
 * Attaches a correlation/request ID to requests for observability.
 * - If x-request-id header exists, reuse it
 * - Otherwise, generate a UUID
 * - Attach to req.requestId
 * - Add response header x-request-id with the same value
 */

import { randomUUID } from 'crypto';

/**
 * Middleware to attach request ID to request and response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requestId(req, res, next) {
  // Get request ID from header or generate new one
  const requestId = req.headers['x-request-id'] || randomUUID();
  
  // Attach to request object for use in controllers/services
  req.requestId = requestId;
  
  // Add response header so clients can trace the request
  res.setHeader('x-request-id', requestId);
  
  next();
}

// backend/src/utils/apiResponse.js

/**
 * Standard success response helper
 * Usage: 
 *   return sendOk(res, { profile }, 200)
 *   return sendOk(res, { profile }, 200, 'SUCCESS_CODE', 'Success message')
 */
export function sendOk(res, data = {}, statusCode = 200, code = null, message = null) {
  const response = {
    status: "OK",
    data,
  };
  
  // Add code and message if provided (for consistency with error responses)
  if (code) {
    response.code = code;
  }
  if (message) {
    response.message = message;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Standard error response helper
 * Usage:
 *   return sendError(res, {
 *     code: "INVALID_2FA_CODE",
 *     message: "The verification code you entered is not valid.",
 *     statusCode: 400,
 *     data: { ... }  // Optional data field (defaults to {})
 *   });
 * 
 * Note: For auth endpoints, prefer using fail() which enforces the envelope.
 */
export function sendError(
  res,
  {
    code = "INTERNAL_ERROR",
    message = "The server encountered an error. Please try again later.",
    statusCode = 500,
    data = {},
  } = {}
) {
  const response = {
    status: "ERROR",
    code,
    message,
    data: data || {},
  };
  
  res.status(statusCode).json(response);
}

/**
 * Standardized success response (enforces consistent envelope)
 * Usage: ok(res, { code: 'AUTH_ME_OK', message: 'Authenticated.', data: {...} }, 200)
 * 
 * Rules:
 * - status must be "OK"
 * - code is required
 * - message is required
 * - data is always included (defaults to {} if not provided)
 */
export function ok(res, { code, message, data = {} }, statusCode = 200) {
  const response = {
    status: "OK",
    code: code || "SUCCESS",
    message: message || "Success",
    data: data || {},
  };
  
  res.status(statusCode).json(response);
}

/**
 * Standardized error response (enforces consistent envelope)
 * Usage: fail(res, { code: 'AUTH_NOT_AUTHENTICATED', message: 'Not authenticated.', data: {...} }, 401)
 * 
 * Rules:
 * - status must be "ERROR"
 * - code is required
 * - message is required
 * - data is always included (defaults to {} if not provided)
 */
export function fail(res, { code, message, data = {} }, statusCode = 400) {
  const response = {
    status: "ERROR",
    code: code || "INTERNAL_ERROR",
    message: message || "An error occurred",
    data: data || {},
  };
  
  res.status(statusCode).json(response);
}

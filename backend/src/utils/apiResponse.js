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
 *   });
 */
export function sendError(
  res,
  {
    code = "INTERNAL_ERROR",
    message = "The server encountered an error. Please try again later.",
    statusCode = 500,
  } = {}
) {
  res.status(statusCode).json({
    status: "ERROR",
    code,
    message,
  });
}

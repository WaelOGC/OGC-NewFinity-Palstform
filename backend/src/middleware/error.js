import { sendError } from "../utils/apiResponse.js";

export function errorHandler(err, req, res, next) {
  // Ensure we always return JSON, never HTML
  if (err?.name === 'ZodError') {
    return res.status(400).json({ 
      status: 'ERROR',
      message: 'Invalid request data',
      code: 'VALIDATION_ERROR',
      details: err.errors 
    });
  }
  
  // Log the full error for debugging (always log in development)
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('Error handler caught:', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode || err.status,
    sqlState: err.sqlState,
    sqlMessage: err.sqlMessage,
    stack: isDev ? err.stack : undefined
  });
  
  // Handle MySQL/database errors specifically
  if (err.code && err.code.startsWith('ER_')) {
    // Log detailed error for debugging
    console.error('[ErrorHandler] Database error:', {
      code: err.code,
      message: err.message,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      stack: isDev ? err.stack : undefined
    });

    // Common MySQL errors that indicate missing columns/tables
    if (err.code === 'ER_BAD_FIELD_ERROR' || err.message.includes('Unknown column')) {
      return sendError(res, {
        code: 'DATABASE_SCHEMA_ERROR',
        message: 'Database error occurred. Please try again later.',
        statusCode: 500,
      });
    }
    
    // Generic database error
    return sendError(res, {
      code: 'DATABASE_ERROR',
      message: 'Database error occurred. Please try again later.',
      statusCode: 500,
    });
  }
  
  // Use status code from error if available, otherwise default to 500
  const statusCode = err.statusCode || err.status || 500;
  
  // In development, include error message; in production, use generic message
  const message = isDev ? err.message : 'The server encountered an error. Please try again later.';
  
  // Always return JSON with consistent format: { status: "ERROR", code, message }
  return sendError(res, {
    code: err.code || 'INTERNAL_ERROR',
    message: message,
    statusCode: statusCode,
  });
}


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
    stack: isDev ? err.stack : undefined
  });
  
  // Use status code from error if available, otherwise default to 500
  const statusCode = err.statusCode || err.status || 500;
  
  // In development, include error message; in production, use generic message
  const message = isDev ? err.message : 'Internal server error';
  
  // Always return JSON with consistent format
  res.status(statusCode).json({ 
    status: 'ERROR',
    message: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && { details: err.message })
  });
}


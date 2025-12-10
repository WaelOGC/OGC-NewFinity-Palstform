export function errorHandler(err, req, res, next) {
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'Invalid request', details: err.errors });
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
  
  res.status(statusCode).json({ 
    error: message,
    ...(isDev && { details: err.message, code: err.code })
  });
}


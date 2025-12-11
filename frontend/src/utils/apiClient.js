/**
 * Centralized API client with error handling and logging
 * Provides consistent error handling across all API calls
 * 
 * In development:
 * - Uses Vite proxy (/api/v1) which forwards to http://localhost:4000/api/v1
 * - This avoids CORS issues and works seamlessly with Vite dev server
 * 
 * In production:
 * - Uses VITE_API_BASE_URL env var or defaults to /api/v1
 */

// Base URL configuration
const DEV_BASE = '/api/v1';
const PROD_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const API_BASE_URL = import.meta.env.DEV ? DEV_BASE : PROD_BASE;

const isDev = import.meta.env.DEV;

/**
 * Whitelist of allowed API routes
 * Routes must be in the format: 'METHOD /api/v1/path'
 */
const ALLOWED_ROUTES = {
  'POST /api/v1/auth/login': true,
  'POST /api/v1/auth/register': true,
  'POST /api/v1/auth/refresh': true,
  'POST /api/v1/auth/logout': true,
  'GET /api/v1/auth/me': true,
  'GET /api/v1/auth/activate': true,
  'POST /api/v1/auth/resend-activation': true,
  'POST /api/v1/auth/forgot-password': true,
  'POST /api/v1/auth/reset-password/validate': true,
  'POST /api/v1/auth/reset-password': true,
  // Account System Expansion (Phase 1) - User Profile Routes
  'GET /api/v1/user/profile': true,
  'PUT /api/v1/user/profile': true,
  'PUT /api/v1/user/change-password': true,
  // Account System Expansion (Phase 2) - Security Routes
  'GET /api/v1/user/security/activity': true,
  'GET /api/v1/user/security/devices': true,
  // DELETE /api/v1/user/security/devices/:deviceId is handled by pattern matching
  'GET /api/v1/user/security/2fa/status': true,
  'POST /api/v1/user/security/2fa/setup': true,
  'POST /api/v1/user/security/2fa/disable': true,
  // Phase 7.1: Active Sessions & Device Security
  // Note: Sessions routes are under /user/security/ in userRoutes.js
  'GET /api/v1/user/security/sessions': true,
  'POST /api/v1/user/security/sessions/revoke': true,
  'POST /api/v1/user/security/sessions/revoke-all-others': true,
  // Phase 3: 2FA verification for login flow
  'POST /api/v1/auth/2fa/verify': true,
  // Phase 5: Role, permissions, and feature flags
  'GET /api/v1/user/role': true,
  'GET /api/v1/user/features': true,
  // Phase 6: Admin Console routes
  'GET /api/v1/admin/users': true,
  'GET /api/v1/admin/users/:userId': true,
  'PUT /api/v1/admin/users/:userId/role': true,
  'PUT /api/v1/admin/users/:userId/status': true,
  'PUT /api/v1/admin/users/:userId/feature-flags': true,
  'GET /api/v1/admin/users/:userId/activity': true,
  'GET /api/v1/admin/users/:userId/devices': true,
  // Phase 7.1: Admin Session Management
  'GET /api/v1/admin/users/:userId/sessions': true,
  'POST /api/v1/admin/users/:userId/sessions/revoke': true,
  'POST /api/v1/admin/users/:userId/sessions/revoke-all': true,
};

/**
 * Log API call details in development
 */
function logApiCall(method, url, data = null) {
  if (isDev) {
    console.log(`[API] ${method} ${url}`, data ? { body: data } : '');
  }
}

/**
 * Log API response in development
 */
function logApiResponse(method, url, status, data = null) {
  if (isDev) {
    console.log(`[API] ${method} ${url} → ${status}`, data ? { response: data } : '');
  }
}

/**
 * Log API error in development
 */
function logApiError(method, url, error) {
  if (isDev) {
    console.error(`[API] ${method} ${url} → ERROR:`, error);
  }
}

/**
 * Map known error codes to user-friendly messages
 */
function getFriendlyErrorMessage(error) {
  // Use backend message if available (highest priority)
  if (error.backendMessage) {
    return error.backendMessage;
  }

  // Map known error codes to friendly messages
  const codeMessages = {
    'EMAIL_ALREADY_EXISTS': 'Email already in use. Please use a different email or try logging in.',
    'ACCOUNT_NOT_VERIFIED': 'Account not activated. Please check your email for the activation link.',
    'INVALID_CREDENTIALS': 'Invalid email or password. Please check your credentials and try again.',
    'TERMS_NOT_ACCEPTED': 'You must accept the Terms & Conditions to register.',
    'VALIDATION_ERROR': 'Invalid input. Please check your information and try again.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
    'NETWORK_ERROR': 'Unable to reach the server. Please check that the backend is running.',
    'PARSE_ERROR': 'Invalid response from server. Please try again.',
    'USER_NOT_FOUND': 'User not found.',
    'ACCOUNT_DISABLED': 'This account has been disabled. Please contact support.',
    'ACCOUNT_STATUS_INVALID': 'Account status is invalid. Please contact support.',
  };

  if (error.backendCode && codeMessages[error.backendCode]) {
    return codeMessages[error.backendCode];
  }

  if (error.code && codeMessages[error.code]) {
    return codeMessages[error.code];
  }

  // Fall back to error message or generic
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Make an API request with comprehensive error handling
 */
export async function apiRequest(endpoint, options = {}) {
  const method = options.method || 'GET';
  
  // Ensure endpoint starts with '/' for proper concatenation
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  
  // Check if route is in whitelist
  const routeKey = `${method} ${url}`;
  
  // Check exact match first
  if (ALLOWED_ROUTES[routeKey]) {
    // Route is allowed
  } else {
    // Check for dynamic routes (e.g., DELETE /api/v1/user/security/devices/:deviceId)
    // Also check for admin routes with userId parameter
    const isDynamicRoute = Object.keys(ALLOWED_ROUTES).some(allowedRoute => {
      // For DELETE routes with deviceId, check if it matches the pattern
      if (method === 'DELETE' && url.includes('/user/security/devices/')) {
        return allowedRoute.includes('/user/security/devices');
      }
      // For admin routes with userId, check if it matches the pattern
      if (url.includes('/admin/users/') && !url.endsWith('/admin/users')) {
        return allowedRoute.includes('/admin/users/');
      }
      // For session routes, check if it matches the pattern
      if (url.includes('/user/security/sessions')) {
        return allowedRoute.includes('/user/security/sessions');
      }
      return false;
    });
    
    if (!isDynamicRoute) {
      const error = new Error(`API route not found: ${method} ${url}`);
      error.statusCode = 404;
      error.status = 404;
      error.backendMessage = `API route not found: ${method} ${url}`;
      error.backendCode = 'NOT_FOUND';
      throw error;
    }
  }
  
  // Log the final URL in development
  if (isDev) {
    console.log('[apiClient] URL:', url);
  }
  
  const fetchOptions = {
    ...options,
    credentials: 'include', // Always include credentials for cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  logApiCall(method, url, options.body);

  try {
    const res = await fetch(url, fetchOptions);

    // Try to parse JSON response
    let data;
    let rawText = '';
    try {
      rawText = await res.text();
      if (!rawText) {
        throw new Error('Empty response from server');
      }
      data = JSON.parse(rawText);
    } catch (parseError) {
      // Log detailed error information in development
      if (isDev) {
        console.error(`[API] ${method} ${url} → Parse Error:`, {
          status: res.status,
          statusText: res.statusText,
          rawBody: rawText,
          parseError: parseError.message
        });
      }
      
      // If we couldn't parse JSON, create error with raw text
      const error = new Error(rawText || 'Invalid response from server. Please try again.');
      error.statusCode = res.status;
      error.status = res.status;
      error.backendMessage = rawText || 'Server returned non-JSON response';
      error.backendCode = 'PARSE_ERROR';
      error.rawResponse = rawText;
      throw error;
    }

    logApiResponse(method, url, res.status, data);

    // If response is not OK, extract error details and throw
    if (!res.ok) {
      // Log detailed error in development
      if (isDev) {
        console.error(`[API] ${method} ${url} → Error Response:`, {
          status: res.status,
          statusText: res.statusText,
          body: data
        });
      }

      // Handle 401 (Unauthorized) - redirect to login
      if (res.status === 401) {
        // Clear any stored auth data
        window.localStorage.removeItem('ogc_token');
        // Only redirect if we're not already on auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        }
      }

      // Handle 403 (Forbidden) - redirect to dashboard
      if (res.status === 403) {
        // Only redirect if we're not already on dashboard or auth pages
        if (!window.location.pathname.startsWith('/dashboard') && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/dashboard';
        }
      }

      // Extract error message with priority: message > error > code
      const backendMessage = data.message || data.error || (data.code ? `Error: ${data.code}` : null);
      const backendCode = data.code || data.errorCode || null;
      
      const error = new Error(backendMessage || `HTTP ${res.status}`);
      error.statusCode = res.status;
      error.status = res.status;
      error.backendMessage = backendMessage;
      error.backendCode = backendCode;
      error.code = backendCode; // Keep for backward compatibility
      error.data = data;
      throw error;
    }

    // Success response - check if it matches expected format
    // Backend sends { status: 'OK', success: true, ... } for success
    // Also accept responses with just success: true or status: 'OK'
    if (data.status === 'OK' || data.success === true || res.status >= 200 && res.status < 300) {
      return data;
    }

    // If response is OK but doesn't match expected format, log warning but return data
    if (isDev) {
      console.warn(`[API] ${method} ${url} → Unexpected success format:`, data);
    }
    return data;
  } catch (error) {
    // Network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      const networkError = new Error('Unable to reach the server. Please check that the backend is running on localhost:4000 or try again in a moment.');
      networkError.statusCode = 0;
      networkError.status = 0;
      networkError.backendMessage = 'Network error: Unable to connect to server';
      networkError.backendCode = 'NETWORK_ERROR';
      networkError.originalError = error;
      logApiError(method, url, networkError);
      throw networkError;
    }

    // If error already has backendMessage/backendCode, preserve it
    if (error.backendMessage || error.backendCode) {
      logApiError(method, url, error);
      throw error;
    }

    // Try to extract message from error.data if available
    if (error.data) {
      const backendMessage = error.data.message || error.data.error || null;
      const backendCode = error.data.code || error.data.errorCode || null;
      
      if (backendMessage) {
        error.backendMessage = backendMessage;
      }
      if (backendCode) {
        error.backendCode = backendCode;
        error.code = backendCode;
      }
    }

    // If we still don't have a backend message, use the error message or generic fallback
    if (!error.backendMessage) {
      error.backendMessage = error.message || 'An unexpected error occurred. Please try again.';
    }

    logApiError(method, url, error);
    throw error;
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export { API_BASE_URL };


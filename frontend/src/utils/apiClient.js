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
 * AppError - Rich error object for API errors
 * Provides structured error information with user-friendly messages
 */
class AppError extends Error {
  constructor({ message, code, httpStatus, raw }) {
    super(message || "Request failed");
    this.name = "AppError";
    this.code = code || "REQUEST_FAILED";
    this.httpStatus = httpStatus || 0;
    this.raw = raw || null;
    // For backward compatibility
    this.backendCode = code;
    this.backendMessage = message;
    this.statusCode = httpStatus;
    this.status = httpStatus;
  }
}

/**
 * Whitelist of allowed API routes
 * Routes must be in the format: 'METHOD /api/v1/path'
 */
const ALLOWED_ROUTES = {
  'POST /api/v1/auth/login': true,
  'POST /api/v1/auth/login/2fa': true,
  'POST /api/v1/auth/register': true,
  'POST /api/v1/auth/refresh': true,
  'POST /api/v1/auth/logout': true,
  'GET /api/v1/auth/me': true,
  'GET /api/v1/auth/session': true,
  'POST /api/v1/auth/activate': true,
  'POST /api/v1/auth/resend-activation': true,
  'POST /api/v1/auth/forgot-password': true,
  // Phase 8.1: Password reset request
  'POST /api/v1/auth/password/reset/request': true,
  // Phase 8.2: Password reset validation and completion
  'POST /api/v1/auth/password/reset/validate': true,
  'POST /api/v1/auth/password/reset/complete': true,
  // Legacy routes (kept for backward compatibility)
  'POST /api/v1/auth/reset-password/validate': true,
  'POST /api/v1/auth/reset-password': true,
  // OAuth completion (for missing email flow)
  'POST /api/v1/auth/oauth/complete': true,
  // Account System Expansion (Phase 1) - User Profile Routes
  'GET /api/v1/user/profile': true,
  'PUT /api/v1/user/profile': true,
  'POST /api/v1/user/profile': true,
  'PUT /api/v1/user/change-password': true,
  // Account System Expansion (Phase 2) - Security Routes
  'GET /api/v1/user/security/activity': true,
  'GET /api/v1/user/security/devices': true,
  // DELETE /api/v1/user/security/devices/:deviceId is handled by pattern matching
  'GET /api/v1/user/security/2fa/status': true,
  'POST /api/v1/user/security/2fa/setup': true,
  'POST /api/v1/user/security/2fa/verify': true,
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
  'GET /api/v1/admin/navigation': true,
  'GET /api/v1/admin/users': true,
  'GET /api/v1/admin/users/:userId': true,
  'PUT /api/v1/admin/users/:userId/role': true,
  'PUT /api/v1/admin/users/:userId/status': true,
  'PATCH /api/v1/admin/users/:userId/toggle-status': true,
  'PUT /api/v1/admin/users/:userId/feature-flags': true,
  'GET /api/v1/admin/users/:userId/activity': true,
  'GET /api/v1/admin/users/:userId/devices': true,
  // Phase 7.1: Admin Session Management
  'GET /api/v1/admin/users/:userId/sessions': true,
  'POST /api/v1/admin/users/:userId/sessions/revoke': true,
  'POST /api/v1/admin/users/:userId/sessions/revoke-all': true,
  // Phase 7: Admin Audit Logs
  'GET /api/v1/admin/audit-logs': true,
  // Admin Roles Management
  'GET /api/v1/admin/roles': true,
  // Phase D2: Admin Settings
  'GET /api/v1/admin/settings': true,
  'PUT /api/v1/admin/settings/:key': true,
  // Phase E1: System Health
  'GET /api/v1/admin/health': true,
  // Phase E2: System Jobs
  'GET /api/v1/admin/jobs': true,
  'GET /api/v1/admin/jobs/:jobId': true,
  'POST /api/v1/admin/jobs/:jobId/retry': true,
  'POST /api/v1/admin/jobs/:jobId/cancel': true,
  // Phase F1: Admin Sessions
  'GET /api/v1/admin/sessions': true,
  'POST /api/v1/admin/sessions/:sessionId/revoke': true,
  // Phase 9.2: Account Deletion
  'POST /api/v1/user/account/delete': true,
  // Phase 9.3: Data Export
  'GET /api/v1/user/account/export': true,
  // PHASE S1: Secure Change Password
  'POST /api/v1/account/change-password': true,
  // PHASE S3: Account Data Export
  'GET /api/v1/account/export': true,
  // PHASE S4: Account Deletion
  'POST /api/v1/account/delete': true,
  // 2FA Foundations
  'GET /api/v1/account/2fa/status': true,
  'POST /api/v1/account/2fa/setup': true,
  'POST /api/v1/account/2fa/confirm': true,
  'POST /api/v1/account/2fa/disable': true,
  // PHASE S5: 2FA Recovery Codes
  'GET /api/v1/account/2fa/recovery': true,
  'POST /api/v1/account/2fa/recovery/regenerate': true,
  // PHASE S2: Sessions & Devices
  'GET /api/v1/security/sessions': true,
  'DELETE /api/v1/security/sessions/:sessionId': true,
  'DELETE /api/v1/security/sessions/others': true,
  // Phase W2.1: Wallet Summary
  'GET /api/v1/wallet/summary': true,
  // Phase W2.3: Wallet Transactions
  'GET /api/v1/wallet/transactions': true,
  // Phase W2.4: Staking (mock/preview only)
  'GET /api/v1/wallet/staking/summary': true,
  'POST /api/v1/wallet/staking/preview': true,
  // Phase W2.6: Wallet Overview
  'GET /api/v1/wallet/overview': true,
  // Phase W2.7: Wallet Activity + Charts
  'GET /api/v1/wallet/activity': true,
  // Phase W2.8: Rewards Timeline (mini bar chart)
  'GET /api/v1/wallet/rewards/timeline': true,
  // Phase W2.9: Wallet Badges
  'GET /api/v1/wallet/badges': true,
  // PHASE D2 — Challenge Program (mock)
  'GET /api/v1/challenge/overview': true,
  'GET /api/v1/challenge/tracks': true,
  'GET /api/v1/challenge/timeline': true,
  // PHASE D3 — Amy Agent Shell (mock)
  'GET /api/v1/amy/sessions': true,
  'POST /api/v1/amy/sessions': true,
  // Dynamic routes with sessionId are handled by pattern matching below
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
  // Strip query string for route matching (ALLOWED_ROUTES doesn't include query params)
  const urlWithoutQuery = url.split('?')[0];
  const routeKey = `${method} ${urlWithoutQuery}`;
  
  // Check exact match first
  if (ALLOWED_ROUTES[routeKey]) {
    // Route is allowed
  } else {
    // Check for dynamic routes (e.g., DELETE /api/v1/user/security/devices/:deviceId)
    // Also check for admin routes with userId parameter
    const isDynamicRoute = Object.keys(ALLOWED_ROUTES).some(allowedRoute => {
      // Extract method from allowedRoute (format: "METHOD /api/v1/path")
      const [allowedMethod, allowedPath] = allowedRoute.split(' ', 2);
      
      // For DELETE routes with deviceId, check if it matches the pattern
      if (method === 'DELETE' && url.includes('/user/security/devices/')) {
        return allowedMethod === method && allowedRoute.includes('/user/security/devices');
      }
      // For admin routes with userId, check if it matches the pattern
      if (url.includes('/admin/users/') && !url.endsWith('/admin/users')) {
        return allowedMethod === method && allowedRoute.includes('/admin/users/');
      }
      // For session routes, check if it matches the pattern
      if (url.includes('/user/security/sessions')) {
        return allowedMethod === method && allowedRoute.includes('/user/security/sessions');
      }
      // For Amy routes with sessionId, check if it matches the pattern
      if (url.includes('/amy/sessions/') && !url.endsWith('/amy/sessions')) {
        return allowedMethod === method && allowedRoute.includes('/amy/sessions');
      }
      // For security routes with sessionId, check if it matches the pattern
      if (url.includes('/security/sessions/') && !url.endsWith('/security/sessions') && !url.endsWith('/security/sessions/others')) {
        return allowedMethod === method && allowedRoute.includes('/security/sessions/');
      }
      // For admin settings routes with key parameter
      if (url.includes('/admin/settings/') && !url.endsWith('/admin/settings')) {
        return allowedMethod === method && allowedRoute.includes('/admin/settings/');
      }
      // For admin jobs routes with jobId parameter
      if (url.includes('/admin/jobs/') && !url.endsWith('/admin/jobs')) {
        return allowedMethod === method && allowedRoute.includes('/admin/jobs/');
      }
      // For admin sessions routes with sessionId parameter
      if (url.includes('/admin/sessions/') && !url.endsWith('/admin/sessions')) {
        return allowedMethod === method && allowedRoute.includes('/admin/sessions/');
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
    let data = null;
    let rawText = '';
    try {
      rawText = await res.text();
      if (rawText) {
        data = JSON.parse(rawText);
      }
    } catch (parseError) {
      // Log detailed error information for developers
      console.error("[API] Failed to parse JSON", {
        method,
        url,
        httpStatus: res.status,
        statusText: res.statusText,
        rawBody: rawText,
        parseError: parseError.message
      });
      
      // If we couldn't parse JSON, create AppError
      throw new AppError({
        message: "The server returned an invalid response. Please try again.",
        code: "PARSE_ERROR",
        httpStatus: res.status,
        raw: rawText
      });
    }

    logApiResponse(method, url, res.status, data);

    // Check for error responses (either !res.ok or data.status === "ERROR")
    if (!res.ok || (data && data.status === "ERROR")) {
      const backendMessage = data?.message || data?.error || null;
      const backendCode = data?.code || data?.errorCode || null;
      const httpStatus = res.status;

      // Log detailed info for developers
      console.error("[API] Request failed", {
        method,
        url,
        httpStatus,
        backendCode,
        backendMessage,
        raw: data,
      });

      // Build user-facing message with sane defaults
      let friendlyMessage = backendMessage || "Something went wrong";

      if (httpStatus === 401) {
        friendlyMessage = "Your session has expired. Please sign in again.";
        // Clear any stored auth data
        window.localStorage.removeItem('ogc_token');
        // Only redirect if we're not already on auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        }
      } else if (httpStatus === 403) {
        friendlyMessage = "You don't have permission to perform this action.";
        // Only redirect if we're not already on dashboard or auth pages
        if (!window.location.pathname.startsWith('/dashboard') && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/dashboard';
        }
      } else if (httpStatus >= 500) {
        friendlyMessage = "The server encountered an error. Please try again later.";
      }

      throw new AppError({
        message: friendlyMessage,
        code: backendCode || "REQUEST_FAILED",
        httpStatus,
        raw: data,
      });
    }

    // Success response - standardized format: { status: "OK", data: { ... } }
    if (data && data.status === 'OK' && data.data !== undefined) {
      // Return the inner data object
      return data.data;
    }

    // Legacy support: if status is OK but no data wrapper, return as-is (for backward compatibility)
    if (data && (data.status === 'OK' || data.success === true) || res.status >= 200 && res.status < 300) {
      // For backward compatibility, if there's no data wrapper, return the whole object
      // but log a warning in dev
      if (isDev && data && !data.data) {
        console.warn(`[API] ${method} ${url} → Legacy response format (no data wrapper):`, data);
      }
      return (data && data.data !== undefined) ? data.data : (data || {});
    }

    // If response is OK but doesn't match expected format, log warning but return data
    if (isDev && data) {
      console.warn(`[API] ${method} ${url} → Unexpected success format:`, data);
    }
    return data || {};
  } catch (error) {
    // If it's already an AppError, just log and rethrow
    if (error instanceof AppError) {
      logApiError(method, url, error);
      throw error;
    }

    // Network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      const networkError = new AppError({
        message: "Unable to reach the server. Please check that the backend is running or try again in a moment.",
        code: "NETWORK_ERROR",
        httpStatus: 0,
        raw: null
      });
      logApiError(method, url, networkError);
      throw networkError;
    }

    // For any other error, wrap it in AppError
    const appError = new AppError({
      message: error.message || "An unexpected error occurred. Please try again.",
      code: error.code || error.backendCode || "UNKNOWN_ERROR",
      httpStatus: error.statusCode || error.status || 0,
      raw: error.data || null
    });
    
    logApiError(method, url, appError);
    throw appError;
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

/**
 * Profile API Helpers
 * These functions handle the standardized API response format and return the profile data directly
 */

/**
 * Get current user's profile
 * @returns {Promise<Object>} Profile object
 */
export async function getUserProfile() {
  const data = await apiRequest('/user/profile', {
    method: 'GET',
  });
  // data should be { profile: {...} }
  return data.profile || {};
}

/**
 * Update current user's profile
 * @param {Object} payload - Profile fields to update
 * @returns {Promise<Object>} Updated profile object
 */
export async function updateUserProfile(payload) {
  const data = await apiRequest('/user/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // data should be { profile: {...} }
  return data.profile || {};
}

/**
 * Security Activity API Helpers
 * These functions handle the standardized API response format and return activity data directly
 */

/**
 * Get user's security activity log
 * @returns {Promise<Array>} Array of activity entries
 */
export async function getUserSecurityActivity() {
  const data = await apiRequest('/user/security/activity', {
    method: 'GET',
  });
  // data should be { items: [...] }
  return data.items || [];
}

/**
 * Get user's registered devices
 * @returns {Promise<Array>} Array of device records
 */
export async function getUserSecurityDevices() {
  const data = await apiRequest('/user/security/devices', {
    method: 'GET',
  });
  // data should be { devices: [...] }
  return data.devices || [];
}

/**
 * Session API Helpers
 * These functions handle the standardized API response format and return session data directly
 */

/**
 * Get all active sessions for the current user
 * @returns {Promise<Array>} Array of session objects with isCurrent flag
 */
export async function getUserSessions() {
  const data = await apiRequest('/user/security/sessions', {
    method: 'GET',
  });
  // data should be { sessions: [...] }
  return data.sessions || [];
}

/**
 * Revoke a specific session
 * @param {string|number} sessionId - Session ID to revoke
 * @returns {Promise<Object>} Success response with { success: true }
 */
export async function revokeUserSession(sessionId) {
  const data = await apiRequest('/user/security/sessions/revoke', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
  // data should be { success: true }
  return data;
}

/**
 * Revoke all sessions except the current one
 * @returns {Promise<Object>} Success response with { success: true }
 */
export async function revokeAllOtherSessions() {
  const data = await apiRequest('/user/security/sessions/revoke-all-others', {
    method: 'POST',
  });
  // data should be { success: true }
  return data;
}

/**
 * Two-Factor Authentication API Helpers
 * These functions handle the standardized API response format and return 2FA data directly
 */

/**
 * 2FA Foundations API Helpers
 * These functions use the /account/2fa/* endpoints
 */

/**
 * Get 2FA status for the current user
 * @returns {Promise<Object>} Status object with { enabled, createdAt, confirmedAt }
 */
export async function getTwoFactorStatus() {
  const data = await apiRequest('/account/2fa/status', { method: 'GET' });
  // apiRequest already unwraps { status: 'OK', data: {...} } to just the data
  return data || { enabled: false, createdAt: null, confirmedAt: null };
}

/**
 * Start 2FA setup - Generate secret
 * @returns {Promise<Object>} Setup data with { secret, otpauthUrl }
 */
export async function startTwoFactorSetup() {
  const data = await apiRequest('/account/2fa/setup', { method: 'POST' });
  // apiRequest already unwraps { status: 'OK', data: {...} } to just the data
  const { secret, otpauthUrl } = data || {};
  return { secret: secret || '', otpauthUrl: otpauthUrl || '' };
}

/**
 * Confirm 2FA setup with verification code
 * @param {string} token - 6-digit TOTP code
 * @returns {Promise<Object>} Success response
 */
export async function confirmTwoFactorSetup(token) {
  const data = await apiRequest('/account/2fa/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  // apiRequest already unwraps the response
  return data || {};
}

/**
 * Disable 2FA for the current user
 * @returns {Promise<Object>} Success response
 */
export async function disableTwoFactor() {
  const data = await apiRequest('/account/2fa/disable', { method: 'POST' });
  // apiRequest already unwraps the response
  return data || {};
}

/**
 * Get recovery codes status for the current user (Phase S5)
 * @returns {Promise<Array>} Array of recovery code status objects (masked, no plain codes)
 */
export async function getRecoveryCodesStatus() {
  const data = await apiRequest('/account/2fa/recovery', { method: 'GET' });
  // apiRequest unwraps { status: 'OK', data: { codes: [...] } } to just the data
  return data?.codes || [];
}

/**
 * Regenerate recovery codes for the current user (Phase S5)
 * Returns plain codes (only shown once) and invalidates old unused codes
 * @returns {Promise<Array<string>>} Array of plain recovery codes
 */
export async function regenerateRecoveryCodes() {
  const data = await apiRequest('/account/2fa/recovery/regenerate', { method: 'POST' });
  // apiRequest unwraps { status: 'OK', data: { codes: [...] } } to just the data
  if (!data || !data.codes) {
    throw new Error('Failed to generate recovery codes.');
  }
  return data.codes;
}

/**
 * Admin API Helpers
 * These functions handle admin operations for user management
 */

/**
 * Get admin navigation structure
 * @returns {Promise<Object>} Navigation structure with groups and meta
 */
export async function getAdminNavigation() {
  const data = await apiRequest('/admin/navigation', {
    method: 'GET',
  });
  // apiRequest unwraps { status: 'OK', code: 'ADMIN_NAV_OK', data: { groups: [...], meta: {...} } } to just the data object
  return data;
}

/**
 * Fetch paginated list of users for admin view
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Items per page (default: 20)
 * @param {string} params.search - Search query (optional)
 * @param {string} params.role - Role filter (optional)
 * @returns {Promise<Object>} Object with items array and pagination metadata
 */
export async function fetchAdminUsers({ page = 1, pageSize = 20, search = '', role = '' } = {}) {
  const params = new URLSearchParams();
  
  params.set('page', page.toString());
  params.set('limit', pageSize.toString()); // Backend expects 'limit', not 'pageSize'
  
  // Backend expects 'q' for search (also supports 'search' for backward compatibility)
  if (search) params.set('q', search);
  
  // Note: Backend doesn't currently support role filtering via query param
  // Role filtering is handled on frontend after fetching
  
  const data = await apiRequest(`/admin/users?${params.toString()}`, {
    method: 'GET',
  });
  // Backend returns: { users: [...], page, limit, total }
  // apiRequest unwraps { status: 'OK', data: { users: [...], page, limit, total } } to just the data object
  return data;
}

/**
 * Get detailed user information for admin view
 * @param {number|string} userId - User ID
 * @returns {Promise<Object>} User object with profile, role, status, etc.
 */
export async function getAdminUser(userId) {
  const data = await apiRequest(`/admin/users/${userId}`, {
    method: "GET",
  });
  // data = { user, recentActivity, devices }
  return data.user;
}

/**
 * Get detailed user information for admin view (standardized contract)
 * Calls GET /api/v1/admin/users/:userId
 * @param {number|string} userId - User ID
 * @returns {Promise<Object>} Object with user property: { user: {...} }
 * @throws {AppError} On 401/403/404/500 with proper error codes
 */
export async function getAdminUserDetail(userId) {
  try {
    const data = await apiRequest(`/admin/users/${userId}`, {
      method: 'GET',
    });
    // Backend returns: { status: 'OK', code: 'ADMIN_USER_DETAILS_OK', data: { user } }
    // apiRequest unwraps to: { user }
    return { user: data.user || data };
  } catch (error) {
    // Re-throw AppError with proper codes
    // Error codes: AUTH_REQUIRED (401), ADMIN_REQUIRED (403), ADMIN_USER_NOT_FOUND (404), DATABASE_ERROR (500)
    throw error;
  }
}

/**
 * Fetch basic user detail for read-only drawer (simple lookup)
 * @param {number|string} userId - User ID
 * @returns {Promise<Object>} Response object with data property containing user object
 *   User object includes: id, email, fullName, role, accountStatus, createdAt, lastLoginAt, connectedProviders, username
 */
export async function fetchAdminUserDetail(userId) {
  const user = await apiRequest(`/admin/users/${userId}?simple=true`, {
    method: 'GET',
  });
  // apiRequest unwraps { status: 'OK', code: 'ADMIN_USER_DETAIL', data: {...user} } to just the user object
  return { data: user };
}

/**
 * Toggle user account status (ACTIVE ↔ DISABLED)
 * @param {number|string} userId - User ID
 * @returns {Promise<Object>} Response object with accountStatus property
 */
export async function toggleAdminUserStatus(userId) {
  const data = await apiRequest(`/admin/users/${userId}/toggle-status`, {
    method: 'PATCH',
  });
  // apiRequest unwraps { status: 'OK', code: 'ADMIN_USER_STATUS_UPDATED', data: { accountStatus } } to just the data object
  return { data };
}

/**
 * Get all sessions for a user (admin)
 * @param {number|string} userId - User ID
 * @returns {Promise<Array>} Array of session objects with isCurrent flag
 */
export async function getAdminUserSessions(userId) {
  const data = await apiRequest(`/admin/users/${userId}/sessions`, {
    method: "GET",
  });
  // data = { sessions }
  return data.sessions || [];
}

/**
 * Revoke a specific session for a user (admin)
 * @param {number|string} userId - User ID
 * @param {number|string} sessionId - Session ID to revoke
 * @returns {Promise<Object>} Success response with { success: true }
 */
export async function adminRevokeUserSession(userId, sessionId) {
  const data = await apiRequest(`/admin/users/${userId}/sessions/revoke`, {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
  // data = { success: true }
  return data;
}

/**
 * Revoke all sessions for a user (admin)
 * @param {number|string} userId - User ID
 * @returns {Promise<Object>} Success response with { success: true }
 */
export async function adminRevokeAllUserSessions(userId) {
  const data = await apiRequest(`/admin/users/${userId}/sessions/revoke-all`, {
    method: "POST",
  });
  // data = { success: true }
  return data;
}

/**
 * Get admin audit logs with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=25] - Items per page (max 100)
 * @param {string} [params.q] - Search query (optional)
 * @param {number} [params.actorUserId] - Filter by actor user ID (optional)
 * @param {string} [params.action] - Filter by action type (optional)
 * @param {string} [params.status] - Filter by status (optional)
 * @returns {Promise<Object>} Object with logs array and pagination metadata
 */
export async function getAdminAuditLogs(params = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.q) searchParams.set('q', params.q);
  if (params.actorUserId) searchParams.set('actorUserId', params.actorUserId.toString());
  if (params.action) searchParams.set('action', params.action);
  if (params.status) searchParams.set('status', params.status);
  
  const url = `/admin/audit-logs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  const data = await apiRequest(url, {
    method: 'GET',
  });
  
  // Backend returns: { status: 'OK', code: 'ADMIN_AUDIT_LOGS_OK', data: { logs: [...], page, limit, total } }
  // apiRequest unwraps to: { logs: [...], page, limit, total }
  return data;
}

/**
 * Get admin roles overview
 */
export async function getAdminRoles() {
  const url = `/admin/roles`;
  
  const data = await apiRequest(url, {
    method: 'GET',
  });
  
  // Backend returns: { status: 'OK', code: 'ADMIN_ROLES_OK', data: { roles: [...] } }
  // apiRequest unwraps to: { roles: [...] }
  return data;
}

/**
 * Admin Settings API Helpers (Phase D2)
 */

/**
 * Get all platform settings
 * @returns {Promise<Object>} Object with settings property: { settings: {...} }
 */
export async function getAdminSettings() {
  const data = await apiRequest('/admin/settings', {
    method: 'GET',
  });
  
  // Backend returns: { status: 'OK', code: 'ADMIN_SETTINGS_OK', data: { settings: {...} } }
  // apiRequest unwraps to: { settings: {...} }
  return data;
}

/**
 * Update a platform setting
 * @param {string} key - Setting key (e.g., 'maintenance_mode')
 * @param {any} value - New value (must match setting type)
 * @param {string} [reason] - Optional reason for the change
 * @returns {Promise<Object>} Updated setting object
 */
export async function updateAdminSetting(key, value, reason) {
  const payload = { value };
  if (reason) {
    payload.reason = reason;
  }
  
  const data = await apiRequest(`/admin/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  
  // Backend returns: { status: 'OK', code: 'ADMIN_SETTING_UPDATED', data: { setting: {...} } }
  // apiRequest unwraps to: { setting: {...} }
  return data;
}

/**
 * System Health API Helpers (Phase E1)
 */

/**
 * Get system health status
 * @returns {Promise<Object>} Health status object with status, timestamp, and services
 */
export async function getSystemHealth() {
  try {
    const data = await apiRequest('/admin/health', {
      method: 'GET',
    });
    
    // Backend returns: { status: 'OK', code: 'SYSTEM_HEALTH_OK', data: { status, timestamp, services } }
    // apiRequest unwraps to: { status, timestamp, services }
    return { ok: true, data };
  } catch (error) {
    // Return error-safe response
    return {
      ok: false,
      error: error.message || 'Failed to fetch system health',
      data: null,
    };
  }
}

/**
 * Admin Sessions API Helpers (Phase F1)
 */

/**
 * Get admin sessions list with filtering and pagination
 * @param {Object} params - Query parameters
 * @param {string} [params.status] - Filter by status (active, revoked, expired, all)
 * @param {string} [params.q] - Search query (email/username)
 * @param {number} [params.limit=25] - Maximum number of sessions to return
 * @param {number} [params.offset=0] - Offset for pagination
 * @returns {Promise<Object>} Object with { ok, data, error } where data contains { total, sessions }
 */
export async function getAdminSessions(params = {}) {
  try {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.q) searchParams.set('q', params.q);
    if (params.limit != null) searchParams.set('limit', params.limit.toString());
    if (params.offset != null) searchParams.set('offset', params.offset.toString());

    const url = `/admin/sessions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const data = await apiRequest(url, { method: 'GET' });

    // Backend returns: { status: 'OK', code: 'ADMIN_SESSIONS_LIST_OK', data: { total, sessions } }
    // apiRequest unwraps to: { total, sessions }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to fetch admin sessions',
      data: null,
    };
  }
}

/**
 * Revoke an admin session (force logout)
 * @param {string|number} sessionId - Session ID to revoke
 * @param {string} [reason] - Optional reason for revocation
 * @param {boolean} [confirmSelf=false] - Confirm flag if revoking own session
 * @returns {Promise<Object>} Object with { ok, data, error } where data contains { revoked }
 */
export async function revokeAdminSession(sessionId, reason, confirmSelf = false) {
  try {
    const payload = {};
    if (reason) payload.reason = reason;
    if (confirmSelf) payload.confirmSelf = true;

    const data = await apiRequest(`/admin/sessions/${sessionId}/revoke`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Backend returns: { status: 'OK', code: 'ADMIN_SESSION_REVOKED', data: { revoked } }
    // apiRequest unwraps to: { revoked }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to revoke session',
      data: null,
    };
  }
}

/**
 * System Jobs API Helpers (Phase E2)
 */

/**
 * Get system jobs list with filtering and pagination
 * @param {Object} params - Query parameters
 * @param {string} [params.status] - Filter by status (queued, running, completed, failed, canceled)
 * @param {string} [params.q] - Search query (optional)
 * @param {number} [params.limit=25] - Maximum number of jobs to return
 * @param {number} [params.offset=0] - Offset for pagination
 * @returns {Promise<Object>} Object with { ok, data, error } where data contains { configured, jobs, total }
 */
export async function getSystemJobs(params = {}) {
  try {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.q) searchParams.set('q', params.q);
    if (params.limit != null) searchParams.set('limit', params.limit.toString());
    if (params.offset != null) searchParams.set('offset', params.offset.toString());

    const url = `/admin/jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const data = await apiRequest(url, { method: 'GET' });

    // Backend returns: { status: 'OK', code: 'SYSTEM_JOBS_LIST_OK', data: { configured, total, jobs } }
    // apiRequest unwraps to: { configured, total, jobs }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to fetch system jobs',
      data: null,
    };
  }
}

/**
 * Get system job details by ID
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Object with { ok, data, error } where data contains { configured, job }
 */
export async function getSystemJob(jobId) {
  try {
    const data = await apiRequest(`/admin/jobs/${jobId}`, { method: 'GET' });

    // Backend returns: { status: 'OK', code: 'SYSTEM_JOB_OK', data: { configured, job } }
    // apiRequest unwraps to: { configured, job }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to fetch job details',
      data: null,
    };
  }
}

/**
 * Retry a failed job
 * @param {string} jobId - Job ID to retry
 * @returns {Promise<Object>} Object with { ok, data, error } where data contains { configured, result }
 */
export async function retrySystemJob(jobId) {
  try {
    const data = await apiRequest(`/admin/jobs/${jobId}/retry`, {
      method: 'POST',
    });

    // Backend returns: { status: 'OK', code: 'SYSTEM_JOB_RETRY_OK', data: { configured, result } }
    // apiRequest unwraps to: { configured, result }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to retry job',
      data: null,
    };
  }
}

/**
 * Cancel a queued or running job
 * @param {string} jobId - Job ID to cancel
 * @returns {Promise<Object>} Object with { ok, data, error } where data contains { configured, result }
 */
export async function cancelSystemJob(jobId) {
  try {
    const data = await apiRequest(`/admin/jobs/${jobId}/cancel`, {
      method: 'POST',
    });

    // Backend returns: { status: 'OK', code: 'SYSTEM_JOB_CANCEL_OK', data: { configured, result } }
    // apiRequest unwraps to: { configured, result }
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to cancel job',
      data: null,
    };
  }
}

/**
 * Password Reset API Helpers
 */

/**
 * Request a password reset email (canonical function - single source of truth)
 * Uses the standard /auth/forgot-password endpoint
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Response with message
 */
export async function requestPasswordReset(email) {
  return api.post('/auth/forgot-password', { email });
}

/**
 * Request a password reset email (legacy - kept for backward compatibility)
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Response with message
 * @deprecated Use requestPasswordReset instead
 */
export async function requestPasswordResetEmail(email) {
  const payload = { email };

  const data = await apiRequest("/auth/password/reset/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // data should be { message }
  return data;
}

/**
 * Phase S6: Complete 2FA login with ticket + TOTP or recovery code
 * @param {Object} params - 2FA login parameters
 * @param {string} params.ticket - 2FA ticket from initial login response
 * @param {string} params.mode - Either 'totp' or 'recovery'
 * @param {string} params.code - TOTP code (6 digits) or recovery code
 * @returns {Promise<Object>} Response with access token, refresh token, and user data
 */
export async function loginWithTwoFactor({ ticket, mode, code }) {
  const payload = { ticket, mode, code };
  
  const data = await apiRequest('/auth/login/2fa', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  // apiRequest unwraps { status: 'OK', data: {...} } to just the data
  return data;
}

/**
 * Account Deletion API Helpers
 */

/**
 * Delete the current user's account
 * @param {string} password - Current password for verification
 * @returns {Promise<Object>} Response with message
 */
export async function deleteOwnAccount(password) {
  const payload = { password };

  const data = await apiRequest("/user/account/delete", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // data = { message }
  return data;
}

/**
 * Change password (PHASE S1)
 * @param {Object} payload - Password change payload
 * @param {string} payload.currentPassword - Current password
 * @param {string} payload.newPassword - New password
 * @param {string} payload.confirmPassword - Password confirmation
 * @returns {Promise<Object>} Response object with status and message
 */
export async function changePasswordApi(payload) {
  // Use fetch directly to get the full response with status
  const url = `${API_BASE_URL}/account/change-password`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.status !== 'OK') {
    const msg = data.message || 'Failed to change password.';
    const error = new Error(msg);
    error.code = data.code;
    error.details = data.details;
    throw error;
  }

  return data;
}

/**
 * Fetch security sessions (PHASE S2)
 * @returns {Promise<Array>} Array of session objects
 */
export async function fetchSecuritySessions() {
  const response = await apiRequest('/security/sessions', { method: 'GET' });
  // apiRequest unwraps the data from { status: 'OK', data: [...] }
  return response || [];
}

/**
 * Revoke a specific session (PHASE S2)
 * @param {number} sessionId - Session ID to revoke
 * @returns {Promise<Object>} Response object
 */
export async function revokeSession(sessionId) {
  const urlWithoutQuery = `/security/sessions/${sessionId}`.split('?')[0];
  const response = await apiRequest(urlWithoutQuery, { method: 'DELETE' });
  if (!response || (response.status && response.status !== 'OK')) {
    throw new Error(response?.message || 'Failed to revoke session.');
  }
  return response;
}

/**
 * Revoke all other sessions (PHASE S2)
 * @returns {Promise<Object>} Response object
 */
export async function revokeOtherSessions() {
  const response = await apiRequest('/security/sessions/others', { method: 'DELETE' });
  if (!response || (response.status && response.status !== 'OK')) {
    throw new Error(response?.message || 'Failed to revoke other sessions.');
  }
  return response;
}

/**
 * Export the current user's account data as JSON (PHASE S3)
 * Returns a Blob that can be downloaded as a file
 * @returns {Promise<Blob>} Blob containing the JSON export file
 */
export async function exportAccountData() {
  const url = `${API_BASE_URL}/account/export`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    // Try to parse error message from JSON if available
    let errorMessage = 'Failed to export account data';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If response isn't JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    const error = new Error(errorMessage);
    error.code = 'ACCOUNT_EXPORT_FAILED';
    error.httpStatus = response.status;
    throw error;
  }

  const blob = await response.blob();
  return blob;
}

/**
 * Delete the current user's account (PHASE S4)
 * Requires password verification and optional 2FA (if enabled)
 * @param {Object} payload - Deletion payload
 * @param {string} payload.password - Current password for verification
 * @param {string} [payload.otp] - Optional 2FA code (required if 2FA is enabled)
 * @param {string} payload.confirmText - Must be "DELETE" to confirm
 * @returns {Promise<Object>} Response object with status and message
 */
export async function deleteAccountApi(payload) {
  const url = `${API_BASE_URL}/account/delete`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.status !== 'OK') {
    const msg = data.message || 'Failed to delete account.';
    const error = new Error(msg);
    error.code = data.code;
    throw error;
  }

  return data;
}

/**
 * Export the current user's account data as JSON (legacy function - kept for backward compatibility)
 * @deprecated Use exportAccountData() instead, which returns a Blob for direct download
 * @returns {Promise<Object>} Export payload with user, security, sessions, and activity data
 */
export async function exportOwnAccountData() {
  const data = await apiRequest("/user/account/export", {
    method: "GET",
  });

  // data is the payload from sendOk, already unwrapped by apiRequest.
  // It should look like: { exportedAt, user, security: { twoFactor, sessions, activity } }
  return data;
}

/**
 * Wallet API Helpers
 */

/**
 * Get wallet summary for the current user
 * @returns {Promise<Object|null>} Wallet summary object with mainBalance, lockedBalance, pendingRewards, estimatedUsdValue, lastUpdated, or null if missing
 */
export async function getWalletSummary() {
  const data = await apiRequest('/wallet/summary', {
    method: 'GET',
  });
  // Backend returns { status: 'OK', data: { summary: {...} } }
  return data.summary || null;
}

/**
 * Get wallet transactions for the current user with pagination
 * @param {Object} params - Query parameters { limit, offset }
 * @returns {Promise<Object>} Object with items array and pagination metadata
 */
export async function getWalletTransactions(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.limit != null) searchParams.set('limit', params.limit);
  if (params.offset != null) searchParams.set('offset', params.offset);

  const url =
    '/wallet/transactions' +
    (searchParams.toString() ? `?${searchParams.toString()}` : '');

  const data = await apiRequest(url, {
    method: 'GET',
  });
  // Backend returns { status: 'OK', data: { transactions: [...], pagination: {...} } }
  return {
    items: data.transactions || [],
    pagination: data.pagination || { total: 0, limit: params.limit || 10, offset: params.offset || 0 },
  };
}

/**
 * Get staking summary for the current user
 * @returns {Promise<Object|null>} Staking summary object with stakedAmount, claimableRewards, lifetimeRewards, apy, etc., or null if missing
 */
export async function getStakingSummary() {
  const data = await apiRequest('/wallet/staking/summary', {
    method: 'GET',
  });
  // backend: { status: "OK", data: { staking: {...} } }
  return data.staking || null;
}

/**
 * Get staking preview for a potential stake amount
 * @param {number} amount - Amount to stake (OGC)
 * @returns {Promise<Object|null>} Preview object with estimated rewards, or null if missing
 */
export async function getStakingPreview(amount) {
  const payload = { amount: Number(amount || 0) };
  const data = await apiRequest('/wallet/staking/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // backend: { status: "OK", data: { preview: {...} } }
  return data.preview || null;
}

/**
 * Get wallet overview for the current user (Phase W2.6)
 * Returns wallet snapshot and balances
 * @returns {Promise<Object|null>} Wallet overview object with snapshot and balances, or null if missing
 */
export async function getWalletOverview() {
  const data = await apiRequest('/wallet/overview', {
    method: 'GET',
  });
  // backend: { status: "OK", data: { snapshot: {...}, balances: {...} } }
  // apiRequest already unwraps the data, so we get { snapshot: {...}, balances: {...} } directly
  return data || null;
}

/**
 * Get wallet activity for the current user (Phase W2.7)
 * Returns timeseries data and summary for charting
 * @param {string} range - Time range: '7d' or '30d' (default: '30d')
 * @returns {Promise<Object>} Activity object with timeseries array and summary object
 */
export async function getWalletActivity(range = '30d') {
  const params = new URLSearchParams({ range });
  const data = await apiRequest(`/wallet/activity?${params.toString()}`, {
    method: 'GET',
  });
  // backend: { status: "OK", data: { timeseries: [...], summary: {...} } }
  // apiRequest already unwraps the data, so we get { timeseries: [...], summary: {...} } directly
  return data || { timeseries: [], summary: null };
}

/**
 * Get rewards timeline for the current user (Phase W2.8)
 * Returns rewards events and upcoming payout for mini bar chart
 * @param {string} range - Time range: '7d' or '30d' (default: '30d')
 * @returns {Promise<Object>} Rewards timeline object with events array, upcoming object, and summary object
 */
export async function getRewardsTimeline(range = '30d') {
  const params = new URLSearchParams({ range });
  const data = await apiRequest(`/wallet/rewards/timeline?${params.toString()}`, {
    method: 'GET',
  });
  // backend: { status: "OK", data: { events: [...], upcoming: {...}, summary: {...} } }
  // apiRequest already unwraps the data, so we get { events: [...], upcoming: {...}, summary: {...} } directly
  return data || { events: [], upcoming: null, summary: null };
}

/**
 * Get wallet badges for the current user (Phase W2.9)
 * Returns badge data including staking tier, rewards level, contribution score, and badges array
 * @returns {Promise<Object|null>} Badges object with stakingTier, rewardsLevel, contributionScore, and badges array, or null if missing
 */
export async function getWalletBadges() {
  const data = await apiRequest('/wallet/badges', {
    method: 'GET',
  });
  // backend: { status: "OK", data: { stakingTier, rewardsLevel, contributionScore, badges: [...] } }
  // apiRequest already unwraps the data, so we get the badges object directly
  return data || null;
}

/**
 * Get challenge overview for the current user (PHASE D2)
 * @returns {Promise<Object>} Challenge overview object with season, status, totalTracks, etc.
 */
export async function getChallengeOverview() {
  const response = await apiRequest('/challenge/overview', { method: 'GET' });
  // apiRequest already unwraps the data from { status: 'OK', data: {...} }
  return response || {};
}

/**
 * Get challenge tracks (PHASE D2)
 * @returns {Promise<Array>} Array of challenge track objects
 */
export async function getChallengeTracks() {
  const response = await apiRequest('/challenge/tracks', { method: 'GET' });
  // apiRequest already unwraps the data from { status: 'OK', data: [...] }
  return response || [];
}

/**
 * Get challenge timeline (PHASE D2)
 * @returns {Promise<Array>} Array of timeline phase objects
 */
export async function getChallengeTimeline() {
  const response = await apiRequest('/challenge/timeline', { method: 'GET' });
  // apiRequest already unwraps the data from { status: 'OK', data: [...] }
  return response || [];
}

/**
 * Amy Agent API functions (PHASE D3)
 */

/**
 * List all Amy sessions for the current user (PHASE D3)
 * @returns {Promise<Array>} Array of session objects
 */
export async function amyListSessions() {
  const data = await apiRequest('/amy/sessions', { method: 'GET' });
  // apiRequest already unwraps the data from { status: 'OK', data: [...] }
  return data || [];
}

/**
 * Get a specific Amy session with messages (PHASE D3)
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Session object with messages array
 */
export async function amyGetSession(sessionId) {
  const data = await apiRequest(`/amy/sessions/${sessionId}`, { method: 'GET' });
  // apiRequest already unwraps the data from { status: 'OK', data: {...} }
  return data || { id: sessionId, title: '', messages: [] };
}

/**
 * Create a new Amy session (PHASE D3)
 * @param {string} title - Optional session title
 * @returns {Promise<Object>} Created session object
 */
export async function amyCreateSession(title) {
  const data = await apiRequest('/amy/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  // apiRequest already unwraps the data from { status: 'OK', data: {...} }
  return data || null;
}

/**
 * Send a message to an Amy session (PHASE D3)
 * @param {string} sessionId - The session ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} Object with userMessage and assistantMessage
 */
export async function amySendMessage(sessionId, content) {
  const data = await apiRequest(`/amy/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  // apiRequest already unwraps the data from { status: 'OK', data: {...} }
  return data || null;
}

export { API_BASE_URL, AppError };


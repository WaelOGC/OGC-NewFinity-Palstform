/**
 * Admin API Helper Functions
 * 
 * Provides typed functions for admin RBAC, feature flags, and audit logs.
 * All functions use the base apiClient and handle errors consistently.
 */

import { api, apiRequest } from './apiClient.js';

/**
 * Get paginated list of users for admin view
 * @param {Object} params - Query parameters
 * @param {string} [params.q] - Search query
 * @param {string} [params.role] - Role filter (optional, may be handled client-side)
 * @param {string} [params.status] - Status filter (optional)
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=20] - Items per page
 * @returns {Promise<Object>} Object with users array and pagination metadata
 */
export async function adminGetUsers({ q = '', role = '', status = '', page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', pageSize.toString());
  
  if (q) params.set('q', q);
  
  const data = await api.get(`/admin/users?${params.toString()}`);
  // Backend returns: { users: [...], page, limit, total }
  return {
    items: data.users || [],
    pagination: {
      page: data.page || page,
      pageSize: data.limit || pageSize,
      total: data.total || 0,
      totalPages: Math.ceil((data.total || 0) / (data.limit || pageSize)),
    },
  };
}

/**
 * Get detailed user information for admin view
 * @param {number|string} userId - User ID
 * @returns {Promise<Object>} User object with profile, roles, status, featureFlags, etc.
 */
export async function adminGetUserDetail(userId) {
  const data = await api.get(`/admin/users/${userId}`);
  // Backend returns: { user, recentActivity, devices }
  return data;
}

/**
 * Update user role (assign or replace)
 * Note: Current backend endpoint replaces the primary role. Multi-role support may require backend changes.
 * @param {number|string} userId - User ID
 * @param {Object} params - Update parameters
 * @param {string} params.role - Role to assign
 * @param {string} [params.action='assign'] - Action: 'assign' or 'revoke' (currently backend only supports assign/replace)
 * @param {string|Date|null} [params.expiresAt] - Optional expiration timestamp (ISO string or Date)
 * @returns {Promise<Object>} Updated user object
 */
export async function adminUpdateUserRole(userId, { role, action = 'assign', expiresAt = null }) {
  // Current backend endpoint only supports replacing the role
  // For now, we'll use the existing PUT endpoint
  // TODO: When backend adds multi-role assign/revoke endpoints, update this function
  
  if (action === 'revoke') {
    // For revoke, we'd need a DELETE endpoint or PATCH endpoint
    // Currently, revoke is not directly supported, but we can handle it in the UI
    // by showing the UI state, but this will need backend support
    throw new Error('Role revocation endpoint not yet available. Please use role assignment to change roles.');
  }
  
  const body = { role };
  // Note: expiresAt is not yet supported by the backend endpoint
  // We include it in the request structure for future compatibility
  if (expiresAt) {
    body.expiresAt = expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt;
  }
  
  const data = await api.put(`/admin/users/${userId}/role`, body);
  return data.user || data;
}

/**
 * Update user account status
 * @param {number|string} userId - User ID
 * @param {Object} params - Update parameters
 * @param {string} params.status - Account status (ACTIVE, SUSPENDED, BANNED)
 * @returns {Promise<Object>} Updated user object
 */
export async function adminUpdateUserStatus(userId, { status }) {
  const data = await api.put(`/admin/users/${userId}/status`, { accountStatus: status });
  return data.user || data;
}

/**
 * Set a single user feature flag
 * @param {number|string} userId - User ID
 * @param {Object} params - Flag parameters
 * @param {string} params.flag - Feature flag key
 * @param {boolean} params.enabled - Whether the flag is enabled
 * @returns {Promise<Object>} Updated user object with feature flags
 */
export async function adminSetUserFeatureFlag(userId, { flag, enabled }) {
  const data = await api.put(`/admin/users/${userId}/feature-flags`, {
    featureFlags: { [flag]: enabled },
  });
  return data.user || data;
}

/**
 * Bulk set multiple user feature flags
 * @param {number|string} userId - User ID
 * @param {Object} params - Flags parameters
 * @param {Object} params.flags - Object mapping flag keys to boolean values
 * @returns {Promise<Object>} Updated user object with feature flags
 */
export async function adminBulkSetUserFeatureFlags(userId, { flags }) {
  const data = await api.put(`/admin/users/${userId}/feature-flags`, {
    featureFlags: flags,
  });
  return data.user || data;
}

/**
 * List admin audit logs with filtering and pagination
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=20] - Items per page
 * @param {string} [params.action] - Filter by action type
 * @param {number|string} [params.actorId] - Filter by actor ID
 * @param {string} [params.targetType] - Filter by target type
 * @param {string|Date} [params.dateFrom] - Filter from date (ISO string or Date)
 * @param {string|Date} [params.dateTo] - Filter to date (ISO string or Date)
 * @param {string} [params.q] - Free-text search query (optional)
 * @returns {Promise<Object>} Object with items array and pagination metadata
 */
export async function adminListAuditLogs({
  page = 1,
  pageSize = 20,
  action = null,
  actorId = null,
  targetType = null,
  dateFrom = null,
  dateTo = null,
  q = null,
} = {}) {
  // Build query parameters
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  
  if (action) params.set('action', action);
  if (actorId) params.set('actorId', String(actorId));
  if (targetType) params.set('targetType', targetType);
  if (dateFrom) {
    const dateFromStr = dateFrom instanceof Date ? dateFrom.toISOString() : dateFrom;
    params.set('dateFrom', dateFromStr);
  }
  if (dateTo) {
    const dateToStr = dateTo instanceof Date ? dateTo.toISOString() : dateTo;
    params.set('dateTo', dateToStr);
  }
  if (q) params.set('q', q);
  
  try {
    // Try to fetch audit logs
    // Note: This endpoint may not exist yet, so we handle 404 gracefully
    const data = await apiRequest(`/admin/audit-logs?${params.toString()}`, {
      method: 'GET',
    });
    
    return {
      items: data.items || [],
      pagination: data.pagination || {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error) {
    // If endpoint doesn't exist (404) or table doesn't exist, return empty result
    if (error.httpStatus === 404 || error.code === 'NOT_FOUND' || error.message?.includes('not found')) {
      return {
        items: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
        error: 'Audit log API not available',
      };
    }
    // Re-throw other errors
    throw error;
  }
}

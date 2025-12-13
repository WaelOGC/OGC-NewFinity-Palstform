/**
 * Permissions Matrix Configuration (Phase 7)
 * 
 * Single source of truth for roles, permissions, and feature flags.
 * This file consolidates role-based access control definitions.
 * 
 * Compatible with existing backend/src/config/rolePermissions.js
 */

// ============================================================================
// ROLES
// ============================================================================

export const ROLES = {
  FOUNDER: 'FOUNDER',
  CORE_TEAM: 'CORE_TEAM',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  CREATOR: 'CREATOR',
  STANDARD_USER: 'STANDARD_USER',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
};

export const ROLES_LIST = Object.values(ROLES);

// Admin roles that have access to the admin console
export const ADMIN_ROLES = [ROLES.FOUNDER, ROLES.CORE_TEAM, ROLES.ADMIN];

// Role priority order (for getPrimaryRole)
export const ROLE_PRIORITY = [
  ROLES.FOUNDER,
  ROLES.CORE_TEAM,
  ROLES.ADMIN,
  ROLES.MODERATOR,
  ROLES.CREATOR,
  ROLES.STANDARD_USER,
];

// ============================================================================
// PERMISSIONS
// ============================================================================

export const PERMISSIONS = {
  // User Management
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  ROLE_MANAGEMENT: 'ROLE_MANAGEMENT',
  
  // Content
  CONTENT_PUBLISHING: 'CONTENT_PUBLISHING',
  CONTENT_MODERATION: 'CONTENT_MODERATION',
  
  // System
  SYSTEM_CONFIGURATION: 'SYSTEM_CONFIGURATION',
  FEATURE_FLAG_CONTROL: 'FEATURE_FLAG_CONTROL',
  
  // Analytics & Reporting
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',
  
  // Integrations
  INTEGRATION_MANAGEMENT: 'INTEGRATION_MANAGEMENT',
  
  // Audit & Compliance
  AUDIT_LOG_VIEW: 'AUDIT_LOG_VIEW',
  
  // Legacy permissions (from rolePermissions.js)
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_CONTENT: 'MANAGE_CONTENT',
  MANAGE_TOKENS: 'MANAGE_TOKENS',
  VIEW_ADMIN_DASHBOARD: 'VIEW_ADMIN_DASHBOARD',
  VIEW_FINANCIAL_REPORTS: 'VIEW_FINANCIAL_REPORTS',
  MANAGE_PLATFORM_SETTINGS: 'MANAGE_PLATFORM_SETTINGS',
  USE_INTERNAL_TOOLS: 'USE_INTERNAL_TOOLS',
  MANAGE_FEATURE_FLAGS: 'MANAGE_FEATURE_FLAGS',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  EXPORT_USER_DATA: 'EXPORT_USER_DATA',
  MANAGE_INTEGRATIONS: 'MANAGE_INTEGRATIONS',
  CREATE_TOKENS: 'CREATE_TOKENS',
  PUBLISH_CONTENT: 'PUBLISH_CONTENT',
  COMMENT_ON_CONTENT: 'COMMENT_ON_CONTENT',
};

export const PERMISSIONS_LIST = Object.values(PERMISSIONS);

// ============================================================================
// ROLE → PERMISSIONS MAPPING
// ============================================================================

export const ROLE_PERMISSIONS = {
  [ROLES.FOUNDER]: null, // null means all permissions (checked explicitly in code)
  
  [ROLES.CORE_TEAM]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.MANAGE_TOKENS,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.MANAGE_PLATFORM_SETTINGS,
    PERMISSIONS.USE_INTERNAL_TOOLS,
    PERMISSIONS.MANAGE_FEATURE_FLAGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.EXPORT_USER_DATA,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.CREATE_TOKENS,
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.COMMENT_ON_CONTENT,
    // New permission categories
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.ROLE_MANAGEMENT,
    PERMISSIONS.CONTENT_PUBLISHING,
    PERMISSIONS.CONTENT_MODERATION,
    PERMISSIONS.SYSTEM_CONFIGURATION,
    PERMISSIONS.FEATURE_FLAG_CONTROL,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.INTEGRATION_MANAGEMENT,
    PERMISSIONS.AUDIT_LOG_VIEW,
  ],
  
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.VIEW_ADMIN_DASHBOARD,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.EXPORT_USER_DATA,
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.COMMENT_ON_CONTENT,
    // New permission categories
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.CONTENT_PUBLISHING,
    PERMISSIONS.CONTENT_MODERATION,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
  ],
  
  [ROLES.MODERATOR]: [
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.COMMENT_ON_CONTENT,
    // New permission categories
    PERMISSIONS.CONTENT_MODERATION,
    PERMISSIONS.CONTENT_PUBLISHING,
  ],
  
  [ROLES.CREATOR]: [
    PERMISSIONS.CREATE_TOKENS,
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.COMMENT_ON_CONTENT,
    // New permission categories
    PERMISSIONS.CONTENT_PUBLISHING,
  ],
  
  [ROLES.STANDARD_USER]: [
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.COMMENT_ON_CONTENT,
    // New permission categories
    PERMISSIONS.CONTENT_PUBLISHING,
  ],
  
  [ROLES.SUSPENDED]: [],
  [ROLES.BANNED]: [],
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_ADVANCED_ANALYTICS: 'ENABLE_ADVANCED_ANALYTICS',
  ENABLE_BETA_ADMIN_MODULES: 'ENABLE_BETA_ADMIN_MODULES',
  ENABLE_EMERGENCY_ACTIONS: 'ENABLE_EMERGENCY_ACTIONS',
  // Legacy feature flags (from existing system)
  walletV2: 'walletV2',
  amyAgentBeta: 'amyAgentBeta',
  challengeProgramDashboard: 'challengeProgramDashboard',
  newCreatorTools: 'newCreatorTools',
  advancedAnalytics: 'advancedAnalytics',
  socialTrading: 'socialTrading',
  experimentalUI: 'experimentalUI',
  apiV2Access: 'apiV2Access',
};

export const FEATURE_FLAGS_LIST = Object.values(FEATURE_FLAGS);

// ============================================================================
// PERMISSION → FEATURE FLAG REQUIREMENTS (Optional)
// ============================================================================

/**
 * Some permissions may require a feature flag to be enabled.
 * This map defines which permissions need which flags.
 */
export const PERMISSION_FEATURE_FLAG_REQUIREMENTS = {
  // Example: PERMISSIONS.ADVANCED_ANALYTICS_VIEW: [FEATURE_FLAGS.ENABLE_ADVANCED_ANALYTICS],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default permissions for a role
 * @param {string} role - User role
 * @returns {string[]|null} Array of permission strings, or null for FOUNDER (all permissions)
 */
export function getDefaultPermissionsForRole(role) {
  if (role === ROLES.FOUNDER) {
    return null; // null means "all permissions"
  }
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.STANDARD_USER];
}

/**
 * Check if a role has a specific permission (considering role defaults)
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
export function roleHasPermission(role, permission) {
  if (role === ROLES.FOUNDER) {
    return true; // FOUNDER has all permissions
  }
  const defaultPerms = getDefaultPermissionsForRole(role);
  return defaultPerms && defaultPerms.includes(permission);
}

// ============================================================================
// COMPATIBILITY EXPORTS (for existing code)
// ============================================================================

// Note: ADMIN_ROLES, ROLE_PERMISSIONS, and getDefaultPermissionsForRole
// are already exported inline above, so they're available for backward compatibility.
// No additional re-exports needed.

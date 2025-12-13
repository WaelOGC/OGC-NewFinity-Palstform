// backend/src/constants/rolePermissions.js

/**
 * Role → Permission Mapping
 * 
 * Defines explicit permission assignments for each role.
 * This is the authoritative mapping used by the permission resolver.
 * 
 * Rules:
 * - null means unrestricted (founder only)
 * - All other roles must be explicit arrays
 * - No inheritance magic
 * - Unknown roles = no permissions
 */

import { PERMISSIONS } from './permissions.js';

export const ROLE_PERMISSIONS = Object.freeze({
  // Founder has all permissions (null = unrestricted)
  founder: null,
  
  // Admin has write permissions + all read permissions
  admin: [
    PERMISSIONS.ADMIN_USERS_READ,
    PERMISSIONS.ADMIN_USERS_WRITE,
    PERMISSIONS.ADMIN_ROLES_READ,
    PERMISSIONS.ADMIN_AUDIT_READ, // Maps to ADMIN_AUDIT_LOGS_READ for backward compatibility
    PERMISSIONS.SYSTEM_HEALTH_READ,
    PERMISSIONS.SYSTEM_JOBS_READ,
    PERMISSIONS.SYSTEM_JOBS_WRITE,
    PERMISSIONS.ADMIN_SESSIONS_READ,
    PERMISSIONS.ADMIN_SESSIONS_WRITE,
  ],
  
  // Support has users read only
  support: [
    PERMISSIONS.ADMIN_USERS_READ,
  ],
  
  // Viewer has users read only
  viewer: [
    PERMISSIONS.ADMIN_USERS_READ,
  ],
});

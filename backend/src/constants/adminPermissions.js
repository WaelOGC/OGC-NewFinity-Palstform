// backend/src/constants/adminPermissions.js

/**
 * Admin Permission Constants (DEPRECATED)
 * 
 * This file is maintained for backward compatibility only.
 * All new code should import from constants/permissions.js instead.
 * 
 * @deprecated Use constants/permissions.js as the authoritative source
 */

// Re-export from authoritative registry
import { PERMISSIONS } from './permissions.js';

// Legacy exports for backward compatibility
export const ADMIN_USERS_READ = PERMISSIONS.ADMIN_USERS_READ;
export const ADMIN_USERS_WRITE = PERMISSIONS.ADMIN_USERS_WRITE;
export const ADMIN_AUDIT_LOGS_READ = PERMISSIONS.ADMIN_AUDIT_READ; // Maps to ADMIN_AUDIT_READ
export const ADMIN_ROLES_READ = PERMISSIONS.ADMIN_ROLES_READ;

// Export all permissions as an array for easy iteration
export const ALL_ADMIN_PERMISSIONS = [
  ADMIN_USERS_READ,
  ADMIN_USERS_WRITE,
  ADMIN_AUDIT_LOGS_READ,
  ADMIN_ROLES_READ,
];

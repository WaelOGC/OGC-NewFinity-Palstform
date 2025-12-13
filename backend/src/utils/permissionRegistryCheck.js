// backend/src/utils/permissionRegistryCheck.js

/**
 * Permission Registry Parity Check
 * 
 * Development-only sanity check to ensure all permissions referenced in code
 * are defined in the authoritative permissions registry.
 * 
 * This prevents silent drift where permissions are used but not registered.
 */

import { PERMISSIONS, ALL_PERMISSIONS } from '../constants/permissions.js';
import { getRolePermissions } from '../services/rolePermissionsService.js';
import { ADMIN_MODULES } from '../config/adminModuleRegistry.js';

/**
 * Collect all permission strings referenced in the codebase
 * @returns {Set<string>} Set of all permission strings found
 */
function collectReferencedPermissions() {
  const referenced = new Set();

  // Collect from role-permission mapping (from service)
  const rolePermissions = getRolePermissions();
  Object.values(rolePermissions).forEach(perms => {
    if (Array.isArray(perms)) {
      perms.forEach(perm => referenced.add(perm));
    }
  });

  // Collect from admin module registry
  ADMIN_MODULES.forEach(module => {
    if (Array.isArray(module.permissions)) {
      module.permissions.forEach(perm => {
        // Only track actual permission strings (not role names like "ADMIN")
        if (typeof perm === 'string' && perm.startsWith('ADMIN_') || perm.startsWith('SYSTEM_')) {
          referenced.add(perm);
        }
      });
    }
  });

  return referenced;
}

/**
 * Run permission registry parity check
 * Logs warnings for any permissions referenced but not in registry
 * Only runs in development mode
 */
export function checkPermissionRegistry() {
  // Only run in development
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    const referenced = collectReferencedPermissions();
    const registered = new Set(ALL_PERMISSIONS);
    
    const unknown = [];
    referenced.forEach(perm => {
      if (!registered.has(perm)) {
        unknown.push(perm);
      }
    });

    if (unknown.length > 0) {
      console.warn('\n' + '='.repeat(60));
      console.warn('[PermissionRegistry] ⚠️  Unknown permissions referenced in code:');
      unknown.forEach(perm => {
        console.warn(`[PermissionRegistry]   - ${perm}`);
      });
      console.warn('[PermissionRegistry] Add these to backend/src/constants/permissions.js');
      console.warn('='.repeat(60) + '\n');
    } else {
      console.log('[PermissionRegistry] ✅ All referenced permissions are registered');
    }
  } catch (error) {
    // Don't crash on check failure
    console.warn('[PermissionRegistry] Failed to run parity check:', error.message);
  }
}

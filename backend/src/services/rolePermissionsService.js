// backend/src/services/rolePermissionsService.js

/**
 * Role Permissions Service
 * 
 * Manages role → permission mappings with in-memory updates.
 * 
 * NOTE: Currently uses in-memory storage. The source of truth is
 * backend/src/constants/rolePermissions.js, which is frozen.
 * 
 * For persistence:
 * - If a role_definition table exists, updates should be persisted there
 * - If config-based, consider file-based persistence or environment variable overrides
 * - This is a placeholder for future persistence implementation
 * 
 * For now, updates are in-memory only and will be lost on server restart.
 * This is acceptable for Phase B2 as it focuses on validation and safety rules.
 */

import { ROLE_PERMISSIONS } from '../constants/rolePermissions.js';
import { PERMISSIONS, ALL_PERMISSIONS } from '../constants/permissions.js';
import { CRITICAL_PERMISSIONS } from '../constants/criticalPermissions.js';

// Mutable copy of role permissions (updated at runtime)
// Initialized from frozen ROLE_PERMISSIONS
let mutableRolePermissions = {};

// Initialize mutable copy from frozen source
function initializeMutableCopy() {
  Object.keys(ROLE_PERMISSIONS).forEach(role => {
    const perms = ROLE_PERMISSIONS[role];
    if (perms === null) {
      mutableRolePermissions[role] = null;
    } else {
      mutableRolePermissions[role] = [...perms];
    }
  });
}

// Initialize on module load
initializeMutableCopy();

/**
 * Get current role permissions (from mutable copy)
 * @returns {Object} Current role permissions mapping
 */
export function getRolePermissions() {
  return { ...mutableRolePermissions };
}

/**
 * Get permissions for a specific role
 * @param {string} roleName - Role name (lowercase)
 * @returns {string[]|null} Array of permissions or null for founder
 */
export function getRolePermissionsForRole(roleName) {
  const roleLower = (roleName || '').toLowerCase();
  const perms = mutableRolePermissions[roleLower];
  if (perms === null) {
    return null;
  }
  return perms ? [...perms] : [];
}

/**
 * Check if a role exists
 * @param {string} roleName - Role name
 * @returns {boolean} True if role exists
 */
export function roleExists(roleName) {
  const roleLower = (roleName || '').toLowerCase();
  return roleLower in mutableRolePermissions;
}

/**
 * Validate that critical permissions are still covered
 * @param {Object} proposedPermissions - Proposed role permissions mapping
 * @returns {{ ok: boolean, code?: string, reason?: string, missingPermissions?: string[] }}
 */
export function validateCriticalPermissions(proposedPermissions) {
  // Collect all permissions from all roles
  const allPermissions = new Set();
  
  Object.values(proposedPermissions).forEach(perms => {
    if (perms === null) {
      // Founder has all permissions, so all critical permissions are covered
      CRITICAL_PERMISSIONS.forEach(perm => allPermissions.add(perm));
    } else if (Array.isArray(perms)) {
      perms.forEach(perm => allPermissions.add(perm));
    }
  });

  // Check if all critical permissions are present
  const missing = CRITICAL_PERMISSIONS.filter(perm => !allPermissions.has(perm));
  
  if (missing.length > 0) {
    return {
      ok: false,
      code: 'CRITICAL_PERMISSION_REMOVAL_BLOCKED',
      reason: 'Critical permissions must exist in at least one role',
      missingPermissions: missing,
    };
  }

  return { ok: true };
}

/**
 * Validate permissions array
 * @param {string[]} permissions - Array of permission strings
 * @returns {{ ok: boolean, code?: string, reason?: string, invalidPermissions?: string[] }}
 */
export function validatePermissions(permissions) {
  if (!Array.isArray(permissions)) {
    return {
      ok: false,
      code: 'INVALID_PERMISSION',
      reason: 'Permissions must be an array',
    };
  }

  // Check for duplicates
  const unique = new Set(permissions);
  if (unique.size !== permissions.length) {
    return {
      ok: false,
      code: 'INVALID_PERMISSION',
      reason: 'Duplicate permissions are not allowed',
    };
  }

  // Check all permissions are valid
  const validPermissions = new Set(ALL_PERMISSIONS);
  const invalid = permissions.filter(perm => !validPermissions.has(perm));
  
  if (invalid.length > 0) {
    return {
      ok: false,
      code: 'INVALID_PERMISSION',
      reason: 'Invalid permission strings',
      invalidPermissions: invalid,
    };
  }

  return { ok: true };
}

/**
 * Update role permissions
 * @param {string} roleName - Role name
 * @param {string[]} permissions - Array of permission strings
 * @returns {{ ok: boolean, code?: string, reason?: string }}
 */
export function updateRolePermissions(roleName, permissions) {
  const roleLower = (roleName || '').toLowerCase();

  // Check role exists
  if (!roleExists(roleLower)) {
    return {
      ok: false,
      code: 'ROLE_NOT_FOUND',
      reason: `Role '${roleName}' does not exist`,
    };
  }

  // Founder role cannot be edited
  if (roleLower === 'founder') {
    return {
      ok: false,
      code: 'FOUNDER_ONLY',
      reason: 'Founder role cannot be edited',
    };
  }

  // Validate permissions
  const validation = validatePermissions(permissions);
  if (!validation.ok) {
    return validation;
  }

  // Create proposed permissions map
  const proposedPermissions = { ...mutableRolePermissions };
  proposedPermissions[roleLower] = permissions;

  // Validate critical permissions
  const criticalValidation = validateCriticalPermissions(proposedPermissions);
  if (!criticalValidation.ok) {
    return criticalValidation;
  }

  // Update mutable copy
  mutableRolePermissions[roleLower] = [...permissions];

  // TODO (C): log ADMIN_ROLE_DEFINITION_CHANGE audit event

  return { ok: true };
}

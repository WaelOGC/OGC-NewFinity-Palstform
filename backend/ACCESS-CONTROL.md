# Access Control System

## Overview

The OGC NewFinity Platform uses a role-based and permission-based access control system. This document describes how roles, permissions, and access control work.

## Roles

The system defines the following roles:

- **FOUNDER**: The first user registered. Has all permissions implicitly (no explicit permission list needed).
- **CORE_TEAM**: Core team members with extensive permissions.
- **ADMIN**: Administrators with user management and content moderation permissions.
- **MODERATOR**: Content moderators with limited permissions.
- **CREATOR**: Content creators with token creation and publishing permissions.
- **STANDARD_USER**: Regular users with basic permissions (publish content, comment).
- **SUSPENDED**: Suspended users with no permissions.
- **BANNED**: Banned users with no permissions.

## Default Role Assignment

- **First user** (when database is empty): Automatically assigned `FOUNDER` role.
- **All subsequent users**: Assigned `STANDARD_USER` role by default.

## Permissions

Permissions are defined in `backend/src/config/rolePermissions.js`. Each role (except FOUNDER) has a default set of permissions.

### Key Permissions

- `VIEW_ADMIN_DASHBOARD`: Access to admin console
- `MANAGE_USERS`: Manage user accounts, roles, and status
- `MANAGE_ROLES`: Manage role assignments
- `MANAGE_CONTENT`: Moderate and manage content
- `MANAGE_TOKENS`: Manage token creation and distribution
- `VIEW_FINANCIAL_REPORTS`: Access financial reports
- `MANAGE_PLATFORM_SETTINGS`: Change platform-wide settings
- `USE_INTERNAL_TOOLS`: Access internal development tools
- `MANAGE_FEATURE_FLAGS`: Enable/disable features
- `VIEW_AUDIT_LOGS`: View system audit logs
- `EXPORT_USER_DATA`: Export user account data
- `MANAGE_INTEGRATIONS`: Manage third-party integrations
- `CREATE_TOKENS`: Create new tokens
- `PUBLISH_CONTENT`: Publish content
- `COMMENT_ON_CONTENT`: Comment on content

## How Permissions Work

1. **FOUNDER Role**: Has all permissions implicitly. `effectivePermissions` is `null`, which means "all permissions".

2. **Other Roles**: 
   - If a user has custom `permissions` set in the database, those are used.
   - Otherwise, default permissions for the user's role are used.
   - The `getEffectivePermissions()` function computes the final permission list.

3. **Permission Checking**:
   - `hasPermission(user, permission)`: Check if user has a specific permission
   - `hasAnyPermission(user, permissions)`: Check if user has at least one of the specified permissions

## Backend Access Control

### Middleware

Access control middleware is in `backend/src/middleware/accessControl.js`:

- `requireRole(requiredRole)`: Require a specific role
- `requireAnyRole(roles)`: Require at least one of the specified roles
- `requirePermission(permission)`: Require a specific permission
- `requireAnyPermission(permissions)`: Require at least one of the specified permissions

### Usage Example

```javascript
import { requireRole, requireAnyPermission } from '../middleware/accessControl.js';

// Require ADMIN role
router.get('/admin/dashboard', requireAuth, requireRole('ADMIN'), dashboardController);

// Require admin permission (role OR permission)
router.get('/admin/users', requireAuth, requireAnyPermission(['VIEW_ADMIN_DASHBOARD', 'MANAGE_USERS']), listUsersController);
```

### Admin Routes

All routes in `backend/src/routes/admin.routes.js` are protected by:
- Authentication (via `requireAuth`)
- Admin-level access (admin role OR admin permission)

## Frontend Access Control

### AuthContext Helpers

The `AuthContext` provides helper functions:

- `hasRole(requiredRole)`: Check if user has a specific role
- `hasAnyRole(roles)`: Check if user has at least one of the specified roles
- `hasPermission(permission)`: Check if user has a specific permission
- `hasAnyPermission(permissions)`: Check if user has at least one of the specified permissions

### Usage Example

```javascript
import { useAuth } from '../context/AuthContext.jsx';

function MyComponent() {
  const { user, hasRole, hasAnyPermission } = useAuth();
  
  // Show admin link only if user has admin role or permission
  if (hasRole('ADMIN') || hasAnyPermission(['VIEW_ADMIN_DASHBOARD'])) {
    return <NavLink to="/admin">Admin</NavLink>;
  }
  
  return null;
}
```

## User Data Structure

When a user is fetched via `/auth/me`, the response includes:

```json
{
  "status": "OK",
  "code": "CURRENT_USER_PROFILE",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "STANDARD_USER",
      "permissions": null,
      "effectivePermissions": ["PUBLISH_CONTENT", "COMMENT_ON_CONTENT"],
      "featureFlags": { ... },
      "accountStatus": "ACTIVE",
      "lastLoginAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

- `role`: User's role (e.g., "STANDARD_USER", "ADMIN", "FOUNDER")
- `permissions`: Raw permissions from database (may be `null` if using role defaults)
- `effectivePermissions`: Computed permissions array (or `null` for FOUNDER = all permissions)
- `featureFlags`: Merged feature flags (user flags + system defaults)

## Notes

- FOUNDER role always has all permissions (no need to check individual permissions)
- Custom permissions override role defaults if set
- Empty permissions array means no permissions
- `null` effectivePermissions means "all permissions" (FOUNDER only)

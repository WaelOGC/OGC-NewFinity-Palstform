# Account System Expansion (Phase 4: Roles, Access Levels & Feature Flags) - Specification

**Date:** 2024  
**Status:** 📋 Planning / Specification  
**Version:** Phase 4  
**Type:** Planning Document (No Implementation Yet)

## Executive Summary

This document defines Phase 4 of the Account System Expansion for the OGC NewFinity Platform. Phase 4 transforms user accounts into full platform identities by introducing a comprehensive role-based access control (RBAC) system, permissions management, and feature flags. This phase establishes the foundation for platform governance, administrative capabilities, and controlled feature rollouts.

**Important:** This is a planning and specification document. No implementation work will begin until this specification is approved and a separate implementation task is created.

---

## 1. Overview

### Purpose

Phase 4 extends the account system to support:
- **Role-based identity:** Users are assigned roles that define their relationship to the platform
- **Granular permissions:** Fine-grained control over what actions users can perform
- **Feature flags:** Enable/disable features per user or user group for controlled rollouts
- **Account flags:** Boolean attributes that unlock platform capabilities

This phase builds upon:
- **Phase 1:** Profile & core account fields
- **Phase 2:** Security, activity log, devices
- **Phase 3:** Full TOTP-based 2FA

### Scope

**In Scope:**
- Database schema design for roles, permissions, and flags
- Backend middleware patterns for access control
- API endpoint protection patterns (design only, no implementation)
- UI display of roles and badges (read-only)
- Migration strategy for existing users

**Out of Scope:**
- Admin UI for managing roles/permissions (future "Admin Console" phase)
- Role assignment workflows
- Permission inheritance or role hierarchies
- Dynamic permission evaluation at runtime
- Actual implementation of protected endpoints

---

## 2. Role Model

The platform will support the following roles, ordered from highest to lowest access level:

### FOUNDER

**Typical User:** Platform founders and original creators

**Responsibilities:**
- Ultimate platform authority
- Full system access
- Platform direction and governance
- Can assign any role to any user

**Access Level:** Highest

**Notes:**
- Extremely limited assignment (typically 1-3 users)
- All permissions granted implicitly
- Cannot be revoked except by another FOUNDER
- All actions should be audited

---

### CORE_TEAM

**Typical User:** Core development team members, senior leadership

**Responsibilities:**
- Platform development and maintenance
- Access to internal tools and systems
- Can manage most platform operations
- Can assign roles up to MODERATOR level

**Access Level:** Very High

**Notes:**
- Limited to trusted team members
- Should have 2FA enabled (enforced in future)
- Can access financial and operational dashboards
- Cannot assign FOUNDER or CORE_TEAM roles

---

### ADMIN

**Typical User:** Platform administrators, operations staff

**Responsibilities:**
- User management (suspend, ban, modify profiles)
- Content moderation
- Platform configuration
- Access to admin dashboards

**Access Level:** High

**Notes:**
- Can manage STANDARD_USER and CREATOR accounts
- Cannot modify CORE_TEAM or FOUNDER accounts
- Should have 2FA enabled (enforced in future)
- All actions logged in UserActivityLog

---

### MODERATOR

**Typical User:** Community moderators, content reviewers

**Responsibilities:**
- Content moderation (flag, remove, review)
- User warnings and temporary restrictions
- Community guidelines enforcement
- Limited user management (cannot ban)

**Access Level:** Medium-High

**Notes:**
- Cannot suspend or ban users (only warn)
- Cannot modify user roles
- Can access moderation tools and dashboards
- Focused on content and community management

---

### CREATOR

**Typical User:** Content creators, token creators, verified creators

**Responsibilities:**
- Create and manage content
- Launch tokens or projects
- Access creator-specific features
- Enhanced profile visibility

**Access Level:** Medium

**Notes:**
- Elevated from STANDARD_USER for verified creators
- May have access to creator dashboard
- Cannot manage other users
- May have special badges or UI elements

---

### STANDARD_USER

**Typical User:** Regular platform users, default role

**Responsibilities:**
- Use platform features
- Create content (if allowed by feature flags)
- Manage own profile and settings
- Participate in community

**Access Level:** Low

**Notes:**
- Default role for all new users
- All existing users will be migrated to this role
- Can be upgraded to CREATOR or downgraded to SUSPENDED/BANNED
- No special permissions beyond basic platform access

---

### SUSPENDED

**Typical User:** Users temporarily restricted from platform access

**Responsibilities:**
- None (account is restricted)

**Access Level:** None (Restricted)

**Notes:**
- Account is temporarily disabled
- User cannot log in
- Profile may be hidden or marked as suspended
- Can be restored to STANDARD_USER by ADMIN or higher
- Suspension reason and duration should be tracked

---

### BANNED

**Typical User:** Users permanently removed from platform

**Responsibilities:**
- None (account is permanently disabled)

**Access Level:** None (Permanently Restricted)

**Notes:**
- Account is permanently disabled
- User cannot log in
- Profile is hidden or marked as banned
- Cannot be restored (requires manual intervention)
- Ban reason should be tracked in activity log

---

## 3. Permissions Model

### Permission Definitions

Permissions are string constants that represent specific capabilities. The following permissions are planned:

| Permission | Description | Typical Roles |
|------------|-------------|---------------|
| `MANAGE_USERS` | Create, update, suspend, ban users | ADMIN, CORE_TEAM, FOUNDER |
| `MANAGE_ROLES` | Assign roles to users | ADMIN, CORE_TEAM, FOUNDER |
| `MANAGE_CONTENT` | Moderate, remove, review content | MODERATOR, ADMIN, CORE_TEAM, FOUNDER |
| `MANAGE_TOKENS` | Create, modify, manage platform tokens | CORE_TEAM, FOUNDER |
| `VIEW_ADMIN_DASHBOARD` | Access admin dashboard and analytics | ADMIN, CORE_TEAM, FOUNDER |
| `VIEW_FINANCIAL_REPORTS` | Access financial data and reports | CORE_TEAM, FOUNDER |
| `MANAGE_PLATFORM_SETTINGS` | Modify platform-wide configuration | CORE_TEAM, FOUNDER |
| `USE_INTERNAL_TOOLS` | Access internal development/debugging tools | CORE_TEAM, FOUNDER |
| `MANAGE_FEATURE_FLAGS` | Enable/disable feature flags for users | CORE_TEAM, FOUNDER |
| `VIEW_AUDIT_LOGS` | Access comprehensive audit logs | ADMIN, CORE_TEAM, FOUNDER |
| `EXPORT_USER_DATA` | Export user data (GDPR compliance) | ADMIN, CORE_TEAM, FOUNDER |
| `MANAGE_INTEGRATIONS` | Configure third-party integrations | CORE_TEAM, FOUNDER |
| `CREATE_TOKENS` | Create new tokens (creator feature) | CREATOR, ADMIN, CORE_TEAM, FOUNDER |
| `PUBLISH_CONTENT` | Publish public content | STANDARD_USER, CREATOR, MODERATOR, ADMIN, CORE_TEAM, FOUNDER |
| `COMMENT_ON_CONTENT` | Comment on public content | STANDARD_USER, CREATOR, MODERATOR, ADMIN, CORE_TEAM, FOUNDER |

### Role → Permissions Mapping

| Role | Permissions (Default Set) |
|------|---------------------------|
| **FOUNDER** | All permissions (implicit, no explicit list needed) |
| **CORE_TEAM** | `MANAGE_USERS`, `MANAGE_ROLES`, `MANAGE_CONTENT`, `MANAGE_TOKENS`, `VIEW_ADMIN_DASHBOARD`, `VIEW_FINANCIAL_REPORTS`, `MANAGE_PLATFORM_SETTINGS`, `USE_INTERNAL_TOOLS`, `MANAGE_FEATURE_FLAGS`, `VIEW_AUDIT_LOGS`, `EXPORT_USER_DATA`, `MANAGE_INTEGRATIONS`, `CREATE_TOKENS`, `PUBLISH_CONTENT`, `COMMENT_ON_CONTENT` |
| **ADMIN** | `MANAGE_USERS`, `MANAGE_CONTENT`, `VIEW_ADMIN_DASHBOARD`, `VIEW_AUDIT_LOGS`, `EXPORT_USER_DATA`, `PUBLISH_CONTENT`, `COMMENT_ON_CONTENT` |
| **MODERATOR** | `MANAGE_CONTENT`, `PUBLISH_CONTENT`, `COMMENT_ON_CONTENT` |
| **CREATOR** | `CREATE_TOKENS`, `PUBLISH_CONTENT`, `COMMENT_ON_CONTENT` |
| **STANDARD_USER** | `PUBLISH_CONTENT`, `COMMENT_ON_CONTENT` |
| **SUSPENDED** | None |
| **BANNED** | None |

### Permission Storage

**Design Decision:** Permissions can be stored in one of two ways:

1. **JSON Array (Recommended for Phase 4):**
   - Store as JSON array in `users.permissions` column
   - Example: `["MANAGE_USERS", "MANAGE_CONTENT"]`
   - Flexible and easy to query/modify
   - Allows per-user permission overrides

2. **Bitmask (Future Consideration):**
   - More efficient storage
   - Faster permission checks
   - Less flexible for custom permissions
   - Requires permission-to-bit mapping

**Phase 4 Approach:** Use JSON array for flexibility. Migration to bitmask can be considered in future if performance becomes an issue.

**Default Behavior:** If `permissions` is NULL, use the default permission set for the user's role. If `permissions` is an empty array `[]`, user has no permissions (even if role would normally grant some).

---

## 4. Account Flags and Feature Flags

### Account Flags (Boolean Attributes)

Account flags are simple boolean attributes stored directly on the user record. They represent permanent or semi-permanent account attributes:

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `isEarlyAccess` | BOOLEAN | `false` | User has early access to new features |
| `isBetaTester` | BOOLEAN | `false` | User is part of beta testing program |
| `isKycVerified` | BOOLEAN | `false` | User has completed KYC verification (future) |
| `isEmailVerified` | BOOLEAN | `false` | User has verified email address |
| `isPhoneVerified` | BOOLEAN | `false` | User has verified phone number |
| `isCreatorVerified` | BOOLEAN | `false` | Creator account is verified |
| `isPartner` | BOOLEAN | `false` | User is a platform partner |
| `isAmbassador` | BOOLEAN | `false` | User is a platform ambassador |

**Storage:** These flags will be added as columns to the `users` table.

**Usage:** Flags can be checked in middleware or business logic to grant access to features or display badges.

---

### Feature Flags (JSON Object)

Feature flags are stored as a JSON object in `users.featureFlags`. They enable gradual feature rollouts and A/B testing:

**Example Structure:**
```json
{
  "walletV2": true,
  "amyAgentBeta": false,
  "challengeProgramDashboard": true,
  "newCreatorTools": false,
  "advancedAnalytics": true,
  "socialTrading": false
}
```

**Planned Feature Flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `walletV2` | Enable new wallet interface | `false` |
| `amyAgentBeta` | Access to Amy AI agent beta | `false` |
| `challengeProgramDashboard` | Access to challenge program dashboard | `false` |
| `newCreatorTools` | Access to new creator toolset | `false` |
| `advancedAnalytics` | Access to advanced analytics features | `false` |
| `socialTrading` | Access to social trading features | `false` |
| `experimentalUI` | Access to experimental UI components | `false` |
| `apiV2Access` | Access to API v2 endpoints | `false` |

**Storage:** Single JSON column `users.featureFlags` (nullable).

**Default Behavior:** If `featureFlags` is NULL, all flags are considered `false`. If a flag is not present in the JSON object, it defaults to `false`.

**Usage:** Feature flags are checked in frontend and backend to conditionally enable features:
```javascript
// Backend example
if (user.featureFlags?.walletV2 === true) {
  // Enable wallet V2 features
}

// Frontend example
{user.featureFlags?.amyAgentBeta && <AmyAgentComponent />}
```

---

### Flags vs Roles vs Permissions

**Roles:**
- Define user's relationship to platform
- Hierarchical (FOUNDER > CORE_TEAM > ADMIN > ...)
- Typically assigned manually
- Change infrequently

**Permissions:**
- Define specific capabilities
- Granular control
- Can override role defaults
- Assigned based on role (or manually)

**Account Flags:**
- Boolean attributes about the account
- Independent of role
- Can be set/cleared independently
- Used for verification status, program participation

**Feature Flags:**
- Control access to experimental features
- Enable gradual rollouts
- Can be set per user or per role
- Temporary (features eventually become default)

---

## 5. Database Design Plan

### Users Table - New Columns

The following columns will be added to the `users` table:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `role` | VARCHAR(50) | NO | `'STANDARD_USER'` | User role (enum-like) |
| `permissions` | JSON | YES | `NULL` | Custom permissions array (overrides role defaults) |
| `featureFlags` | JSON | YES | `NULL` | Feature flags object |
| `isEarlyAccess` | BOOLEAN | NO | `false` | Early access flag |
| `isBetaTester` | BOOLEAN | NO | `false` | Beta tester flag |
| `isKycVerified` | BOOLEAN | NO | `false` | KYC verification flag |
| `isEmailVerified` | BOOLEAN | NO | `false` | Email verification flag |
| `isPhoneVerified` | BOOLEAN | NO | `false` | Phone verification flag |
| `isCreatorVerified` | BOOLEAN | NO | `false` | Creator verification flag |
| `isPartner` | BOOLEAN | NO | `false` | Partner flag |
| `isAmbassador` | BOOLEAN | NO | `false` | Ambassador flag |

**Note:** Some flags (like `isEmailVerified`) may already exist in the users table. The migration script should check for existing columns before adding them.

### Role Validation

**Valid Role Values:**
- `FOUNDER`
- `CORE_TEAM`
- `ADMIN`
- `MODERATOR`
- `CREATOR`
- `STANDARD_USER`
- `SUSPENDED`
- `BANNED`

**Database Constraint:** Consider adding a CHECK constraint or ENUM type to enforce valid role values. Alternatively, validation can be handled at the application level.

### Permissions JSON Structure

**Example:**
```json
["MANAGE_USERS", "MANAGE_CONTENT", "VIEW_ADMIN_DASHBOARD"]
```

**Validation:**
- Must be a JSON array
- Array elements must be strings
- Empty array `[]` means no permissions (even if role grants defaults)
- NULL means use role defaults

### Feature Flags JSON Structure

**Example:**
```json
{
  "walletV2": true,
  "amyAgentBeta": false,
  "challengeProgramDashboard": true
}
```

**Validation:**
- Must be a JSON object
- Values must be booleans
- NULL means all flags are false
- Missing keys default to false

---

### Migration Strategy

**Migration File:** `backend/sql/account-system-phase4-roles-migration.sql`

**Migration Steps:**

1. **Add new columns to users table:**
   - Check for existing columns before adding (safe migration)
   - Add `role` column with default `'STANDARD_USER'`
   - Add `permissions` column (JSON, nullable)
   - Add `featureFlags` column (JSON, nullable)
   - Add all boolean flag columns with default `false`

2. **Set default role for existing users:**
   ```sql
   UPDATE users SET role = 'STANDARD_USER' WHERE role IS NULL;
   ```

3. **Initialize feature flags (optional):**
   - Can be left as NULL (defaults to all false)
   - Or initialize with empty object `{}`

4. **No destructive changes:**
   - All existing users remain functional
   - All existing data preserved
   - Backward compatible with existing code

5. **Index considerations:**
   - Consider adding index on `role` column for role-based queries
   - JSON columns typically don't need indexes (unless using JSON-specific indexes)

**Rollback Plan:**
- Migration should be reversible
- Can drop new columns if needed (after ensuring no code depends on them)
- Existing users will continue to work with default role

---

## 6. Backend Access Control Plan

### Middleware Patterns

The following middleware functions will be created (design only, implementation in future task):

#### `requireRole(role)`
**Purpose:** Ensure user has a specific role

**Usage:**
```javascript
router.get('/admin/users', requireRole('ADMIN'), getUsersHandler);
```

**Behavior:**
- Checks `req.user.role === role`
- Returns 403 if role doesn't match
- Can be chained with other middleware

#### `requireAnyRole(roles[])`
**Purpose:** Ensure user has one of the specified roles

**Usage:**
```javascript
router.get('/moderation', requireAnyRole(['MODERATOR', 'ADMIN', 'CORE_TEAM']), getModerationHandler);
```

**Behavior:**
- Checks if `req.user.role` is in the `roles` array
- Returns 403 if no match
- Useful for endpoints accessible by multiple role levels

#### `requirePermission(permission)`
**Purpose:** Ensure user has a specific permission

**Usage:**
```javascript
router.post('/users/:id/suspend', requirePermission('MANAGE_USERS'), suspendUserHandler);
```

**Behavior:**
- Checks if user has permission in `req.user.permissions` array
- If `permissions` is NULL, uses default permissions for user's role
- Returns 403 if permission not found
- FOUNDER role bypasses permission checks (has all permissions implicitly)

#### `requireFeatureFlag(flag)`
**Purpose:** Ensure user has a specific feature flag enabled

**Usage:**
```javascript
router.get('/wallet/v2', requireFeatureFlag('walletV2'), getWalletV2Handler);
```

**Behavior:**
- Checks if `req.user.featureFlags?.[flag] === true`
- Returns 403 if flag is false or missing
- Useful for gradual feature rollouts

#### `requireAccountFlag(flag)`
**Purpose:** Ensure user has a specific account flag enabled

**Usage:**
```javascript
router.get('/beta/dashboard', requireAccountFlag('isBetaTester'), getBetaDashboardHandler);
```

**Behavior:**
- Checks if `req.user[flag] === true`
- Returns 403 if flag is false
- Useful for program-based access

### Middleware Composition

Middleware can be composed:
```javascript
router.post(
  '/admin/users/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  requirePermission('MANAGE_ROLES'),
  updateUserRoleHandler
);
```

### User Object Enhancement

The authenticated user object (`req.user`) will be enhanced to include:
- `role`: User's role string
- `permissions`: Array of permissions (or NULL)
- `featureFlags`: Object of feature flags (or NULL)
- All account flags as boolean properties

**Example `req.user` object:**
```javascript
{
  id: 1,
  email: "user@example.com",
  role: "ADMIN",
  permissions: ["MANAGE_USERS", "MANAGE_CONTENT", "VIEW_ADMIN_DASHBOARD"],
  featureFlags: {
    walletV2: true,
    amyAgentBeta: false
  },
  isEarlyAccess: true,
  isBetaTester: false,
  // ... other user fields
}
```

---

### Key API Areas for Future Protection

The following API areas will be protected in future implementation (not in this spec phase):

#### Admin / Internal Dashboards
- `GET /api/v1/admin/*` - All admin endpoints
- `GET /api/v1/internal/*` - Internal tools
- `POST /api/v1/admin/users/*` - User management
- `GET /api/v1/admin/analytics` - Analytics dashboards

**Protection:** `requireRole('ADMIN')` or higher

#### Token / Finance Dashboards
- `GET /api/v1/finance/*` - Financial data
- `GET /api/v1/tokens/manage` - Token management
- `POST /api/v1/tokens/create` - Token creation

**Protection:** `requirePermission('MANAGE_TOKENS')` or `requirePermission('CREATE_TOKENS')`

#### Sensitive Configuration Endpoints
- `PUT /api/v1/platform/settings` - Platform settings
- `GET /api/v1/platform/audit-logs` - Audit logs
- `POST /api/v1/feature-flags/*` - Feature flag management

**Protection:** `requireRole('CORE_TEAM')` or `requirePermission('MANAGE_PLATFORM_SETTINGS')`

#### Content Moderation
- `POST /api/v1/content/moderate` - Content moderation
- `DELETE /api/v1/content/:id` - Content removal
- `POST /api/v1/users/:id/warn` - User warnings

**Protection:** `requireAnyRole(['MODERATOR', 'ADMIN', 'CORE_TEAM'])` or `requirePermission('MANAGE_CONTENT')`

#### Feature-Gated Endpoints
- `GET /api/v1/wallet/v2/*` - Wallet V2 (if `walletV2` flag required)
- `GET /api/v1/amy-agent/*` - Amy Agent (if `amyAgentBeta` flag required)

**Protection:** `requireFeatureFlag('walletV2')` etc.

---

### Important Note

**No endpoints will be changed in this specification phase.** The middleware patterns and protection strategies described above are design-only. Actual implementation of protected endpoints will occur in a future implementation task, after this specification is approved.

---

## 7. UI / UX Impact

### Role Badges in Dashboard

Users will see role-based badges in their dashboard and profile:

**Badge Display:**
- **FOUNDER:** "Founder" badge (gold/premium styling)
- **CORE_TEAM:** "Core Team" badge (blue/professional styling)
- **ADMIN:** "Admin" badge (red/authority styling)
- **MODERATOR:** "Moderator" badge (orange/community styling)
- **CREATOR:** "Creator" badge (purple/creative styling)
- **STANDARD_USER:** No badge (or subtle "Member" badge)
- **SUSPENDED:** "Suspended" badge (gray/warning styling)
- **BANNED:** "Banned" badge (red/error styling)

**Location:**
- Dashboard header/navbar
- Profile page
- User card components (if applicable)

**Implementation:** Badges will be read-only display elements. No UI for editing roles will be created in Phase 4.

---

### Account Flag Badges

Account flags may also display as badges:

- **isEarlyAccess:** "Early Access" badge
- **isBetaTester:** "Beta Tester" badge
- **isKycVerified:** "Verified" badge (checkmark icon)
- **isCreatorVerified:** "Verified Creator" badge
- **isPartner:** "Partner" badge
- **isAmbassador:** "Ambassador" badge

**Styling:** These badges should be visually distinct from role badges (smaller, different color scheme).

---

### Feature Flag Indicators

Feature flags typically won't display as badges, but may affect UI:

- **walletV2:** Shows new wallet interface instead of old one
- **amyAgentBeta:** Shows "Amy Agent" menu item or section
- **challengeProgramDashboard:** Shows challenge program section in dashboard
- **experimentalUI:** Enables experimental UI components

**Implementation:** Feature flags control what UI elements are rendered, not what badges are shown.

---

### Profile Page Updates

The Profile page (`frontend/src/pages/dashboard/Profile.jsx`) may be updated to show:

- Role badge (read-only)
- Account flag badges (read-only)
- Feature flags status (read-only, for transparency)

**Note:** No editing UI for roles/flags will be added. That will be part of a future "Admin Console" phase.

---

### Admin UI (Future Phase)

A future "Admin Console" phase will include:
- UI for viewing all users and their roles
- UI for assigning/removing roles
- UI for managing permissions (overrides)
- UI for setting feature flags
- UI for setting account flags
- Audit log viewer for role/permission changes

**This is explicitly out of scope for Phase 4.**

---

## 8. Security and Governance Notes

### Role Assignment Risks

**Critical Risks:**
1. **FOUNDER and CORE_TEAM roles are extremely powerful**
   - Only trusted individuals should ever receive these roles
   - Assignment should require manual approval and documentation
   - Consider requiring multiple FOUNDER approvals for CORE_TEAM assignments

2. **ADMIN role grants user management capabilities**
   - ADMINS can suspend/ban users
   - ADMINS can modify user profiles
   - Should require 2FA (enforced in future)
   - All actions should be logged

3. **Role escalation attacks**
   - Users should never be able to self-assign roles
   - Role changes must be audited
   - Consider requiring higher-level role approval for role changes

### Permission Override Risks

**Risks:**
1. **Custom permissions can bypass role restrictions**
   - If a user has custom `permissions` array, it overrides role defaults
   - Only trusted roles (ADMIN+) should be able to set custom permissions
   - Permission changes should be logged

2. **Empty permissions array removes all access**
   - Setting `permissions: []` removes all permissions, even if role grants defaults
   - Use with caution (e.g., for temporary restrictions)

### Audit Logging Requirements

**All role/permission changes must be logged in UserActivityLog:**

**New Activity Types:**
- `ROLE_ASSIGNED` - User role was assigned/changed
- `ROLE_REVOKED` - User role was removed/changed
- `PERMISSIONS_MODIFIED` - User permissions were modified
- `FEATURE_FLAGS_MODIFIED` - User feature flags were modified
- `ACCOUNT_FLAG_SET` - Account flag was set
- `ACCOUNT_FLAG_CLEARED` - Account flag was cleared

**Log Metadata Should Include:**
- Previous role/permission/flag value
- New role/permission/flag value
- Changed by (user ID who made the change)
- Reason (optional, for administrative changes)

### 2FA Enforcement (Future)

**Planned Enforcement:**
- CORE_TEAM, ADMIN, MODERATOR roles should require 2FA
- Consider blocking role assignment if user doesn't have 2FA enabled
- Or require 2FA setup within 24 hours of role assignment

**Note:** This enforcement will be implemented in a future phase, not Phase 4.

### Suspension and Banning

**SUSPENDED Role:**
- User cannot log in
- Profile may be hidden or marked
- Can be restored by ADMIN+
- Suspension reason and duration should be tracked

**BANNED Role:**
- User cannot log in
- Profile is hidden
- Cannot be restored (requires manual database intervention)
- Ban reason should be logged

**Implementation:** Suspension/banning logic will be implemented in a future phase. Phase 4 only defines the role structure.

---

## 9. Implementation Roadmap

This specification document serves as the blueprint for Phase 4 implementation. The actual implementation will be broken down into the following steps:

### Step 1: Database Migration

**Task:** Create and run migration script

**Deliverables:**
- `backend/sql/account-system-phase4-roles-migration.sql`
- Migration adds all new columns to `users` table
- Sets default role `STANDARD_USER` for all existing users
- No data loss, fully reversible

**Dependencies:** None

**Estimated Effort:** Low (1-2 hours)

---

### Step 2: Backend Access Control Middleware

**Task:** Implement middleware functions

**Deliverables:**
- `backend/src/middleware/accessControl.js` (new file)
- Functions: `requireRole()`, `requireAnyRole()`, `requirePermission()`, `requireFeatureFlag()`, `requireAccountFlag()`
- Integration with existing `requireAuth` middleware
- User object enhancement to include role/permissions/flags

**Dependencies:** Step 1 (database migration)

**Estimated Effort:** Medium (4-6 hours)

---

### Step 3: Minimal UI Surfacing

**Task:** Display roles and badges in frontend

**Deliverables:**
- Update `frontend/src/pages/dashboard/Profile.jsx` to show role badge
- Update dashboard header/navbar to show role badge
- Create badge component (if needed)
- Read-only display (no editing)

**Dependencies:** Step 1, Step 2 (to fetch role from API)

**Estimated Effort:** Low-Medium (2-4 hours)

---

### Step 4: Admin APIs for Managing Roles (No UI)

**Task:** Create API endpoints for role/permission management

**Deliverables:**
- `POST /api/v1/admin/users/:id/role` - Assign role
- `PUT /api/v1/admin/users/:id/permissions` - Set permissions
- `PUT /api/v1/admin/users/:id/feature-flags` - Set feature flags
- `PUT /api/v1/admin/users/:id/account-flags` - Set account flags
- All endpoints protected with `requireRole('ADMIN')` or higher
- All changes logged in UserActivityLog

**Dependencies:** Step 1, Step 2

**Estimated Effort:** Medium (4-6 hours)

---

### Step 5: Service Layer Updates

**Task:** Update userService to handle roles/permissions

**Deliverables:**
- Update `getUserProfile()` to include role/permissions/flags
- Add functions: `updateUserRole()`, `updateUserPermissions()`, `updateUserFeatureFlags()`, `updateAccountFlag()`
- Integration with UserActivityLog for audit trail

**Dependencies:** Step 1

**Estimated Effort:** Medium (3-4 hours)

---

### Step 6: Testing and Documentation

**Task:** Test all functionality and update documentation

**Deliverables:**
- Unit tests for middleware
- Integration tests for role/permission checks
- API documentation updates
- Update this specification with implementation notes

**Dependencies:** All previous steps

**Estimated Effort:** Medium (4-6 hours)

---

### Future Steps (Post-Phase 4)

1. **Admin Console UI** - Full UI for managing roles/permissions
2. **Role Assignment Workflows** - Automated workflows for role requests
3. **2FA Enforcement** - Require 2FA for elevated roles
4. **Permission Inheritance** - Role hierarchies and permission inheritance
5. **Dynamic Permission Evaluation** - Runtime permission checks based on context
6. **Feature Flag Management UI** - UI for managing feature flags at scale

---

## 10. References and Dependencies

### Related Documents

- **Phase 1 Report:** `docs/internal/account-system-phase1-implementation-report.md`
- **Phase 2 Report:** `docs/internal/account-system-phase2-security-implementation-report.md`
- **Phase 3 Report:** `docs/internal/account-system-phase3-2fa-implementation-report.md`
- **Authentication Spec:** `docs/04-backend/70-backend-authentication-and-token-lifecycle-specification.md`

### Database Tables Used

- **users** - Main user table (will be extended)
- **UserActivityLog** - For audit logging of role/permission changes

### Existing Code References

- `backend/src/middleware/authMiddleware.js` - Existing auth middleware
- `backend/src/services/userService.js` - User service layer
- `backend/src/controllers/userController.js` - User controllers
- `frontend/src/pages/dashboard/Profile.jsx` - Profile page

---

## 11. Assumptions and Limitations

### Assumptions

1. **Role assignment is manual:** No automated workflows for role assignment in Phase 4
2. **Permissions are static:** No dynamic permission evaluation based on context
3. **Feature flags are user-level:** No role-based or global feature flags in Phase 4
4. **No role hierarchies:** Roles are flat, no inheritance between roles
5. **2FA enforcement deferred:** 2FA requirement for elevated roles will be implemented later

### Limitations

1. **No admin UI:** Role/permission management must be done via API or database
2. **No role request workflow:** Users cannot request role upgrades
3. **No permission templates:** Cannot save permission sets for reuse
4. **No audit log UI:** Audit logs must be queried directly from database
5. **No role expiration:** Roles don't expire automatically (must be manually revoked)

### Future Enhancements

- Role hierarchies and permission inheritance
- Time-based role assignments (temporary roles)
- Role request and approval workflows
- Permission templates and presets
- Global and role-based feature flags
- Advanced audit log UI and analytics

---

## Conclusion

Phase 4: Roles, Access Levels & Feature Flags establishes the foundation for platform governance and controlled feature rollouts. This specification defines:

- ✅ Comprehensive role model (8 roles)
- ✅ Granular permissions system
- ✅ Account flags and feature flags
- ✅ Database design and migration strategy
- ✅ Backend access control patterns
- ✅ UI/UX impact and badge system
- ✅ Security and governance considerations
- ✅ Implementation roadmap

**Next Steps:**
1. Review and approve this specification
2. Create implementation task with steps outlined in Section 9
3. Begin Step 1: Database migration
4. Proceed through implementation steps sequentially

**Status:** 📋 Specification Complete - Awaiting Approval for Implementation

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Author:** OGC NewFinity Platform Team  
**Next Review:** Before Phase 4 Implementation Begins

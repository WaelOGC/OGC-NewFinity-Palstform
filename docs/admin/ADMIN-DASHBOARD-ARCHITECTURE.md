# Admin Dashboard Architecture

**Version:** 1.0  
**Status:** Active  
**Phase:** C — Admin Dashboard Architecture

This document defines the architecture, module structure, navigation patterns, state management, and integration requirements for the OGC NewFinity Admin Dashboard. It serves as the authoritative reference for current implementation and future expansion of administrative capabilities.

---

## Admin Dashboard Overview

### Purpose

The Admin Dashboard provides a unified interface for platform administrators to manage users, monitor system activity, configure settings, and maintain platform operations. It is designed to scale from basic user management to comprehensive administrative control across all platform domains.

### Scope

This architecture covers:

- **Module Registry**: Current and planned administrative modules
- **Navigation Structure**: Information architecture and routing patterns
- **State Management**: Loading, empty, error, and degraded states
- **Audit Integration**: Accountability and logging requirements
- **Future Compatibility**: Feature flags and module toggles for safe rollout

### Non-goals

This document does not cover:

- **User-facing dashboard features**: See `docs/frontend/dashboard-navigation.md`
- **API contract specifications**: See `docs/02-api-contracts/28-admin-api-contract.md`
- **Role and permission definitions**: See `docs/admin/ADMIN-ROLES-AND-ACCESS-CONTROL.md`
- **Individual module implementation details**: See module-specific documentation
- **Backend service architecture**: See backend service documentation

---

## Module Registry

### Current Modules

| Module | Route | Primary Purpose | Data Sources | Required Roles/Permissions | Audit Events | Degraded Behavior |
|--------|-------|----------------|--------------|---------------------------|--------------|-------------------|
| **Users** | `/admin/users` | User search, inspection, role management, status updates | `GET /api/v1/admin/users`<br>`GET /api/v1/admin/users/:userId`<br>`PUT /api/v1/admin/users/:userId/role`<br>`PUT /api/v1/admin/users/:userId/status`<br>`PUT /api/v1/admin/users/:userId/feature-flags` | `FOUNDER`, `CORE_TEAM`, `ADMIN`<br>OR `MANAGE_USERS` permission | `ROLE_UPDATED`<br>`STATUS_UPDATED`<br>`FEATURE_FLAG_UPDATED`<br>`SESSION_REVOKED` | Show error message if API unavailable. Retry button available. Filters disabled on error. |
| **Audit Logs** | `/admin/audit-logs` | View administrative action history, filter by action type, actor, target, date range | `GET /api/v1/admin/audit-logs` | `FOUNDER`, `CORE_TEAM`, `ADMIN`<br>OR `VIEW_AUDIT_LOGS` permission | N/A (view-only module) | Show empty state with message: "Audit log API is not yet available." Filters disabled. |

### Planned Modules

| Module | Route | Primary Purpose | Data Sources | Required Roles/Permissions | Audit Events | Degraded Behavior |
|--------|-------|----------------|--------------|---------------------------|--------------|-------------------|
| **Roles** | `/admin/roles` | Role definition, permission assignment, role hierarchy management | TBD | `FOUNDER`, `CORE_TEAM`<br>OR `ROLE_MANAGEMENT` permission | `ROLE_CREATED`<br>`ROLE_UPDATED`<br>`ROLE_DELETED`<br>`PERMISSION_ASSIGNED` | Show "Coming Soon" placeholder or hide if feature flag disabled. |
| **Feature Flags** | `/admin/feature-flags` | Global and per-user feature flag management, rollout control | TBD | `FOUNDER`, `CORE_TEAM`<br>OR `FEATURE_FLAG_CONTROL` permission | `FEATURE_FLAG_UPDATED`<br>`FEATURE_FLAG_ROLLOUT_STARTED` | Show "Coming Soon" placeholder or hide if feature flag disabled. |
| **System Settings** | `/admin/system` | Platform configuration, environment variables, system health monitoring | TBD | `FOUNDER`, `CORE_TEAM`<br>OR `SYSTEM_CONFIGURATION` permission | `SYSTEM_SETTING_UPDATED`<br>`SYSTEM_CONFIGURATION_CHANGED` | Show read-only mode with warning banner if write access unavailable. |
| **Content Moderation** | `/admin/moderation` | Content review queue, moderation actions, automated rule management | TBD | `FOUNDER`, `CORE_TEAM`, `ADMIN`, `MODERATOR`<br>OR `CONTENT_MODERATION` permission | `CONTENT_APPROVED`<br>`CONTENT_REJECTED`<br>`CONTENT_FLAGGED`<br>`CONTENT_DELETED` | Show empty queue state. Disable moderation actions with error message. |
| **Analytics & Reports** | `/admin/analytics` | Platform metrics, user activity dashboards, custom report generation | TBD | `FOUNDER`, `CORE_TEAM`, `ADMIN`<br>OR `ANALYTICS_VIEW` permission | `REPORT_GENERATED`<br>`REPORT_EXPORTED` | Show cached data with "Last updated" timestamp. Disable real-time updates. |
| **Integrations** | `/admin/integrations` | Third-party service configuration, API key management, webhook setup | TBD | `FOUNDER`, `CORE_TEAM`<br>OR `INTEGRATION_MANAGEMENT` permission | `INTEGRATION_CREATED`<br>`INTEGRATION_UPDATED`<br>`INTEGRATION_DELETED`<br>`API_KEY_ROTATED` | Show read-only list. Disable create/edit actions with error message. |

---

## Navigation & Information Architecture

### Grouping Principles

Admin modules are organized into logical groups to support scalability and maintainability:

1. **Identity & Access** (Current: Users, Audit Logs; Planned: Roles)
   - User account management
   - Role and permission administration
   - Access control and audit trails

2. **Moderation** (Planned: Content Moderation)
   - Content review and enforcement
   - Automated moderation rules
   - Community management tools

3. **System** (Planned: System Settings, Feature Flags)
   - Platform configuration
   - Feature rollout control
   - System health monitoring

4. **Reports** (Planned: Analytics & Reports)
   - Platform metrics and dashboards
   - Custom report generation
   - Data export capabilities

5. **Integrations** (Planned: Integrations)
   - Third-party service management
   - API and webhook configuration

### Sidebar Structure

**Current Implementation:**

```
Admin Console
├── Users
└── Audit Logs
```

**Scalable Structure (Future):**

```
Admin Console
├── Identity & Access
│   ├── Users
│   ├── Roles
│   └── Audit Logs
├── Moderation
│   └── Content Moderation
├── System
│   ├── Feature Flags
│   └── System Settings
├── Reports
│   └── Analytics & Reports
└── Integrations
    └── Integrations
```

**Implementation Notes:**
- Sidebar uses collapsible sections for grouped modules
- Active route highlighting via `NavLink` with `isActive` state
- Icons accompany each module link for visual recognition
- Sidebar collapses on mobile/tablet viewports

### URL Conventions

**Pattern:** `/admin/{module-slug}`

**Examples:**
- `/admin` → Redirects to `/admin/users` (index route)
- `/admin/users` → Users module
- `/admin/users/:userId` → User detail view (within Users module)
- `/admin/audit-logs` → Audit Logs module
- `/admin/roles` → Roles module (planned)

**Rules:**
- Use kebab-case for multi-word module names
- Module slugs must be unique across all admin routes
- Nested routes within modules use `/admin/{module}/{sub-resource}`
- Query parameters for filters, pagination, and search: `?page=1&search=term&filter=value`

### Breadcrumbs and Deep-linking Rules

**Breadcrumb Pattern:**
```
Admin Console > {Module Name} > {Sub-resource} (if applicable)
```

**Examples:**
- `Admin Console > Users`
- `Admin Console > Users > User #123`
- `Admin Console > Audit Logs`

**Deep-linking Support:**
- All module list views support direct URL access with filters preserved in query parameters
- Detail views (e.g., user detail drawer) can be deep-linked if module supports it
- Breadcrumbs reflect current navigation path
- Browser back/forward navigation preserves filter and pagination state where possible

---

## Dashboard States

### Loading

**Trigger Conditions:**
- Initial page load
- Data fetch in progress
- Filter or pagination change
- Refresh action triggered

**UI Response:**
- Display loading indicator (spinner or skeleton UI)
- Show message: "Loading {module name}..." or "Loading {resource}..."
- Disable interactive elements (filters, pagination, action buttons)
- Maintain layout structure to prevent layout shift

**Logging Expectations:**
- Log API request start with module name and parameters
- Log API response time for performance monitoring
- Log slow requests (>2 seconds) as warnings

**Example Implementation:**
```jsx
{loading && (
  <div className="admin-module-loading">
    <p>Loading {moduleName}...</p>
  </div>
)}
```

### Empty

**Trigger Conditions:**
- API returns empty result set
- No data matches current filters
- Module has no data yet (first-time setup)

**UI Response:**
- Display empty state illustration or icon
- Show contextual message based on filter state:
  - With filters: "No {resources} match your current filters."
  - Without filters: "No {resources} found."
- Provide actionable next steps:
  - "Clear filters" button (if filters are active)
  - "Create {resource}" button (if module supports creation)
  - Link to related module or documentation

**Logging Expectations:**
- Log empty state display with filter context
- Do not log as error (empty results are valid states)

**Example Implementation:**
```jsx
{!loading && !error && items.length === 0 && (
  <div className="admin-module-empty-state">
    <h3>No {resourceName} found</h3>
    <p>{hasFilters ? "No results match your filters." : "There are no items to display."}</p>
    {hasFilters && (
      <button onClick={handleClearFilters}>Clear filters</button>
    )}
  </div>
)}
```

### Error

**Trigger Conditions:**
- API request fails (network error, 4xx, 5xx)
- Authentication/authorization failure
- Invalid response format
- Backend service unavailable

**UI Response:**
- Display error banner or dedicated error section
- Show user-friendly error message:
  - Network errors: "Unable to connect to the server. Please check your connection."
  - 403 Forbidden: "You do not have permission to access this resource."
  - 404 Not Found: "The requested resource was not found."
  - 500 Server Error: "The server encountered an error. Please try again later."
  - Generic: "An error occurred while loading {module name}."
- Provide retry action button
- Preserve user input (filters, search terms) where possible
- If error is non-critical (partial failure), show partial data with error banner

**Logging Expectations:**
- Log all errors with full context:
  - Error message and stack trace
  - Request URL and parameters
  - Response status code and body
  - User ID and role
  - Timestamp
- Categorize errors (network, authentication, authorization, server, client)
- Alert on critical errors (5xx, authentication failures)

**Example Implementation:**
```jsx
{error && (
  <div className="admin-module-error">
    <h3>Unable to load {moduleName}</h3>
    <p>{errorMessage}</p>
    <button onClick={handleRetry} className="plasma-button">
      Retry
    </button>
  </div>
)}
```

### Degraded Mode

**Trigger Conditions:**
- Backend service partially unavailable (read-only mode)
- Feature flag disabled for module
- Rate limiting or quota exceeded
- Database connection issues (read-only fallback)

**UI Response:**
- Display warning banner at top of module: "This module is operating in degraded mode. Some features may be unavailable."
- Disable write actions (create, update, delete buttons)
- Show read-only indicators on editable fields
- Display last successful sync timestamp if applicable
- Provide link to status page or documentation

**Logging Expectations:**
- Log degraded mode activation with reason
- Log all attempted write actions that were blocked
- Monitor degraded mode duration and frequency
- Alert if degraded mode persists >15 minutes

**Example Implementation:**
```jsx
{degradedMode && (
  <div className="admin-module-degraded-banner">
    <p>⚠️ Operating in degraded mode. Write actions are disabled.</p>
  </div>
)}
{degradedMode && (
  <button disabled title="Write actions unavailable in degraded mode">
    Update
  </button>
)}
```

---

## Audit & Accountability Integration

### Required Audit Events

All administrative actions must generate audit log entries. The following actions are **mandatory** to audit:

**User Management:**
- `ROLE_UPDATED` — When user role is assigned or changed
- `STATUS_UPDATED` — When user account status changes (ACTIVE, SUSPENDED, BANNED, DISABLED)
- `FEATURE_FLAG_UPDATED` — When user-specific feature flags are modified
- `SESSION_REVOKED` — When admin revokes a user session
- `USER_DELETED` — When user account is deleted (if supported)

**Role Management (Planned):**
- `ROLE_CREATED` — When new role is defined
- `ROLE_UPDATED` — When role permissions are modified
- `ROLE_DELETED` — When role is removed
- `PERMISSION_ASSIGNED` — When permission is assigned to role

**Feature Flags (Planned):**
- `FEATURE_FLAG_UPDATED` — When global or user-specific flag is toggled
- `FEATURE_FLAG_ROLLOUT_STARTED` — When gradual rollout begins

**System Configuration (Planned):**
- `SYSTEM_SETTING_UPDATED` — When platform configuration changes
- `SYSTEM_CONFIGURATION_CHANGED` — When critical system settings are modified

**Content Moderation (Planned):**
- `CONTENT_APPROVED` — When content is approved
- `CONTENT_REJECTED` — When content is rejected
- `CONTENT_FLAGGED` — When content is flagged for review
- `CONTENT_DELETED` — When content is deleted

**Access Control:**
- `ACCESS_DENIED` — When admin action is blocked due to insufficient permissions
- `AUDIT_LOG_VIEWED` — When admin views audit logs (optional, for sensitive compliance)

### Audit Metadata Requirements

Each audit log entry must capture:

**Required Fields:**
- `actorId` — Admin user ID who performed the action
- `actorRole` — Role of actor at time of action (for non-repudiation)
- `action` — Action type (from list above)
- `targetType` — Entity type (USER, ROLE, CONTENT, SYSTEM, etc.)
- `targetId` — Entity ID (user ID, role ID, content ID, etc.)
- `createdAt` — Timestamp of action

**Optional but Recommended:**
- `metadata` — JSON object containing:
  - `before` — State before action (for updates)
  - `after` — State after action (for updates)
  - `reason` — Admin-provided reason for action (for sensitive operations)
  - `ipAddress` — IP address of admin (captured from request)
  - `userAgent` — User agent string (captured from request)

**Implementation Pattern:**
```javascript
await logAdminAction({
  actorId: req.user.id,
  actorRole: req.user.role,
  action: 'ROLE_UPDATED',
  targetType: 'USER',
  targetId: userId,
  metadata: {
    before: { role: 'STANDARD_USER' },
    after: { role: 'ADMIN' },
    reason: 'Promoted to admin for content moderation duties'
  },
  req: req
});
```

### Audit Log Viewing

- Audit logs are viewable by admins with `VIEW_AUDIT_LOGS` permission or `FOUNDER`/`CORE_TEAM`/`ADMIN` roles
- Audit logs are **immutable** — no edits or deletions allowed
- Audit logs support filtering by:
  - Action type
  - Target type
  - Actor ID
  - Date range
  - Free-text search (action, target_type, target_id, actor_role)
- Audit logs are paginated (default 25 per page)

---

## Future Compatibility

### Feature Flags

Feature flags enable safe, gradual rollout of new admin modules and capabilities.

**Admin-Specific Feature Flags:**
- `ENABLE_BETA_ADMIN_MODULES` — Enable experimental admin modules
- `ENABLE_ADVANCED_ANALYTICS` — Enable advanced analytics features
- `ENABLE_EMERGENCY_ACTIONS` — Enable emergency action capabilities (e.g., mass user operations)

**Module-Level Feature Flags:**
Each planned module should have a corresponding feature flag:
- `ENABLE_ADMIN_ROLES_MODULE`
- `ENABLE_ADMIN_FEATURE_FLAGS_MODULE`
- `ENABLE_ADMIN_SYSTEM_SETTINGS_MODULE`
- `ENABLE_ADMIN_CONTENT_MODERATION_MODULE`
- `ENABLE_ADMIN_ANALYTICS_MODULE`
- `ENABLE_ADMIN_INTEGRATIONS_MODULE`

**Implementation Pattern:**
```jsx
import { FeatureGate } from '../components/FeatureGate';
import { FEATURE_FLAGS } from '../config/featureFlags';

<Route 
  path="/admin/roles" 
  element={
    <FeatureGate 
      enabled={FEATURE_FLAGS.ENABLE_ADMIN_ROLES_MODULE} 
      featureName="Roles Management"
    >
      <AdminRolesPage />
    </FeatureGate>
  } 
/>
```

### Module Toggles

Modules can be toggled on/off per environment or per user role:

**Environment-Based Toggles:**
- Production: All stable modules enabled
- Staging: Beta modules enabled for testing
- Development: All modules enabled (including experimental)

**Role-Based Module Visibility:**
- Modules are hidden from sidebar if user lacks required permissions
- Backend enforces access control regardless of UI visibility
- 403 errors are logged and displayed appropriately

**Safe Rollout Strategy:**
1. **Phase 1**: Module hidden behind feature flag, accessible only to `FOUNDER` role
2. **Phase 2**: Enable for `CORE_TEAM` role, monitor usage and errors
3. **Phase 3**: Enable for `ADMIN` role, gather feedback
4. **Phase 4**: Enable globally, remove feature flag (or keep for emergency disable)

**Implementation Pattern:**
```javascript
// In AdminLayout.jsx
const adminLinks = [
  { to: "/admin/users", label: "Users", ... },
  { to: "/admin/audit-logs", label: "Audit Logs", ... },
  // Conditionally include based on feature flag and permissions
  ...(isFeatureEnabled('ENABLE_ADMIN_ROLES_MODULE') && hasPermission('ROLE_MANAGEMENT')
    ? [{ to: "/admin/roles", label: "Roles", ... }]
    : [])
];
```

---

## Implementation Checklist

This checklist maps architectural decisions to future engineering tasks. Tasks are not implemented yet but are documented for reference.

### Module Registry
- [ ] Create module registry data structure (JSON or TypeScript types)
- [ ] Implement module metadata API endpoint (`GET /api/v1/admin/modules`)
- [ ] Build module status dashboard (shows which modules are enabled/disabled)
- [ ] Add module health checks (verify backend endpoints are available)

### Navigation & Information Architecture
- [ ] Implement collapsible sidebar sections for module groups
- [ ] Add breadcrumb component to AdminLayout
- [ ] Implement deep-linking support for filtered list views
- [ ] Add URL state management (preserve filters in query params)
- [ ] Create mobile-responsive sidebar (collapsible hamburger menu)

### Dashboard States
- [ ] Create reusable `AdminModuleLoading` component
- [ ] Create reusable `AdminModuleEmpty` component
- [ ] Create reusable `AdminModuleError` component
- [ ] Create reusable `AdminModuleDegradedBanner` component
- [ ] Implement error logging service (client-side error tracking)
- [ ] Add performance monitoring (API response time tracking)

### Audit & Accountability Integration
- [ ] Verify all admin actions call `logAdminAction()` service
- [ ] Add audit log entry validation (ensure required fields present)
- [ ] Implement audit log retention policy (archival after N days)
- [ ] Add audit log export functionality (CSV/JSON download)
- [ ] Create audit log search indexing (for faster free-text search)

### Future Compatibility
- [ ] Implement feature flag service integration in frontend
- [ ] Add feature flag UI toggle (for admins with `FEATURE_FLAG_CONTROL` permission)
- [ ] Create module enable/disable API endpoints
- [ ] Implement gradual rollout mechanism (percentage-based feature flags)
- [ ] Add feature flag analytics (track usage and errors per flag)

### Planned Modules
- [ ] **Roles Module**: Design UI, implement backend endpoints, add to navigation
- [ ] **Feature Flags Module**: Design UI, implement backend endpoints, add to navigation
- [ ] **System Settings Module**: Design UI, implement backend endpoints, add to navigation
- [ ] **Content Moderation Module**: Design UI, implement backend endpoints, add to navigation
- [ ] **Analytics Module**: Design UI, implement backend endpoints, add to navigation
- [ ] **Integrations Module**: Design UI, implement backend endpoints, add to navigation

---

## Task Report

**File Created:** `docs/admin/ADMIN-DASHBOARD-ARCHITECTURE.md`

**Summary:**

This document provides comprehensive architecture documentation for the OGC NewFinity Admin Dashboard, covering:

1. **Module Registry**: Detailed tables for current modules (Users, Audit Logs) and planned modules (Roles, Feature Flags, System Settings, Content Moderation, Analytics, Integrations) with route, data source, permission, and degraded behavior specifications.

2. **Navigation & Information Architecture**: Grouping principles for scalable module organization, current and future sidebar structures, URL conventions, and breadcrumb/deep-linking rules.

3. **Dashboard States**: Complete specifications for Loading, Empty, Error, and Degraded modes, including trigger conditions, UI responses, and logging expectations.

4. **Audit & Accountability Integration**: Comprehensive list of required audit events across all admin domains, metadata requirements, and audit log viewing capabilities.

5. **Future Compatibility**: Feature flag system for safe module rollout, module toggle mechanisms, and phased rollout strategy.

6. **Implementation Checklist**: Task mapping from architectural decisions to future engineering work, organized by domain.

The document aligns with existing implementations (Users and Audit Logs modules) and provides a clear roadmap for future expansion while maintaining consistency with existing admin documentation and role/permission systems.

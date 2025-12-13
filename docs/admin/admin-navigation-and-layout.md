# Admin Navigation and Layout

## Purpose

This document defines the structural layout of the Admin Dashboard UI and establishes how navigation is generated from the module registry. It ensures consistent behavior across all admin pages and separates layout logic from individual module implementations.

The contract specifies:

- How the admin shell structure is organized
- How navigation entries are derived from the Module Registry
- How permissions control navigation visibility and route access
- How routing works within the admin context
- How global page states affect the layout and navigation
- Rules for extending the admin layout without breaking existing functionality

This is a structural contract, not a UI design specification. It defines the architecture and integration points that all admin modules must follow.

## Admin Layout Structure

The Admin Dashboard uses a persistent shell layout that loads once and hosts all admin modules within its content area.

### Layout Components

**Global Admin Shell:**

The admin shell provides the structural foundation for all admin pages. It includes:

- Persistent navigation sidebar (left side)
- Main content area (center/right)
- Optional top context bar (reserved for future use: breadcrumbs, module-specific actions)
- Global banner area (above content, for errors, degraded mode, announcements)

**Persistent Navigation (Sidebar):**

The sidebar contains navigation entries grouped by navigation groups. It:

- Remains visible across all admin pages
- Reflects the current active route
- Collapses/expands navigation groups based on configuration
- Updates dynamically based on module registry and permissions

**Main Content Area:**

The main content area is where individual module pages render. It:

- Renders the active module's page component
- Handles module-specific content only
- Does not contain layout structure (header, sidebar, etc.)
- Receives layout context (degraded mode state, permissions, etc.) from the shell

**Top Context Bar (Reserved):**

Reserved space above the main content area for:

- Breadcrumb navigation (future)
- Module-specific action buttons (future)
- Quick context switches (future)

**Global Banners:**

Area above the main content for system-wide messaging:

- Degraded mode warnings
- Global error messages
- Platform announcements
- System maintenance notifications

### Layout Loading Behavior

**Initial Load:**

1. Admin shell loads and initializes
2. Authentication and admin role checks execute
3. Module registry is evaluated for navigation generation
4. Permission checks determine visible navigation entries
5. Active route's module component renders in content area

**Subsequent Navigation:**

1. Route change triggers navigation
2. Module component unmounts (cleanup)
3. New module component mounts in same content area
4. Shell and navigation remain persistent (no reload)

## Navigation Generation

Navigation entries are programmatically generated from the Module Registry, ensuring consistency between documentation and implementation.

### Generation Rules

**Source of Truth:**

- Navigation structure is derived from `docs/admin/admin-module-registry.md`
- Each module with `status = active` generates a navigation entry
- Modules with `status = planned` are excluded from production navigation (hidden)
- Modules with `status = disabled` are excluded from navigation

**Grouping:**

- Navigation items are grouped by their `navGroup` field
- Navigation groups appear in the sidebar as collapsible sections
- Group order follows the order defined in the Navigation Groups section of the registry
- Within each group, modules appear in the order they are listed in the registry

**Ordering:**

1. **Explicit Order:** If a module registry entry specifies an explicit order field (future), use that
2. **Registry Order:** Otherwise, use the order modules appear in the registry
3. **Alphabetical Fallback:** If no explicit ordering exists, sort alphabetically by module name within each group

**Visibility Rules:**

**Planned Modules (Hidden):**

- Modules with `status = planned` do not appear in navigation in production environments
- Planned modules may be visible in development/staging environments for testing (feature flag controlled)
- Direct URL access to planned modules should show a "Coming Soon" or "Not Available" page

**Feature Flag Visibility:**

- Modules may specify feature flag requirements
- If a feature flag is disabled, the module is excluded from navigation
- Feature flag checks occur during navigation generation, not at render time

**Environment-Based Visibility:**

- Development environments may show planned modules for preview
- Production environments strictly follow status = active requirement
- Environment detection should not be hard-coded; use configuration

### Navigation Entry Structure

Each navigation entry contains:

- **Label:** Human-readable name from module `name` field
- **Route:** Module `uiRoute` value
- **Icon:** (Optional, future) Module-specific icon identifier
- **Badge:** (Optional, future) Notification badge or status indicator
- **Permission:** Required permissions from module `permissions` field (used for visibility)

## Permission-Based Visibility

Navigation visibility and route access are controlled by permission checks derived from module registry entries.

### Visibility Rules

**Navigation Entry Visibility:**

- A navigation entry appears in the sidebar only if:
  1. Module status is `active`
  2. User has required permissions (roles or permission strings from module registry)
  3. Feature flags (if any) are enabled
  4. Environment allows visibility

**Hidden Module Behavior:**

When a module is hidden due to permissions:

- **Navigation:** Entry does not appear in the sidebar
- **Direct URL Access:** Route guard blocks access and redirects or shows "Access Denied" page
- **Error Response:** Consistent JSON error for API access attempts (from module API routes)

**Read-Only Module Behavior:**

A module may be visible but operate in read-only mode:

- **Navigation:** Entry appears normally
- **Access:** User can navigate to the module
- **Functionality:** Write actions are disabled, read operations continue
- **Visual Indicator:** Module page may display read-only banner or disabled action buttons

### Permission Evaluation

**Evaluation Timing:**

- Permissions are evaluated during navigation generation (build time or initial load)
- Permissions are re-evaluated on authentication state changes
- Route guards perform permission checks on every route navigation

**Permission Sources:**

- User roles (from authentication context)
- User permissions (from permission system)
- Feature flags (from configuration)
- Environment settings (development vs production)

**Fallback Behavior:**

- If permission check fails or is unavailable, hide the module (fail secure)
- Log permission check failures for debugging
- Never expose permission structure details in error messages

## Routing Contract

The Admin Dashboard uses a consistent routing pattern that ensures all admin routes are properly protected and organized.

### Route Structure

**Route Prefix:**

- All admin routes use the prefix `/admin/*`
- The prefix ensures route isolation and enables route guards

**Module Route Ownership:**

- Each module owns its route subtree under `/admin/{module-path}`
- Module path matches the module's `id` from the registry (kebab-case)
- Example: `users-management` module owns `/admin/users` (or `/admin/users-management` if ID matches route)

**Nested Routes:**

- Modules may define sub-routes within their subtree
- Sub-routes are module-specific and not part of the navigation generation
- Example: `/admin/users/:id` is a sub-route of the users-management module

### Route Guards

**Authentication Guard:**

- Applied to all `/admin/*` routes
- Redirects unauthenticated users to login
- Must execute before admin permission checks

**Admin Permission Guard:**

- Applied to all `/admin/*` routes
- Verifies user has admin role or admin permissions
- Must execute after authentication guard
- Returns consistent error for non-admin users

**Module-Specific Permission Guard (Optional):**

- Applied at the module route level
- Verifies user has module-specific permissions
- Only applied if module specifies stricter permissions than general admin access
- Falls back to general admin check if module permissions are not specified

### Unknown Routes

**Admin-Level Not Found:**

- Unknown routes under `/admin/*` show an admin-specific "Not Found" page
- Page maintains admin shell (sidebar, layout) for navigation
- Message: "The requested admin page was not found."
- Provides link back to admin dashboard home or main navigation

**Non-Admin Routes:**

- Routes outside `/admin/*` are handled by main application routing
- Admin layout does not apply to non-admin routes

## Global Page States

Global page states affect the entire admin layout and navigation, providing system-wide context to all modules.

### Loading

**Initial Admin Shell Loading:**

- Display loading skeleton for navigation sidebar
- Show loading indicator in main content area
- Disable all navigation interactions during initial load
- Navigation entries may appear progressively as permission checks complete

**Navigation Skeleton Behavior:**

- Show placeholder navigation groups and items
- Match expected navigation structure (grouped layout)
- Replace with actual navigation once registry and permissions are resolved

### Error

**Global Admin-Level Errors:**

**Authentication Failure:**

- User is not authenticated or session expired
- Redirect to login page with return URL
- Admin shell does not render

**Configuration Failure:**

- Module registry cannot be loaded
- Permission system unavailable
- Show error page within admin shell: "Admin dashboard configuration error"
- Provide retry action
- Log error details server-side

**Distinction from Module Errors:**

- Global errors affect the entire admin shell
- Module errors affect only the content area
- Global errors prevent module rendering
- Module errors allow navigation to other modules

### Degraded Mode

**Banner Visibility:**

- Degraded mode banner appears in the global banner area
- Banner is visible across all admin pages
- Banner persists during navigation between modules
- Banner content: "Admin dashboard is operating in degraded mode. Some features may be limited."

**Navigation Behavior:**

- Navigation entries remain visible (modules can still be accessed)
- Modules that require unavailable services may show disabled state in navigation
- Visual indicator (icon, badge) may mark affected modules

**Read-Only Enforcement:**

- Degraded mode state is passed to all module components
- Modules receive degraded mode flag via layout context
- Modules implement read-only behavior based on degraded mode state
- Layout does not prevent navigation; modules handle degraded state internally

**Service-Specific Degradation:**

- Degraded mode may be service-specific (database, external APIs, etc.)
- Modules check degraded mode context for their specific service dependencies
- Only affected modules show read-only behavior
- Unaffected modules operate normally

## Extensibility Rules

To maintain stability and scalability, strict rules govern how the admin layout can be extended.

### Module Addition Rules

**New Modules Must Not Modify Admin Shell:**

- Adding a new module must not require changes to:
  - Admin shell component structure
  - Navigation generation logic (unless adding new navigation group)
  - Route guard implementations
  - Layout component hierarchy

**Module Registry as Source of Truth:**

- All module information comes from the registry
- No hard-coded module names in layout components
- No hard-coded navigation structures
- Navigation is generated dynamically from registry data

### Navigation Group Addition

**Adding New Navigation Groups:**

- New navigation groups require:
  1. Update to `docs/admin/admin-module-registry.md` Navigation Groups section
  2. Update to `docs/admin/admin-dashboard-overview.md` Navigation structure section
  3. Registry update is sufficient; layout code should handle new groups automatically

**Group Ordering:**

- Navigation group order is defined in the registry
- Layout respects registry-defined order
- No hard-coded group ordering in layout code

### Layout Stability

**Layout Must Remain Stable as Modules Grow:**

- Adding 10, 50, or 100 modules must not require layout refactoring
- Navigation must scale to handle many modules per group
- Performance must not degrade with module count
- Consider pagination or search for navigation if groups become too large (future)

**Backward Compatibility:**

- Layout changes must not break existing modules
- Module API (props, context) must remain stable
- Deprecation process required for breaking layout changes

### Code Organization

**No Hard-Coded Module Names:**

- Layout components must not contain hard-coded references to specific modules
- Use module registry data structures exclusively
- Exception: Dashboard home or default landing page may be hard-coded (documented exception)

**Configuration Over Code:**

- Navigation visibility rules should be configurable
- Feature flags and environment settings control behavior
- Avoid conditional logic based on module names

## Acceptance Criteria

**Navigation Accuracy:**

- ✅ Navigation entries match Module Registry active modules exactly
- ✅ Navigation groups match registry-defined groups
- ✅ Navigation order matches registry order
- ✅ Planned modules do not appear in production navigation

**Permission Enforcement:**

- ✅ Modules hidden by permissions do not appear in navigation
- ✅ Direct URL access to hidden modules is blocked by route guards
- ✅ Permission checks occur before module component render
- ✅ Non-admin users cannot access any `/admin/*` routes

**Routing Behavior:**

- ✅ All admin routes are prefixed with `/admin/*`
- ✅ Unknown admin routes show admin-specific "Not Found" page
- ✅ Route guards execute in correct order (auth → admin → module)
- ✅ Module sub-routes work within module route subtree

**Global State Handling:**

- ✅ Global degraded mode banner appears across all admin pages
- ✅ Degraded mode state is accessible to all module components
- ✅ Global errors prevent module rendering appropriately
- ✅ Navigation skeleton displays during initial load

**Extensibility:**

- ✅ Adding a new module does not require layout code changes
- ✅ Adding a new navigation group requires only registry updates
- ✅ Layout supports growth without performance degradation
- ✅ No hard-coded module names exist in layout components

**Consistency:**

- ✅ Layout behavior is consistent across all admin pages
- ✅ Navigation behavior is predictable and stable
- ✅ Error handling is consistent across the admin shell
- ✅ Permission failures show consistent error responses

## Related References

- [Admin Dashboard Overview](./admin-dashboard-overview.md)
- [Admin Module Registry](./admin-module-registry.md)
- [Admin Users Management Module Specification](./modules/admin-users-management.md)
- [Admin API Contract](../02-api-contracts/28-admin-api-contract.md)
- [Admin Dashboard Architecture](./ADMIN-DASHBOARD-ARCHITECTURE.md)

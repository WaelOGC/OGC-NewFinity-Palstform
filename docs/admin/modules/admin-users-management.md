# Admin Users Management

## Purpose

The Admin Users Management module allows authorized administrators to view and manage platform users. It provides operational visibility into user accounts, roles, status, and authentication providers.

This module supports moderation, support, and governance workflows by enabling administrators to:
- Search and filter users across the platform
- View user profile information and account details
- Inspect user roles, permissions, and account status
- Access user activity history and authentication providers

The module is designed as read-heavy by default, with carefully gated write actions (role updates, status changes) that require explicit permissions and audit logging.

## UI Routes

**Primary route:** `/admin/users`

**Route Convention:** All admin routes follow the pattern `/admin/{module-path}` where the module path matches the module identifier (`users` for this module).

**Current Implementation:**

The module is accessible at `/admin/users` and renders the user listing page with search, filtering, and pagination capabilities.

**Planned Sub-routes (Future):**

- `/admin/users/:id` - Detailed user profile view with activity history and device management
- `/admin/users/:id/activity` - Dedicated activity log view for a specific user

These sub-routes will provide expanded functionality for detailed user inspection and management actions.

## API Routes

**Primary Endpoint:**

- **GET** `/api/v1/admin/users`
  - Query parameters:
    - `page` (number, optional, default: 1) - Page number (minimum: 1)
    - `limit` (number, optional, default: 25, max: 100) - Items per page
    - `q` (string, optional) - Search query (searches email, username, displayName if available)
    - `search` (string, optional) - Alias for `q` (backward compatibility)
  - Response: Paginated list of users with consistent JSON structure
  - Features:
    - Pagination support with configurable page size
    - Search functionality across email, username, and display name
    - Stable response shape regardless of database schema state
    - Schema-drift tolerance: gracefully handles missing optional database columns

**Existing Detail Endpoint:**

- **GET** `/api/v1/admin/users/:userId`
  - Returns detailed user information including profile data, roles, permissions, and activity history
  - Supports query parameter `simple=true` for simplified user lookup responses

**Planned Write Endpoints (Future):**

- **PUT** `/api/v1/admin/users/:userId/role` - Update user role (planned)
- **PUT** `/api/v1/admin/users/:userId/status` - Update account status (planned)
- **PUT** `/api/v1/admin/users/:userId/feature-flags` - Manage user feature flags (planned)

All write actions will require additional permissions beyond read access and will generate audit log entries.

## Permissions Model

**Access Requirements:**

The module requires admin-level access. Users can access if they have:

1. **Admin Role:** One of the following roles:
   - `FOUNDER`
   - `CORE_TEAM`
   - `ADMIN`

2. **Admin Permission:** At least one of:
   - `VIEW_ADMIN_DASHBOARD`
   - `MANAGE_USERS`

**Authorization Behavior:**

- **Authorized users:** Can access the listing page and user details
- **Non-authorized users:** Receive a consistent JSON error response:
  ```json
  {
    "status": "ERROR",
    "code": "ADMIN_REQUIRED",
    "message": "You do not have permission to access this resource. Admin access required."
  }
  ```
- **Unauthenticated users:** Receive authentication error:
  ```json
  {
    "status": "ERROR",
    "code": "AUTH_REQUIRED",
    "message": "You must be logged in."
  }
  ```

**Read vs Write Distinction:**

- **Read actions** (list, view details): Available to all users with admin access
- **Write actions** (role updates, status changes): Planned for future implementation and will require additional permissions such as `MANAGE_USER_ROLES` or `MODIFY_USER_STATUS`

## Data Model (Admin View)

The admin-facing user object structure returned by the API:

**Core Fields (Always Present):**

- `id` (number, required): User ID
- `email` (string, nullable): User email address
- `createdAt` (string, nullable): User creation timestamp (ISO 8601 format)

**Extended Fields (Nullable, Schema-Drift Tolerant):**

- `username` (string, nullable): Username or handle
- `displayName` (string, nullable): Display name or full name
- `avatarUrl` (string, nullable): Avatar or profile picture URL
- `provider` (string, nullable): OAuth provider name if authenticated via OAuth (e.g., "google", "github")
- `accountStatus` (string, nullable): Account status (e.g., "active", "pending", "disabled", "suspended", "banned")
- `roles` (array, required, defaults to `[]`): Array of role strings (e.g., `["STANDARD_USER"]`, `["ADMIN"]`)

**Schema Drift Tolerance:**

- All nullable fields default to `null` if the corresponding database column does not exist
- The `roles` field defaults to an empty array `[]` if role data is unavailable
- Missing optional columns do not cause the endpoint to fail; the response shape remains stable
- Schema mismatches are logged server-side but do not affect the client experience

**Response Structure:**

```json
{
  "status": "OK",
  "code": "ADMIN_USERS_OK",
  "message": "Users retrieved successfully",
  "data": {
    "users": [...],
    "page": 1,
    "limit": 25,
    "total": 100
  }
}
```

## Page States

All page states must align with the global dashboard states defined in the Admin Dashboard Overview.

### Loading

**Initial Data Fetch:**

- Display skeleton UI or loading spinner while fetching user data
- Disable all actions (search, filters, pagination) during initial load
- Show placeholder rows or table skeleton that matches the expected user list structure

**Subsequent Loads:**

- For pagination or filter changes, show loading indicator in the table area
- Maintain existing data visible until new data arrives
- Optional "last updated" timestamp placeholder for future implementation

### Empty

**When to Show:**

- No users match the current search or filter criteria
- Zero users exist in the system (edge case)

**Implementation:**

- Display clear messaging explaining why the state is empty (e.g., "No users found matching your search")
- Distinguish from "no permission" state (which shows an authorization error, not an empty state)
- Provide recovery actions:
  - Clear search query button
  - Reset filters option
  - Refresh button to retry the query
- Include helpful guidance: "Try adjusting your search or filters"

### Error

**API Failure Handling:**

- Display user-friendly error message when API request fails
- Show appropriate error based on error code:
  - `ADMIN_REQUIRED`: Authorization error message
  - `AUTH_REQUIRED`: Authentication required message
  - `ADMIN_USERS_LIST_FAILED`: Generic failure message with retry option
- Provide "Retry" button to attempt the request again
- Never expose raw backend errors, stack traces, or HTML error pages

**Error Message Examples:**

- Authorization: "You do not have permission to access user management."
- Network/Server: "Unable to load users. Please try again."
- Timeout: "The request timed out. Please check your connection and try again."

### Degraded Mode

**Read-Only Behavior:**

- When backend or platform health indicates degraded operations, the module operates in read-only mode
- Display banner at the top of the page indicating limited operations: "User management is currently in read-only mode due to system limitations"
- Disable or hide write actions (role updates, status changes) when they are implemented
- Allow read operations (listing, viewing) to continue
- Provide clear messaging about what functionality is unavailable

**Triggers:**

- Database connectivity issues
- External provider failures (OAuth, email services)
- Background queue or service unavailability
- Platform health indicators showing degraded state

**Behavior:**

- Read operations continue with potential performance degradation
- Write operations are disabled with explanatory messaging
- Retry mechanisms remain available for read operations
- Error states may show more frequently due to degraded backend services

## Auditing & Observability

**Admin Access Logging:**

All access to the Admin Users Management module should be logged for security and compliance purposes:

- **List view access:** Log when administrators access the user listing page
- **Detail view access:** Log when administrators view individual user details
- **Search/filter actions:** Optional logging of search queries for audit trails (future)

**Traceability Requirements:**

- Record who accessed what user data and when
- Associate audit log entries with:
  - Admin user ID
  - Timestamp of access
  - Type of access (list, detail view)
  - Target user ID (for detail views)

**Future Write Action Auditing:**

When write actions are implemented, audit logs must capture:

- Action type (role update, status change, etc.)
- Previous and new values
- Admin user who performed the action
- Timestamp
- Reason or notes (if provided)

**Audit Event Codes (Planned):**

- `ADMIN_USERS_LIST_ACCESSED` - Admin viewed user list
- `ADMIN_USER_DETAIL_ACCESSED` - Admin viewed user detail
- `ADMIN_USER_ROLE_UPDATED` - User role changed (planned)
- `ADMIN_USER_STATUS_UPDATED` - User status changed (planned)

**Observability:**

- Monitor API response times and error rates
- Track pagination usage patterns
- Monitor search query patterns (without storing sensitive data)
- Alert on unusual access patterns or bulk access attempts

## Acceptance Criteria

**Functional Requirements:**

- ✅ Page loads successfully for authorized admin users
- ✅ Non-admin users receive consistent JSON authorization errors and cannot access the page
- ✅ Pagination works correctly with configurable page sizes (default: 25, max: 100)
- ✅ Search functionality works across email, username, and displayName fields
- ✅ Empty state displays when no users match search/filter criteria
- ✅ Error state handles API failures gracefully with retry capability
- ✅ Degraded mode operates in read-only with clear banner messaging

**Performance Requirements:**

- API responses return within acceptable time limits (target: < 500ms for listing)
- Pagination limits prevent excessive data transfer (max 100 items per page)
- Search queries are optimized and do not cause database performance issues

**Security Requirements:**

- Access is strictly controlled via role and permission checks
- Non-admin users receive consistent error responses (no information leakage)
- API responses do not expose sensitive information beyond what is necessary for admin operations
- All admin actions are traceable through audit logging

**Stability Requirements:**

- API responses remain stable under database schema changes (schema-drift tolerance)
- Missing optional columns do not break the user interface
- Consistent JSON response structure regardless of data availability

**Accessibility Requirements:**

- Keyboard navigation works for all interactive elements
- Screen reader compatibility for user list and search functionality
- Clear focus indicators and accessible error messages
- Loading states are announced to assistive technologies

## Related References

- [Admin Dashboard Overview](../admin-dashboard-overview.md)
- [Admin Module Registry](../admin-module-registry.md)
- [Admin Users API Specification](../../backend/admin-users-api-spec.md)
- [Backend Issues and Pending Fixes](../../backend/issues.md)
- [Admin API Contract](../../02-api-contracts/28-admin-api-contract.md)
- [Admin Dashboard Architecture](../ADMIN-DASHBOARD-ARCHITECTURE.md)

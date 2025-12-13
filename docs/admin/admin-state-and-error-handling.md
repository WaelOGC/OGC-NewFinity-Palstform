# Admin State and Error Handling

## Purpose

This document establishes a unified contract for admin-facing states and errors, ensuring consistent backend responses and frontend rendering across all Admin Dashboard modules.

The contract serves to:

- **Prevent silent failures:** All states must be explicitly handled and visible
- **Eliminate UI ambiguity:** Clear distinction between different state types
- **Ensure consistency:** Unified behavior across all admin modules
- **Define degraded mode:** How the system handles partial failures gracefully
- **Enable proper error recovery:** User-friendly error messages with actionable recovery options

This is a cross-layer contract that applies to both backend API responses and frontend component behavior, ensuring seamless integration between the API layer and UI layer.

## Admin State Model

The Admin Dashboard uses a canonical set of states that apply at both global (admin shell) and module (individual pages) levels.

### Canonical States

**idle**

- Initial state before any action is taken
- No data has been requested yet
- User has not interacted with the module
- UI shows initial/blank state

**loading**

- Data request is in progress
- Previous data (if any) may remain visible
- Loading indicators or skeleton UI displayed
- Actions are disabled during loading

**success**

- Data request completed successfully
- Valid data is available and displayed
- Module is fully operational
- All actions are enabled (subject to permissions)

**empty**

- Request succeeded but no data matches the query
- Valid state, not an error
- Empty state UI with helpful messaging and recovery actions
- User can modify filters/query to find results

**error**

- Request failed or encountered an error
- No usable data available
- Error message displayed with retry option
- Module functionality is limited or unavailable

**degraded**

- System is operating but with limited capabilities
- Read operations may work, write operations disabled
- Service health is compromised but not completely unavailable
- Degraded mode banner visible with clear messaging

### State Scope

**Global States:**

States that affect the entire admin shell:

- Admin shell loading (initial page load)
- Authentication state (not authenticated = redirect)
- Configuration loading (module registry, permissions)
- Global degraded mode (system-wide service degradation)

**Module States:**

States specific to individual modules:

- Module data loading
- Module data success/empty/error
- Module-specific degraded mode (affects only that module)

### State Transitions

**Normal Flow:**

1. `idle` → `loading` (user action or automatic data fetch)
2. `loading` → `success` (data received successfully)
3. `loading` → `empty` (request succeeded, no matching data)
4. `loading` → `error` (request failed)

**Recovery Flow:**

1. `error` → `loading` (user clicks retry)
2. `empty` → `loading` (user modifies query/filters)
3. `success` → `loading` (user refreshes or changes filters)

**Degraded Mode:**

1. `success` → `degraded` (service health degrades)
2. `degraded` → `success` (service health recovers)
3. `loading` → `degraded` (degradation detected during load)

**Invalid Transitions:**

- States cannot skip intermediate states (e.g., `idle` cannot directly become `success`)
- `error` cannot transition to `success` without passing through `loading`
- `degraded` is orthogonal to other states (can coexist with `success`, `empty`, or `error`)

## Backend Error Contract

All Admin API endpoints must follow strict error response rules to ensure consistent frontend handling.

### Response Format Requirements

**JSON Only:**

- All admin API responses must be valid JSON
- No HTML error pages
- No plain text error messages
- Content-Type header: `application/json`

**Standard Error Structure:**

```json
{
  "status": "ERROR",
  "code": "ERROR_CODE",
  "message": "User-friendly error message",
  "data": {}
}
```

**Required Fields:**

- `status` (string, required): Always `"ERROR"` for error responses
- `code` (string, required): Machine-readable error code (see Error Codes section)
- `message` (string, required): Human-readable error message suitable for display to users
- `data` (object, required): Additional error details (may be empty object `{}`)

**Optional Fields:**

- `details` (object, optional): Additional context (not user-facing, may include internal IDs)
- `retryable` (boolean, optional): Indicates if the error is retryable
- `correlationId` (string, optional): Request correlation ID for tracing

### Error Code Categories

**Authentication Errors (401 Unauthorized):**

- `AUTH_REQUIRED`: User is not authenticated
- `AUTH_SESSION_EXPIRED`: User session has expired
- `AUTH_TOKEN_INVALID`: Authentication token is invalid or malformed

**Authorization Errors (403 Forbidden):**

- `ADMIN_REQUIRED`: User does not have admin access
- `PERMISSION_DENIED`: User lacks required permission for this action
- `MODULE_ACCESS_DENIED`: User cannot access this specific module

**Validation Errors (400 Bad Request):**

- `VALIDATION_ERROR`: Request validation failed
- `INVALID_PARAMETER`: Specific parameter is invalid
- `MISSING_REQUIRED_FIELD`: Required field is missing

**Not Found Errors (404 Not Found):**

- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `MODULE_NOT_FOUND`: Admin module does not exist or is not available
- `ENDPOINT_NOT_FOUND`: API endpoint does not exist

**Service Errors (500 Internal Server Error):**

- `INTERNAL_ERROR`: Unspecified internal server error
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: External dependency service failed
- `SERVICE_UNAVAILABLE`: Service is temporarily unavailable

**Degraded Mode Indicators:**

- `SERVICE_DEGRADED`: Service is operating in degraded mode
- `READ_ONLY_MODE`: Service is in read-only mode, write operations disabled

### Error Response Examples

**Authentication Failure (401):**

```json
{
  "status": "ERROR",
  "code": "AUTH_REQUIRED",
  "message": "You must be logged in to access this resource.",
  "data": {}
}
```

**Authorization Failure (403):**

```json
{
  "status": "ERROR",
  "code": "ADMIN_REQUIRED",
  "message": "You do not have permission to access this resource. Admin access required.",
  "data": {}
}
```

**Validation Error (400):**

```json
{
  "status": "ERROR",
  "code": "VALIDATION_ERROR",
  "message": "Invalid request parameters.",
  "data": {
    "fields": {
      "page": "Page number must be greater than 0",
      "limit": "Limit must be between 1 and 100"
    }
  }
}
```

**Internal Service Error (500):**

```json
{
  "status": "ERROR",
  "code": "ADMIN_USERS_LIST_FAILED",
  "message": "Unable to retrieve users. Please try again.",
  "data": {},
  "retryable": true,
  "correlationId": "req-abc123xyz"
}
```

**Dependency Failure (503):**

```json
{
  "status": "ERROR",
  "code": "EXTERNAL_SERVICE_ERROR",
  "message": "A required service is temporarily unavailable. Please try again later.",
  "data": {
    "service": "database",
    "retryAfter": 30
  },
  "retryable": true
}
```

### No Stack Traces

**Strict Rule:**

- Stack traces, technical error details, or internal file paths must never appear in API responses
- Internal error details are logged server-side with correlation IDs
- User-facing messages are sanitized and non-technical
- Debug information is available only through correlation IDs and server logs

### HTTP Status Code Mapping

Error responses must use appropriate HTTP status codes:

- `401 Unauthorized`: Authentication failures
- `403 Forbidden`: Authorization failures
- `400 Bad Request`: Validation errors
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Internal service errors
- `503 Service Unavailable`: Service degradation or dependency failures

## Frontend Error Mapping

The frontend maps backend error codes to specific UI behavior, ensuring users see appropriate feedback and recovery options.

### Error Code to UI Behavior Mapping

**Authentication Errors (`AUTH_*`):**

- **UI Behavior:** Redirect to login page with return URL
- **User Message:** "Please log in to continue"
- **Recovery:** Automatic redirect, user logs in and returns

**Authorization Errors (`ADMIN_REQUIRED`, `PERMISSION_DENIED`):**

- **UI Behavior:** Show access denied page within admin shell
- **User Message:** "You do not have permission to access this page"
- **Recovery:** Navigate to accessible admin pages

**Validation Errors (`VALIDATION_ERROR`, `INVALID_PARAMETER`):**

- **UI Behavior:** Show inline validation errors or error banner
- **User Message:** Display specific field errors if provided
- **Recovery:** User corrects input and retries

**Not Found Errors (`RESOURCE_NOT_FOUND`, `MODULE_NOT_FOUND`):**

- **UI Behavior:** Show "Not Found" page or empty state with helpful message
- **User Message:** "The requested resource was not found"
- **Recovery:** Navigate to valid resource or adjust query

**Service Errors (`INTERNAL_ERROR`, `DATABASE_ERROR`):**

- **UI Behavior:** Show error state with retry button
- **User Message:** "Unable to complete your request. Please try again."
- **Recovery:** Retry button to re-attempt request

**Dependency Failures (`EXTERNAL_SERVICE_ERROR`, `SERVICE_UNAVAILABLE`):**

- **UI Behavior:** Show error state with retry button and optional retry timer
- **User Message:** "Service is temporarily unavailable. Please try again in a moment."
- **Recovery:** Automatic retry after delay, or manual retry button

**Degraded Mode Indicators (`SERVICE_DEGRADED`, `READ_ONLY_MODE`):**

- **UI Behavior:** Show degraded mode banner, disable write actions
- **User Message:** "Service is operating in limited mode. Some features may be unavailable."
- **Recovery:** Read operations continue, write operations disabled until recovery

### Rendering Behavior

**Errors That Block Rendering:**

- Authentication errors: Entire admin shell does not render
- Configuration errors: Admin shell renders with error page in content area
- Module not found: Module page does not render, shows "Not Found" message

**Errors That Allow Partial Rendering:**

- Module data errors: Module page renders with error state in content area
- Validation errors: Form/page renders with inline error indicators
- Degraded mode: Page renders normally but with limited functionality

### Retry Behavior

**Retryable Errors:**

- Errors with `retryable: true` in response show retry button
- Network errors are automatically retryable
- Service errors (500, 503) are generally retryable

**Non-Retryable Errors:**

- Authentication/authorization errors (user action required)
- Validation errors (user must correct input)
- Not found errors (resource does not exist)

**Retry Implementation:**

- Manual retry: User clicks "Retry" button
- Automatic retry: After delay for transient errors (with exponential backoff)
- Retry limit: Maximum retry attempts before showing permanent error message

### User Recovery Actions

Every error state must provide at least one recovery action:

- **Retry:** For transient errors
- **Navigate Away:** For persistent errors or access denied
- **Modify Input:** For validation errors
- **Contact Support:** For unrecoverable errors (with correlation ID)

## Empty vs Error

Clear distinction between empty data sets and error conditions is critical for proper UI feedback.

### Empty State

**Definition:**

- Request completed successfully (HTTP 200)
- No data matches the current query/filter criteria
- Valid business state, not an error

**Backend Response:**

```json
{
  "status": "OK",
  "code": "ADMIN_USERS_OK",
  "message": "Users retrieved successfully",
  "data": {
    "users": [],
    "page": 1,
    "limit": 25,
    "total": 0
  }
}
```

**Frontend UI Expectations:**

- Display empty state component with helpful messaging
- Explain why no data is shown (e.g., "No users match your search")
- Provide recovery actions:
  - Clear search/filters button
  - Adjust query guidance
  - Link to create new resource (if applicable)
- Maintain page structure (no error styling)
- Allow user to modify query and retry

**Examples:**

- User search returns zero results → Empty state
- Filter applied with no matches → Empty state
- Pagination beyond available data → Empty state (edge case)

### Error State

**Definition:**

- Request failed (HTTP 4xx or 5xx)
- Unable to complete the operation
- System or request problem, not a data availability issue

**Backend Response:**

```json
{
  "status": "ERROR",
  "code": "ADMIN_USERS_LIST_FAILED",
  "message": "Unable to retrieve users. Please try again.",
  "data": {}
}
```

**Frontend UI Expectations:**

- Display error state component with error styling
- Show user-friendly error message
- Provide retry action (if error is retryable)
- Log error details server-side (with correlation ID)
- Do not show partial or stale data
- Clear indication that something went wrong

**Examples:**

- Database connection failure → Error state
- Invalid request parameters → Error state
- Service timeout → Error state

### Distinction Rules

**Empty if:**

- HTTP status is 200
- `status` field is `"OK"`
- Data array is empty `[]` or data object is `null`
- No error code present

**Error if:**

- HTTP status is 4xx or 5xx
- `status` field is `"ERROR"`
- Error code is present
- Message indicates failure

**Special Case - Permission Denied vs Empty:**

- Permission denied → Error state (403, `ADMIN_REQUIRED`)
- Empty results due to filters → Empty state (200, empty array)
- Never confuse "no permission" with "no data"

## Degraded Mode

Degraded mode allows the Admin Dashboard to continue operating with limited functionality when services are partially available.

### Definition

Degraded mode indicates that:

- The Admin Dashboard can load and display
- Some services or dependencies are unavailable or unstable
- Read operations may function, but write operations are disabled
- System is not completely down, but operating with reduced capability

### Triggers

**Database Instability:**

- Connection timeouts or intermittent failures
- Read queries succeed but writes fail
- Replication lag or primary database issues

**External Provider Failures:**

- OAuth providers (Google, GitHub) unavailable
- Email/SMTP service down
- Third-party API failures

**Background Job Failures:**

- Queue service unavailable
- Worker processes down
- Scheduled jobs not executing

**Service Health Indicators:**

- Health check endpoints report degraded status
- Monitoring alerts indicate service degradation
- Rate limiting or throttling activated

### Backend Signaling

**HTTP Response Headers:**

```
X-Service-Status: degraded
X-Degraded-Services: database,email
```

**Response Body Indicator:**

For degraded mode, successful responses may include:

```json
{
  "status": "OK",
  "code": "ADMIN_USERS_OK",
  "message": "Users retrieved successfully",
  "data": { ... },
  "degraded": true,
  "degradedServices": ["database"]
}
```

**Dedicated Degraded Endpoint:**

```
GET /api/v1/admin/health
```

Returns system health status including degraded mode indicators.

### Frontend Enforcement

**Global Banner:**

- Degraded mode banner appears in global banner area
- Visible across all admin pages
- Persistent during navigation
- Message: "Admin dashboard is operating in degraded mode. Some features may be limited."

**Read-Only Mode:**

- Write actions (create, update, delete) are disabled
- Action buttons show disabled state with tooltip explanation
- Form submissions are blocked with informative message

**Disabled Actions:**

- High-risk operations are explicitly disabled
- Visual indicators (grayed out, lock icons) show disabled state
- Tooltips explain why actions are disabled: "This action is unavailable in degraded mode"

**Module-Level Degradation:**

- Modules receive degraded mode state via layout context
- Each module implements read-only behavior based on degraded state
- Module-specific degraded messaging may override global banner

**Service-Specific Degradation:**

- Degraded mode may affect specific services only
- Modules check degraded mode context for their dependencies
- Only affected modules show degraded behavior
- Unaffected modules operate normally

### Degraded Mode Recovery

**Automatic Recovery:**

- Frontend polls health endpoint periodically
- When services recover, degraded mode banner disappears
- Write actions automatically re-enabled
- User notification: "Service has been restored"

**Manual Refresh:**

- User can manually refresh to check recovery status
- Retry buttons are available for degraded operations
- Clear messaging about recovery expectations

## Global vs Module Errors

Understanding the distinction between global admin errors and module-specific errors ensures proper error handling and user experience.

### Global Admin Errors

**Definition:**

Errors that affect the entire admin shell and prevent normal operation.

**Examples:**

**Authentication Failure:**

- User is not authenticated or session expired
- Entire admin shell does not render
- Redirect to login page
- No module content is accessible

**Configuration Failure:**

- Module registry cannot be loaded
- Permission system unavailable
- Admin shell renders but shows configuration error in content area
- Navigation may not be available

**Admin Shell Initialization Failure:**

- Critical layout components fail to load
- Navigation cannot be generated
- Admin shell shows error page

**Handling:**

- Global errors prevent module rendering
- Error displayed at shell level
- User cannot navigate to other modules (navigation may be disabled)
- Retry or contact support actions available

### Module-Specific Errors

**Definition:**

Errors that affect only a specific module's functionality, allowing other modules to function normally.

**Examples:**

**Module API Failure:**

- Module's backend API endpoint fails
- Module page shows error state in content area
- Admin shell and navigation remain functional
- User can navigate to other modules

**Module Data Error:**

- Module data cannot be loaded
- Empty or error state shown within module content
- Other modules unaffected

**Module Permission Error:**

- User lacks permission for specific module
- Module shows access denied message
- Other modules accessible if user has permissions

**Handling:**

- Error displayed within module content area only
- Admin shell and navigation remain functional
- User can navigate away from error
- Module-specific retry actions available

### Priority Rules

**Error Priority (Highest to Lowest):**

1. **Global Authentication Error:** Blocks everything, redirects to login
2. **Global Configuration Error:** Blocks module access, shows error page
3. **Module Permission Error:** Blocks specific module, shows access denied
4. **Module API Error:** Shows error in module content, allows navigation
5. **Module Data Error:** Shows empty/error state, module still accessible

**User Experience:**

- Highest priority error is always shown
- Lower priority errors are suppressed if higher priority error exists
- When global error resolves, module errors become visible
- Users never see multiple conflicting error messages simultaneously

**Error Context:**

- Global errors show in shell-level error page
- Module errors show in module content area with module context
- Navigation remains available unless global error prevents it

## Logging & Observability

Proper logging and observability ensure errors are traceable, debuggable, and monitored without exposing sensitive information to users.

### Required Logging

**Admin Error Logging:**

All admin errors must be logged server-side with:

- **Timestamp:** ISO 8601 format
- **Error Code:** Machine-readable error code
- **Correlation ID:** Unique request identifier
- **User ID:** Admin user who encountered error (if authenticated)
- **Module/Endpoint:** Which module or API endpoint generated error
- **Error Details:** Technical details (server-side only, never exposed to client)
- **Request Context:** Request method, path, query parameters (sanitized)
- **Stack Trace:** Full stack trace for debugging (server-side only)

**Log Format Example:**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "correlationId": "req-abc123xyz",
  "userId": 42,
  "module": "admin-users",
  "endpoint": "GET /api/v1/admin/users",
  "errorCode": "ADMIN_USERS_LIST_FAILED",
  "message": "Database connection timeout",
  "stackTrace": "...",
  "requestContext": {
    "method": "GET",
    "path": "/api/v1/admin/users",
    "query": { "page": 1, "limit": 25 }
  }
}
```

### Correlation IDs

**Purpose:**

- Link user-facing error messages to server-side logs
- Enable support teams to trace specific errors
- Correlate errors across multiple services

**Implementation:**

- Generated on every admin API request
- Included in error response as `correlationId` field
- Displayed to users in error messages (for support reference)
- Included in all server-side logs for that request

**User-Facing Display:**

Error messages may include: "If this problem persists, contact support with reference: req-abc123xyz"

### Traceability Expectations

**Error Traceability:**

Every error must be traceable from:

1. User-facing error message (with correlation ID)
2. Server-side log entry (with full context)
3. Request/response logs (API gateway level)
4. Application performance monitoring (APM) tools

**Audit Trail:**

Admin actions that result in errors must be logged for audit purposes:

- Who encountered the error
- What action was attempted
- When the error occurred
- Why the error occurred (error code and message)
- Where the error occurred (module, endpoint)

### User-Facing vs Internal Messages

**User-Facing Messages:**

- Non-technical language
- Actionable guidance
- No stack traces or file paths
- No internal system details
- Correlation ID for support

**Internal Logs:**

- Technical details
- Full stack traces
- Internal IDs and references
- System architecture details
- Debug information

**Sanitization:**

- User input is sanitized in logs (prevent log injection)
- Sensitive data (passwords, tokens) is never logged
- PII is masked or excluded from logs
- Only necessary context is logged

### Monitoring & Alerting

**Error Monitoring:**

- Track error rates by module and error code
- Alert on unusual error patterns
- Monitor degradation in service health
- Track correlation between errors and degraded mode

**Metrics:**

- Error count by type
- Error rate (errors per request)
- Recovery time from errors
- User impact (how many users affected)

**Alerting Thresholds:**

- Spike in error rate (> 5% of requests)
- Critical error codes (authentication failures, database errors)
- Degraded mode activation
- Service unavailability

## Acceptance Criteria

**Backend Consistency:**

- ✅ All admin API endpoints return consistent JSON error format
- ✅ Error responses include required fields (status, code, message, data)
- ✅ HTTP status codes match error type appropriately
- ✅ No stack traces or technical details in error responses
- ✅ Correlation IDs are included in error responses

**Frontend Handling:**

- ✅ Frontend correctly maps backend error codes to UI behavior
- ✅ Error states are visually distinct from empty states
- ✅ Retry actions are available for retryable errors
- ✅ User-friendly error messages are displayed
- ✅ No raw backend errors are exposed to users

**Empty vs Error Distinction:**

- ✅ Empty states show when no data matches query (HTTP 200, empty array)
- ✅ Error states show when request fails (HTTP 4xx/5xx, error code)
- ✅ UI clearly distinguishes between empty and error states
- ✅ Recovery actions are appropriate for each state type

**Degraded Mode:**

- ✅ Degraded mode is detected and signaled by backend
- ✅ Global degraded mode banner is visible across all admin pages
- ✅ Write actions are disabled in degraded mode
- ✅ Read operations continue when possible
- ✅ Degraded mode recovery is detected automatically

**Error Priority:**

- ✅ Global errors prevent module rendering appropriately
- ✅ Module errors allow navigation to other modules
- ✅ Highest priority error is always displayed
- ✅ Users never see conflicting error messages

**Logging & Observability:**

- ✅ All admin errors are logged server-side with full context
- ✅ Correlation IDs enable error traceability
- ✅ User-facing messages are sanitized and non-technical
- ✅ Internal logs contain technical details for debugging
- ✅ Error monitoring and alerting are configured

**No Silent Failures:**

- ✅ Every error state is visible to users
- ✅ Loading states transition to success, empty, or error (never stuck)
- ✅ Degraded mode is clearly communicated
- ✅ All states have appropriate UI representation

## Related References

- [Admin Dashboard Overview](./admin-dashboard-overview.md)
- [Admin Module Registry](./admin-module-registry.md)
- [Admin Navigation and Layout](./admin-navigation-and-layout.md)
- [Admin Users Management Module Specification](./modules/admin-users-management.md)
- [Admin Users API Specification](../backend/admin-users-api-spec.md)
- [Admin API Contract](../02-api-contracts/28-admin-api-contract.md)
- [Admin Dashboard Architecture](./ADMIN-DASHBOARD-ARCHITECTURE.md)

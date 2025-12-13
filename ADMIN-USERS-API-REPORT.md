# Admin Users API Report

## Overview

This document defines the stable API contract for `/api/v1/admin/users` endpoint as implemented in Task 11. The endpoint is schema-drift tolerant and will never crash due to missing database columns. It provides consistent JSON responses and deterministic permission checks.

## Endpoint

**GET** `/api/v1/admin/users`

## Query Parameters

- `page` (number, optional, default: 1) - Page number (minimum: 1)
- `limit` (number, optional, default: 25, max: 100) - Items per page
- `q` (string, optional) - Search query (searches email, username, displayName if available)
- `search` (string, optional) - Alias for `q` (backward compatibility)

**Note:** The endpoint supports both `q` and `search` parameters for backward compatibility. `q` is preferred per requirements.

## Response Shapes

### Success Response (200 OK)

When the request succeeds, the endpoint returns:

```json
{
  "status": "OK",
  "code": "ADMIN_USERS_OK",
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@example.com",
        "username": null,
        "displayName": "John Doe",
        "avatarUrl": null,
        "provider": null,
        "accountStatus": "active",
        "roles": ["STANDARD_USER"],
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "page": 1,
    "limit": 25,
    "total": 100
  }
}
```

**Field Descriptions:**
- `users` (array, required): Array of user objects
  - `id` (number, required): User ID
  - `email` (string, nullable): User email address
  - `username` (string, nullable): Username/handle (if available)
  - `displayName` (string, nullable): Display name or full name
  - `avatarUrl` (string, nullable): Avatar/profile picture URL
  - `provider` (string, nullable): OAuth provider name if authenticated via OAuth
  - `accountStatus` (string, nullable): Account status (e.g., "active", "pending", "disabled")
  - `roles` (array, required): Array of role strings (e.g., ["STANDARD_USER"])
  - `createdAt` (string, nullable): User creation timestamp
- `page` (number, required): Current page number
- `limit` (number, required): Items per page
- `total` (number, required): Total number of users matching the query

**Safe Defaults:**
- All nullable fields default to `null` if database columns don't exist
- `roles` defaults to empty array `[]` if role column doesn't exist
- If no users match, `users` is an empty array `[]`

### Error Response - Non-Admin User (403 Forbidden)

When a non-admin user attempts to access the endpoint:

```json
{
  "status": "ERROR",
  "code": "ADMIN_REQUIRED",
  "message": "You do not have permission to access this resource. Admin access required.",
  "data": {}
}
```

### Error Response - Not Authenticated (401 Unauthorized)

When the user is not authenticated:

```json
{
  "status": "ERROR",
  "code": "AUTH_REQUIRED",
  "message": "You must be logged in.",
  "data": {}
}
```

### Error Response - List Failed (500 Internal Server Error)

When the database query fails (non-schema errors):

```json
{
  "status": "ERROR",
  "code": "ADMIN_USERS_LIST_FAILED",
  "message": "Failed to fetch users",
  "data": {}
}
```

## Schema Drift Tolerance

The endpoint is designed to handle database schema drift gracefully:

1. **Minimal Safe Column Set**: The service queries only columns that are guaranteed to exist:
   - `id`, `email`, `createdAt`

2. **Extended Fields with Try/Catch**: Optional fields are queried in a separate try/catch block:
   - `username`, `displayName` (or `fullName`), `avatarUrl`, `provider` (or `authProvider`), `accountStatus` (or `status`), `role`
   - If columns don't exist, the query fails gracefully and fields default to `null` or `[]`

3. **Search Fallback**: Search functionality:
   - First attempts to search `email`, `username`, `displayName`/`fullName` if extended fields are available
   - Falls back to searching only `email` if extended fields query fails
   - Never crashes due to missing search columns

4. **Schema Mismatch Logging**: When optional columns are missing, a log is written:
   - Format: `[ADMIN_USERS] Schema mismatch: <description> (using <fallback>)`
   - No sensitive data is leaked in logs

5. **No Crashes**: The endpoint will never crash due to "Unknown column" errors. It always returns a valid JSON response with safe defaults.

## Permission Checks

### Admin Access Requirements

The endpoint requires admin-level access. A user can access if they have:

1. **Admin Role**: Role containing "ADMIN" (case-insensitive) or one of:
   - `FOUNDER`
   - `CORE_TEAM`
   - `ADMIN`

2. **Admin Permission**: At least one of:
   - `VIEW_ADMIN_DASHBOARD`
   - `MANAGE_USERS`

### Permission Middleware

**File:** `backend/src/middleware/requireAdmin.js`

- Function: `requireAdmin(req, res, next)`
- Checks: Role contains "ADMIN" (case-insensitive) or is in ADMIN_ROLES, OR has admin permissions
- Returns: Consistent JSON error responses using `apiResponse.fail()`
- Error Code: `ADMIN_REQUIRED` for insufficient permissions

## Implementation Details

### Service Layer

**File:** `backend/src/services/adminUsersService.js`

- Function: `getAdminUsers({ page, limit, q })`
- Returns: `{ users: [], page, limit, total }`
- Handles: Schema drift, missing columns, database errors, pagination, search

**Strategy:**
1. Query minimal guaranteed set (`id`, `email`, `createdAt`)
2. Attempt extended fields query in try/catch
3. If extended query fails, use minimal data with safe defaults
4. Build normalized user objects with stable shape
5. Return paginated result with consistent structure

### Route Handler

**File:** `backend/src/controllers/adminController.js`

- Function: `listAdminUsers(req, res)`
- Validates: Pagination inputs (page ≥ 1, limit 1-100)
- Calls: `getAdminUsers()` service
- Returns: Success via `apiResponse.ok()` or error via `apiResponse.fail()`

### Route Definition

**File:** `backend/src/routes/admin.routes.js`

- Route: `GET /users`
- Middleware: `requireAuth` → `requireAdmin`
- Handler: `listAdminUsers`

## 60-Second Test Steps

### Test 1: Admin User Access

1. **Authenticate as admin user** (role contains "ADMIN" or is FOUNDER/CORE_TEAM/ADMIN)
2. **Request:** `GET /api/v1/admin/users?page=1&limit=25`
3. **Expected:** 200 OK with `{ status: "OK", code: "ADMIN_USERS_OK", data: { users: [...], page: 1, limit: 25, total: N } }`

### Test 2: Non-Admin User Access

1. **Authenticate as non-admin user** (e.g., STANDARD_USER)
2. **Request:** `GET /api/v1/admin/users`
3. **Expected:** 403 Forbidden with `{ status: "ERROR", code: "ADMIN_REQUIRED", ... }`

### Test 3: Unauthenticated Access

1. **No authentication token**
2. **Request:** `GET /api/v1/admin/users`
3. **Expected:** 401 Unauthorized with `{ status: "ERROR", code: "AUTH_REQUIRED", ... }`

### Test 4: Pagination

1. **Authenticate as admin user**
2. **Request:** `GET /api/v1/admin/users?page=2&limit=10`
3. **Expected:** 200 OK with `data.page = 2`, `data.limit = 10`, correct pagination

### Test 5: Search

1. **Authenticate as admin user**
2. **Request:** `GET /api/v1/admin/users?q=test@example.com`
3. **Expected:** 200 OK with users matching email/username/displayName

### Test 6: Schema Drift Tolerance

1. **Authenticate as admin user**
2. **Simulate missing columns** (if possible) or use database without optional columns
3. **Request:** `GET /api/v1/admin/users`
4. **Expected:** 200 OK with users having `null` for missing optional fields, no crash

### Test 7: Max Limit Enforcement

1. **Authenticate as admin user**
2. **Request:** `GET /api/v1/admin/users?limit=200`
3. **Expected:** 200 OK with `data.limit = 100` (capped at max)

## Common Failure Modes

### 1. Database Connection Error

**Symptom:** Database connection fails
**Response:** 500 Internal Server Error with `ADMIN_USERS_LIST_FAILED`
**Handling:** Error is caught and returned as JSON, no HTML output

### 2. Missing Optional Columns

**Symptom:** Database missing `username`, `displayName`, `avatarUrl`, etc.
**Response:** 200 OK with users having `null` for missing fields
**Handling:** Service falls back to minimal fields, logs schema mismatch

### 3. Missing Core Columns

**Symptom:** Database missing `id`, `email`, or `createdAt`
**Response:** 200 OK with empty users array `{ users: [], page: 1, limit: 25, total: 0 }`
**Handling:** Service catches schema error and returns safe empty result

### 4. Invalid Pagination

**Symptom:** Negative page or limit > 100
**Response:** 200 OK with normalized values (page ≥ 1, limit ≤ 100)
**Handling:** Controller validates and normalizes inputs

### 5. Permission Check Failure

**Symptom:** User doesn't have admin role/permission
**Response:** 403 Forbidden with `ADMIN_REQUIRED`
**Handling:** Middleware returns consistent JSON error

## Acceptance Criteria Verification

✅ **Backend starts with no syntax errors**
- All imports resolve correctly
- No undefined functions or variables

✅ **GET /api/v1/admin/users works repeatedly**
- No intermittent failures
- Consistent response shape

✅ **Never crashes with ER_BAD_FIELD_ERROR / "Unknown column"**
- All column queries wrapped in try/catch
- Safe defaults returned for missing columns

✅ **Non-admin user gets consistent JSON error**
- `{ status: "ERROR", code: "ADMIN_REQUIRED", ... }`
- No HTML output

✅ **Admin user gets success response**
- `{ status: "OK", code: "ADMIN_USERS_OK", data: { users, page, limit, total } }`

✅ **Missing optional columns handled gracefully**
- Endpoint returns data with defaults (null/[])
- No crash, stable response shape

## Files Modified

1. **backend/src/services/adminUsersService.js** (NEW)
   - Schema-drift tolerant service for admin users listing

2. **backend/src/controllers/adminController.js** (MODIFIED)
   - Updated `listAdminUsers` to use new service and `apiResponse.ok()/fail()`

3. **backend/src/middleware/requireAdmin.js** (NEW)
   - Consistent admin permission checking middleware

4. **backend/src/routes/admin.routes.js** (MODIFIED)
   - Replaced inline middleware with `requireAdmin` middleware

## Notes

- The endpoint maintains backward compatibility with `search` parameter while supporting `q` per requirements
- Pagination defaults to 25 items per page (as specified) with max of 100
- All responses use consistent JSON format via `apiResponse` utilities
- No database schema changes were made (code-level tolerance only)

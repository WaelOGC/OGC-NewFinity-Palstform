# AUTH-ME Contract Report

## Overview

This document defines the stable API contract for `/api/v1/auth/me` endpoint as implemented in Task 10. The endpoint is schema-drift tolerant and will never crash due to missing database columns.

## Response Shapes

### Authenticated User (200 OK)

When the user is authenticated, the endpoint returns:

```json
{
  "status": "OK",
  "code": "AUTH_ME_OK",
  "message": "Authenticated.",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": null,
      "displayName": "John Doe",
      "avatarUrl": null,
      "accountStatus": "active",
      "provider": null,
      "roles": ["STANDARD_USER"],
      "permissions": []
    }
  }
}
```

**Field Descriptions:**
- `id` (number, required): User ID
- `email` (string, nullable): User email address
- `username` (string, nullable): Username/handle (if available)
- `displayName` (string, nullable): Display name or full name
- `avatarUrl` (string, nullable): Avatar/profile picture URL
- `accountStatus` (string, nullable): Account status (e.g., "active", "pending", "disabled")
- `provider` (string, nullable): OAuth provider name if authenticated via OAuth
- `roles` (array, required): Array of role strings (e.g., ["STANDARD_USER"])
- `permissions` (array, required): Array of permission strings (empty array if none)

**Safe Defaults:**
- All nullable fields default to `null` if database columns don't exist
- `roles` defaults to empty array `[]` if role column doesn't exist
- `permissions` defaults to empty array `[]` if permissions column doesn't exist

### Unauthenticated User (401 Unauthorized)

When the user is not authenticated, the endpoint returns:

```json
{
  "status": "ERROR",
  "code": "AUTH_NOT_AUTHENTICATED",
  "message": "Not authenticated.",
  "data": {
    "user": null
  }
}
```

**Important:** The middleware (`requireAuth`) returns this consistent JSON shape for all unauthenticated cases, including:
- No token provided
- Invalid/expired token
- Session expired or revoked
- Session mismatch

## Schema Drift Tolerance

The endpoint is designed to handle database schema drift gracefully:

1. **Minimal Safe Column Set**: The service queries only columns that are guaranteed to exist:
   - `id`, `email`, `fullName`, `role`, `status`, `accountStatus`, `createdAt`

2. **Optional Fields with Try/Catch**: Optional fields are queried in separate try/catch blocks:
   - `username`, `avatarUrl`, `authProvider`, `permissions`
   - If a column doesn't exist, the query fails gracefully and the field defaults to `null` or `[]`

3. **Schema Mismatch Logging**: When optional columns are missing, a log is written:
   - Format: `[AUTH_ME] Schema mismatch: <column> column not found (using null)`
   - No sensitive data is leaked in logs

4. **No Crashes**: The endpoint will never crash due to "Unknown column" errors. It always returns a valid JSON response with safe defaults.

## Implementation Details

### Service Layer

**File:** `backend/src/services/authMeService.js`

- Function: `getAuthMe(userId)`
- Returns: Normalized user object with safe defaults
- Handles: Schema drift, missing columns, database errors

### Route Handler

**File:** `backend/src/routes/auth.routes.js`

- Route: `GET /api/v1/auth/me`
- Middleware: `requireAuth` (sets `req.user.id`)
- Response: Uses `sendOk()` from `apiResponse.js` for consistent shape

### Response Utilities

**File:** `backend/src/utils/apiResponse.js`

- `ok(res, { code, message, data }, statusCode)`: Success response helper
- `fail(res, { code, message, data }, statusCode)`: Error response helper
- Both ensure consistent `{ status, code, message, data }` shape

## Testing Steps

### 1. Test Unauthenticated Request

```bash
curl -X GET http://localhost:3000/api/v1/auth/me
```

**Expected Response (401):**
```json
{
  "status": "ERROR",
  "code": "AUTH_NOT_AUTHENTICATED",
  "message": "Not authenticated.",
  "data": {
    "user": null
  }
}
```

### 2. Test Authenticated Request

1. Login via `/api/v1/auth/login` to get session cookies
2. Request `/api/v1/auth/me` with cookies (or Bearer token)

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Cookie: ogc_session=<session_token>; ogc_access_token=<access_token>"
```

**Expected Response (200):**
```json
{
  "status": "OK",
  "code": "AUTH_ME_OK",
  "message": "Authenticated.",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": null,
      "displayName": "John Doe",
      "avatarUrl": null,
      "accountStatus": "active",
      "provider": null,
      "roles": ["STANDARD_USER"],
      "permissions": []
    }
  }
}
```

### 3. Test Schema Drift Tolerance

To verify the endpoint handles missing columns:

1. Temporarily remove an optional column from the database (e.g., `avatarUrl`)
2. Request `/api/v1/auth/me` as an authenticated user
3. Verify the response still succeeds with `avatarUrl: null`
4. Check logs for schema mismatch message (non-fatal)

### 4. Test Profile Page Rendering

1. Login to the frontend
2. Navigate to profile page
3. Verify the page can render the user data from `/api/v1/auth/me`
4. Confirm no crashes occur even if optional fields are `null`

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_ME_OK` | 200 | Successfully retrieved user data |
| `AUTH_NOT_AUTHENTICATED` | 401 | User is not authenticated |
| `USER_NOT_FOUND` | 404 | User ID not found in database |
| `ACCOUNT_DISABLED` | 403 | User account is disabled |
| `DATABASE_ERROR` | 500 | Non-schema database error occurred |

## Notes

- **No HTML/Plain Text**: All responses are JSON, never HTML or plain text
- **Consistent Shape**: Both success and error responses follow `{ status, code, message, data }` pattern
- **Schema Safety**: Endpoint never crashes due to missing columns
- **Logging**: Schema mismatches are logged but don't expose sensitive data
- **Frontend Compatibility**: Response shape is stable and predictable for frontend consumption

## Files Modified

1. `backend/src/utils/apiResponse.js` - Added `ok()` and `fail()` helpers
2. `backend/src/services/authMeService.js` - New service for safe user data retrieval
3. `backend/src/routes/auth.routes.js` - Updated `/auth/me` handler to use new service
4. `backend/src/middleware/auth.js` - Updated to return consistent unauthenticated response shape

## Date

Implementation Date: 2024-12-19
Task: Task 10 - Make /api/v1/auth/me stable, non-crashing, and response-shape consistent

# Auth Error Codes & Response Standardization Report

## Overview

This document describes the standardized authentication response format and error codes implemented across all auth-related endpoints in the OGC NewFinity platform. All auth endpoints now return a consistent JSON envelope for predictable debugging and frontend integration.

## Standard Response Envelope

Every auth endpoint returns responses in the following format:

```json
{
  "status": "OK" | "ERROR",
  "code": "AUTH_*_OK" | "AUTH_*_ERROR",
  "message": "Human-readable message",
  "data": { ... }
}
```

### Rules

1. **status**: Must be either `"OK"` or `"ERROR"` (uppercase)
2. **code**: Must be a code from `authCodes.js` catalog (see below)
3. **message**: Human-readable description of the result
4. **data**: Always an object (even if empty `{}`)

### HTTP Status Codes

- `200`: Success (OK responses)
- `201`: Created (registration)
- `400`: Validation errors, invalid input
- `401`: Unauthenticated, invalid/expired tokens
- `403`: Forbidden, account disabled/pending
- `429`: Rate limit exceeded
- `500`: Server errors

## Error Code Catalog

### Success Codes (AUTH_OK)

| Code | Description | Used In |
|------|-------------|---------|
| `AUTH_LOGIN_OK` | Login successful | `/api/v1/auth/login` |
| `AUTH_LOGOUT_OK` | Logout successful | `/api/v1/auth/logout` |
| `AUTH_REGISTER_OK` | Registration successful | `/api/v1/auth/register` |
| `AUTH_SESSION_OK` | Session valid | `/api/v1/auth/session` |
| `AUTH_ME_OK` | User info retrieved | `/api/v1/auth/me` |
| `AUTH_REFRESH_OK` | Token refreshed | `/api/v1/auth/refresh` |
| `AUTH_PASSWORD_RESET_SENT` | Password reset email sent | `/api/v1/auth/forgot-password` |
| `AUTH_PASSWORD_RESET_OK` | Password reset successful | `/api/v1/auth/reset-password` |
| `AUTH_ACTIVATION_OK` | Account activated | `/api/v1/auth/activate` |
| `AUTH_OAUTH_OK` | OAuth login successful | `/api/v1/auth/oauth/*/callback` |
| `AUTH_2FA_REQUIRED` | 2FA challenge required | `/api/v1/auth/login` (when 2FA enabled) |

### Error Codes (AUTH_ERROR)

| Code | Description | HTTP | Used In |
|------|-------------|------|---------|
| `AUTH_VALIDATION_ERROR` | Invalid input, missing fields | 400 | All endpoints |
| `AUTH_NOT_AUTHENTICATED` | No token, invalid token, session expired | 401 | `/api/v1/auth/me`, middleware |
| `AUTH_FORBIDDEN` | Insufficient permissions | 403 | Admin endpoints |
| `AUTH_INVALID_CREDENTIALS` | Wrong email/password | 401 | `/api/v1/auth/login` |
| `AUTH_ACCOUNT_PENDING` | Account not activated | 403 | `/api/v1/auth/login` |
| `AUTH_ACCOUNT_DISABLED` | Account disabled | 403 | `/api/v1/auth/login` |
| `AUTH_EMAIL_NOT_VERIFIED` | Email not verified | 403 | `/api/v1/auth/login` |
| `AUTH_RATE_LIMITED` | Too many requests | 429 | Rate limiters |
| `AUTH_TOKEN_INVALID` | Invalid JWT/refresh token | 401 | `/api/v1/auth/refresh`, middleware |
| `AUTH_TOKEN_EXPIRED` | Expired JWT/refresh token | 401 | `/api/v1/auth/refresh`, middleware |
| `AUTH_PASSWORD_RESET_INVALID` | Invalid reset token | 400 | `/api/v1/auth/reset-password` |
| `AUTH_PASSWORD_RESET_EXPIRED` | Expired reset token | 400 | `/api/v1/auth/reset-password` |
| `AUTH_PASSWORD_RESET_USED` | Reset token already used | 400 | `/api/v1/auth/reset-password` |
| `AUTH_ACTIVATION_INVALID` | Invalid activation token | 400 | `/api/v1/auth/activate` |
| `AUTH_ACTIVATION_EXPIRED` | Expired activation token | 400 | `/api/v1/auth/activate` |
| `AUTH_ACTIVATION_ALREADY_USED` | Activation token already used | 400 | `/api/v1/auth/activate` |
| `AUTH_OAUTH_NEEDS_EMAIL` | OAuth provider didn't return email | 400 | `/api/v1/auth/oauth/*/callback` |
| `AUTH_OAUTH_TICKET_INVALID` | Invalid OAuth email ticket | 401 | `/api/v1/auth/oauth/complete` |
| `AUTH_2FA_INVALID` | Invalid 2FA code | 400 | `/api/v1/auth/login/2fa` |
| `AUTH_SERVER_ERROR` | Internal server error | 500 | All endpoints |

## Response Examples

### 1. Invalid Credentials

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "wrongpassword"
}
```

**Response:**
```json
{
  "status": "ERROR",
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "data": {}
}
```

**HTTP Status:** `401`

---

### 2. Not Authenticated

**Request:**
```http
GET /api/v1/auth/me
```

**Response:**
```json
{
  "status": "ERROR",
  "code": "AUTH_NOT_AUTHENTICATED",
  "message": "Not authenticated.",
  "data": {}
}
```

**HTTP Status:** `401`

---

### 3. Activation Invalid

**Request:**
```http
POST /api/v1/auth/activate
Content-Type: application/json

{
  "token": "invalid-token-123"
}
```

**Response:**
```json
{
  "status": "ERROR",
  "code": "AUTH_ACTIVATION_INVALID",
  "message": "This activation link is invalid or has expired.",
  "data": {}
}
```

**HTTP Status:** `400`

---

### 4. OAuth Needs Email

**Request:**
```http
GET /api/v1/auth/google/callback?code=...
```

**Response (JSON if Accept: application/json):**
```json
{
  "status": "ERROR",
  "code": "AUTH_OAUTH_NEEDS_EMAIL",
  "message": "OAuth provider did not provide an email address. Please complete authentication by providing your email.",
  "data": {
    "ticket": "oauth-ticket-...",
    "provider": "google"
  }
}
```

**HTTP Status:** `400`

---

### 5. Rate Limited

**Request:**
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (after 5 requests in 1 hour):**
```json
{
  "status": "ERROR",
  "code": "AUTH_RATE_LIMITED",
  "message": "Too many password reset requests. Please try again later.",
  "data": {}
}
```

**HTTP Status:** `429`

---

### 6. Successful Login

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "correctpassword"
}
```

**Response:**
```json
{
  "status": "OK",
  "code": "AUTH_LOGIN_OK",
  "message": "Login successful.",
  "data": {
    "access": "jwt-access-token...",
    "refresh": "jwt-refresh-token...",
    "user": {
      "id": 123,
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "STANDARD_USER",
      "status": "active"
    }
  }
}
```

**HTTP Status:** `200`

---

### 7. 2FA Required

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "correctpassword"
}
```

**Response (when 2FA is enabled):**
```json
{
  "status": "OK",
  "code": "AUTH_2FA_REQUIRED",
  "message": "Two-factor authentication is required to complete login.",
  "data": {
    "ticket": "2fa-ticket-...",
    "methods": {
      "totp": true,
      "recovery": true
    }
  }
}
```

**HTTP Status:** `200`

---

## Implementation Details

### Files Modified

1. **`backend/src/constants/authCodes.js`** (NEW)
   - Central catalog of all auth codes
   - Exports `AUTH_OK` and `AUTH_ERROR` objects

2. **`backend/src/utils/apiResponse.js`**
   - Updated `ok()` and `fail()` to enforce envelope
   - Always includes `data` field (defaults to `{}`)

3. **`backend/src/utils/authLogger.js`** (NEW)
   - Structured logging for auth events
   - Automatically redacts sensitive fields (passwords, tokens, secrets)
   - Event names: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `REGISTER_SUCCESS`, etc.

4. **`backend/src/controllers/auth.controller.js`**
   - All functions use `ok()`/`fail()` with standardized codes
   - Replaced `console.log` with `authLog()`

5. **`backend/src/controllers/activationController.js`**
   - Uses standardized codes and responses
   - Uses `authLog()` for structured logging

6. **`backend/src/middleware/auth.js`**
   - `requireAuth` middleware uses `fail()` with `AUTH_NOT_AUTHENTICATED`
   - Handles token expiration with `AUTH_TOKEN_EXPIRED`

7. **`backend/src/routes/auth.routes.js`**
   - Rate limiters use `AUTH_RATE_LIMITED` code
   - All route handlers use `ok()`/`fail()` with codes

### Logging

All auth events are logged using `authLog()` from `authLogger.js`:

- **Format:** `[AUTH] <timestamp> <event> <meta-json>`
- **Redaction:** Automatically redacts passwords, tokens, secrets, JWT_*, SMTP_PASS
- **Events:** `LOGIN_SUCCESS`, `LOGIN_FAILED`, `REGISTER_SUCCESS`, `ACTIVATION_SUCCESS`, etc.

**Example log:**
```
[AUTH] 2024-01-15T10:30:00.000Z LOGIN_SUCCESS {"userId":123,"email":"user@example.com"}
[AUTH] 2024-01-15T10:30:05.000Z LOGIN_FAILED {"email":"user@example.com","reason":"INVALID_CREDENTIALS"}
```

## Debugging Tips

1. **Check code first**: The `code` field is the primary identifier for the error type
2. **Check message**: The `message` field provides human-readable context
3. **Check data**: The `data` field may contain additional context (e.g., `ticket` for 2FA, `provider` for OAuth)
4. **Check logs**: Use `authLog` entries to trace auth flow events
5. **Check HTTP status**: Matches the error severity (400 = validation, 401 = auth, 403 = forbidden, 429 = rate limit)

## Frontend Integration

The frontend should:

1. Check `response.status === "OK"` or `response.status === "ERROR"`
2. Use `response.code` for conditional logic (e.g., `if (code === 'AUTH_2FA_REQUIRED')`)
3. Display `response.message` to users
4. Access `response.data` for additional payload (user object, tokens, etc.)

**Example:**
```javascript
const response = await api.post('/auth/login', { email, password });

if (response.status === 'OK') {
  if (response.code === 'AUTH_2FA_REQUIRED') {
    // Show 2FA input form
    setTwoFactorTicket(response.data.ticket);
  } else if (response.code === 'AUTH_LOGIN_OK') {
    // Login successful
    setUser(response.data.user);
  }
} else if (response.status === 'ERROR') {
  if (response.code === 'AUTH_INVALID_CREDENTIALS') {
    showError('Invalid email or password');
  } else if (response.code === 'AUTH_ACCOUNT_PENDING') {
    showError('Please activate your account first');
  }
}
```

## Testing Checklist

- [x] All auth endpoints return consistent envelope
- [x] Middleware errors use standardized codes
- [x] Rate limiters return `AUTH_RATE_LIMITED`
- [x] No auth endpoint returns HTML or plain text
- [x] Logs are structured and redact sensitive fields
- [x] Backend starts cleanly
- [x] Endpoints respond without crashing

## Notes

- **Backward Compatibility**: Frontend code that checks for specific response shapes (e.g., `response.user`) should continue to work as long as the data is wrapped in the `data` field
- **No Breaking Changes**: Existing frontend code should work with minimal changes (just check `status` and `code` fields)
- **Security**: Sensitive fields are automatically redacted from logs
- **Consistency**: All auth-related endpoints follow the same pattern

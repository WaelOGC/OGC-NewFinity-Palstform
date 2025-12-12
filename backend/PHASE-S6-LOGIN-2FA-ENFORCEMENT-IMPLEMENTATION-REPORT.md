# Phase S6: Login 2FA Enforcement Implementation Report

**Date:** 2024  
**Phase:** S6  
**Feature:** Two-Factor Authentication Enforcement at Login  
**Status:** ✅ Complete

## Overview

This implementation enforces two-factor authentication at login for users who have 2FA enabled. The flow is two-step and supports both TOTP (authenticator app) and recovery codes (from Phase S5). The implementation does not break existing behavior for users without 2FA.

## High-Level Behavior

1. User submits email + password to `/auth/login`
2. If password is valid and user does not have 2FA enabled → login works as today (session + JWT issued)
3. If password is valid and user does have 2FA enabled:
   - Do not create a session yet
   - Return a response indicating `2FA_REQUIRED` plus a short-lived "2FA ticket"
   - Frontend shows a second step asking for:
     - Authenticator app code (TOTP), or
     - Recovery code (if any unused codes exist)
   - Frontend sends the ticket + code to `/auth/login/2fa`
   - If the TOTP/recovery code is valid → create the normal session + JWT and log the user in
   - If invalid → return a clear 4xx error; the user can retry

## Backend Implementation

### 1. Two-Factor Ticket Utility

**File:** `backend/src/utils/twoFactorTicket.js`

**Functions:**
- `createTwoFactorTicket(userId)` - Creates a short-lived JWT ticket (10 minutes TTL) for 2FA verification
- `verifyTwoFactorTicket(token)` - Verifies and decodes a 2FA ticket, throws error if invalid/expired

**Key Design Decisions:**
- Uses `JWT_SECRET` or `JWT_ACCESS_SECRET` for signing (same as other JWTs)
- Ticket includes `kind: '2FA_TICKET'` to distinguish from other tokens
- 10-minute TTL provides reasonable security while allowing time for user input
- Tickets are stateless (no server-side storage) - relies on JWT expiration

### 2. Two-Factor Service Updates

**File:** `backend/src/services/twoFactorService.js`

**New Function:**
- `verifyUserTotpCode(userId, token)` - Verifies a TOTP code for a user during login
  - Checks if 2FA is enabled for the user
  - Retrieves the user's TOTP secret
  - Validates the code using `verifyTOTP` from `totp.js`
  - Throws appropriate errors with status codes

### 3. Login Controller Updates

**File:** `backend/src/controllers/auth.controller.js`

**Changes to `login()` function:**
- After verifying credentials and account status, checks 2FA status using `getTwoFactorStatusForUser()`
- If 2FA is enabled:
  - Does NOT create a session or JWT
  - Generates a 2FA ticket using `createTwoFactorTicket()`
  - Checks recovery codes status using `getRecoveryCodesStatusForUser()`
  - Logs `LOGIN_2FA_REQUIRED` activity
  - Returns `2FA_REQUIRED` response with ticket and available methods

**New Function: `postLoginTwoFactor()`**
- Validates ticket, mode (`totp` or `recovery`), and code
- Verifies the 2FA ticket using `verifyTwoFactorTicket()`
- Fetches user record and validates account status
- Depending on mode:
  - **TOTP mode:** Calls `verifyUserTotpCode()` to validate the 6-digit code
  - **Recovery mode:** Calls `consumeRecoveryCode()` to validate and consume the recovery code
- On success:
  - Creates session using `createAuthSessionForUser()`
  - Logs `LOGIN_2FA_SUCCEEDED` or `LOGIN_RECOVERY_CODE_USED` activity
  - Returns success response with tokens and user data
- On failure:
  - Logs `LOGIN_2FA_FAILED` activity
  - Returns appropriate error codes (`INVALID_TOTP_CODE`, `INVALID_RECOVERY_CODE`, `INVALID_2FA_TICKET`)

### 4. Routes

**File:** `backend/src/routes/auth.routes.js`

**New Route:**
- `POST /api/v1/auth/login/2fa` - Handles 2FA verification step
  - Validates request body (ticket, mode, code)
  - Calls `postLoginTwoFactor()` handler
  - Returns standardized error responses

**Updated Route:**
- `POST /api/v1/auth/login` - Now checks for `2FA_REQUIRED` response and returns it directly

## Frontend Implementation

### 1. API Client Updates

**File:** `frontend/src/utils/apiClient.js`

**Changes:**
- Added `POST /api/v1/auth/login/2fa` to `ALLOWED_ROUTES`

**New Function:**
- `loginWithTwoFactor({ ticket, mode, code })` - Calls the 2FA login endpoint
  - Sends ticket, mode (`totp` or `recovery`), and code
  - Returns response data (unwrapped from `{ status: 'OK', data: {...} }`)

### 2. Auth Context Updates

**File:** `frontend/src/context/AuthContext.jsx`

**Changes to `login()` function:**
- Updated to handle new `status === '2FA_REQUIRED'` response format
- Returns object with `status`, `ticket`, and `methods` for 2FA step

**New Function: `loginWithTwoFactorStep(ticket, mode, code)`**
- Calls `loginWithTwoFactor()` API helper
- Stores tokens and user data on success
- Fetches user role, permissions, and feature flags
- Returns user data

### 3. Login Form Updates

**File:** `frontend/src/components/LoginForm.jsx`

**New State:**
- `twoFactorTicket` - Stores the 2FA ticket from initial login
- `twoFactorMethods` - Stores available methods (`{ totp: true, recovery: true/false }`)
- `twoFactorMode` - Current mode (`'totp'` or `'recovery'`)

**Updated `handleSubmit()`:**
- Handles `status === '2FA_REQUIRED'` response
- Sets 2FA state and switches to 2FA step view

**Updated `handleTwoFactorVerify()`:**
- Supports both new ticket system and legacy challenge token system
- Validates code format based on mode (6 digits for TOTP, alphanumeric for recovery)
- Calls `loginWithTwoFactorStep()` for new system
- Handles specific error codes with user-friendly messages:
  - `INVALID_2FA_TICKET` - Resets to step 1
  - `INVALID_TOTP_CODE` - Shows TOTP error message
  - `INVALID_RECOVERY_CODE` - Shows recovery code error message

**2FA Step UI:**
- Mode toggle (only shown if both TOTP and recovery are available)
- Input field with different formatting for TOTP (6 digits, monospace) vs recovery (alphanumeric with dashes)
- Help text explaining what to enter
- "Back to login" button to return to credentials step
- Error messages with specific guidance

### 4. CSS Styling

**File:** `frontend/src/components/AuthForm.css`

**New Styles:**
- `.twofactor-mode-toggle` - Container for mode toggle buttons
- `.twofactor-mode-toggle-btn` - Individual toggle button
- `.twofactor-mode-toggle-btn--active` - Active state styling
- `.twofactor-help-text` - Help text below input field
- `.auth-form-status--info` - Info status message styling
- Responsive styles for mobile devices

## API Endpoints

### POST /api/v1/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (2FA Required):**
```json
{
  "status": "2FA_REQUIRED",
  "code": "TWO_FACTOR_REQUIRED",
  "message": "Two-factor authentication is required to complete login.",
  "data": {
    "ticket": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "methods": {
      "totp": true,
      "recovery": true
    }
  }
}
```

**Response (No 2FA):**
```json
{
  "status": "OK",
  "data": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "STANDARD_USER",
      "status": "active"
    }
  }
}
```

### POST /api/v1/auth/login/2fa

**Request:**
```json
{
  "ticket": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mode": "totp",
  "code": "123456"
}
```

or

```json
{
  "ticket": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mode": "recovery",
  "code": "XXXX-XXXX-XXXX-XXXX"
}
```

**Response (Success):**
```json
{
  "status": "OK",
  "data": {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "STANDARD_USER",
      "status": "active"
    }
  }
}
```

**Response (Invalid TOTP Code):**
```json
{
  "status": "ERROR",
  "code": "INVALID_TOTP_CODE",
  "message": "The code from your authenticator app is not correct.",
  "statusCode": 400
}
```

**Response (Invalid Recovery Code):**
```json
{
  "status": "ERROR",
  "code": "INVALID_RECOVERY_CODE",
  "message": "This recovery code is invalid or has already been used.",
  "statusCode": 400
}
```

**Response (Invalid/Expired Ticket):**
```json
{
  "status": "ERROR",
  "code": "INVALID_2FA_TICKET",
  "message": "Two-factor challenge has expired or is invalid.",
  "statusCode": 401
}
```

## Security Considerations

### Ticket Security
- Tickets are short-lived (10 minutes) to limit exposure window
- Tickets are signed JWTs, preventing tampering
- Tickets include `kind: '2FA_TICKET'` to prevent reuse as other token types
- Tickets are stateless (no server-side storage) - relies on JWT expiration
- **Limitation:** Tickets are not blacklisted after use. If a ticket is intercepted, it could theoretically be reused within the 10-minute window. This is acceptable for this phase but could be enhanced with a ticket blacklist in the future.

### Session Creation
- Sessions are only created after successful 2FA verification
- No session cookies are set until 2FA is complete
- Account status is re-validated at the 2FA step to prevent race conditions

### Recovery Code Security
- Recovery codes are hashed before storage (SHA-256)
- Recovery codes are single-use (marked as used after consumption)
- Recovery code validation normalizes input (removes spaces/dashes, converts to uppercase)

### Activity Logging
- All 2FA events are logged:
  - `LOGIN_2FA_REQUIRED` - When 2FA is required
  - `LOGIN_2FA_SUCCEEDED` - When TOTP verification succeeds
  - `LOGIN_RECOVERY_CODE_USED` - When recovery code is used
  - `LOGIN_2FA_FAILED` - When 2FA verification fails
- Logs include IP address, user agent, and method (TOTP/recovery)

## Manual Test Checklist

### ✅ Non-2FA Account Login
- [x] Login works exactly as before (no second step)
- [x] Sessions and tokens are created immediately
- [x] User is redirected to dashboard

### ✅ 2FA-Enabled Account, TOTP
- [x] Enter correct email/password
- [x] Expect HTTP 200 with `{ status: '2FA_REQUIRED', data: { ticket, methods: { totp: true, recovery: true/false } } }`
- [x] Enter valid TOTP code → expect full login success (session cookie, dashboard visible)
- [x] Enter invalid TOTP code → expect error message, no session created
- [x] Can retry with correct code after error

### ✅ 2FA-Enabled Account, Recovery Codes
- [x] Regenerate recovery codes in Security page
- [x] Login with correct email/password → `2FA_REQUIRED`
- [x] Choose "Recovery code" on step 2; enter valid code → success
- [x] Try to reuse the same code → expect `INVALID_RECOVERY_CODE`
- [x] Recovery code is marked as used in database

### ✅ Expired/Invalid Ticket
- [x] Wait more than 10 minutes after credentials step (or manually tamper with ticket)
- [x] Submit a 2FA code → expect `INVALID_2FA_TICKET`
- [x] UI resets to step 1 automatically
- [x] User can start fresh login

### ✅ Account Status Validation
- [x] Deleted accounts cannot log in, even with valid 2FA
- [x] Disabled accounts cannot log in, even with valid 2FA
- [x] Pending verification accounts cannot log in, even with valid 2FA

### ✅ Security
- [x] Session rows and cookies are only created after successful 2FA verification
- [x] Recovery code validation marks the code as used and cannot be reused
- [x] Activity logs are created for all 2FA events
- [x] No session is created if 2FA fails

### ✅ UI/UX
- [x] Mode toggle appears when both TOTP and recovery are available
- [x] Input formatting changes based on mode (6 digits vs alphanumeric)
- [x] Help text is displayed for each mode
- [x] Error messages are user-friendly and specific
- [x] "Back to login" button works correctly
- [x] Page reload during step 2 resets to step 1 (expected behavior)

## Files Modified

### Backend
- `backend/src/utils/twoFactorTicket.js` (new)
- `backend/src/services/twoFactorService.js` (updated)
- `backend/src/controllers/auth.controller.js` (updated)
- `backend/src/routes/auth.routes.js` (updated)

### Frontend
- `frontend/src/utils/apiClient.js` (updated)
- `frontend/src/context/AuthContext.jsx` (updated)
- `frontend/src/components/LoginForm.jsx` (updated)
- `frontend/src/components/AuthForm.css` (updated)

## Backward Compatibility

- The implementation maintains backward compatibility with the legacy 2FA challenge token system (Phase 3)
- Users without 2FA continue to log in normally
- The old `/auth/2fa/verify` endpoint remains functional for legacy clients

## Future Enhancements

1. **Ticket Blacklist:** Add server-side tracking of used tickets to prevent replay attacks
2. **Rate Limiting:** Add rate limiting to the 2FA verification endpoint to prevent brute force attacks
3. **Remember Device:** Option to remember trusted devices and skip 2FA for a period
4. **Backup Codes Display:** Show remaining unused recovery codes count in the 2FA step

## Conclusion

Phase S6 successfully implements two-factor authentication enforcement at login with support for both TOTP and recovery codes. The implementation is secure, user-friendly, and maintains backward compatibility with existing systems.

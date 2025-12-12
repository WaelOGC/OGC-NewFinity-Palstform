# Activation Flow Standardization Report

## Overview

This report documents the standardized activation flow implemented across the OGC NewFinity platform. All activation links and API calls now follow a single canonical format to ensure consistency and reliability.

## Canonical URL Format

### Frontend URL (Email Link)
```
{FRONTEND_BASE_URL}/activate?token=<TOKEN>
```

**Example:**
```
http://localhost:5173/activate?token=abc123xyz789
```

### Backend API Endpoint
```
POST /api/v1/auth/activate
Content-Type: application/json

{
  "token": "<TOKEN>"
}
```

**Response (Success):**
```json
{
  "status": "OK",
  "code": "ACCOUNT_ACTIVATED",
  "message": "Account activated",
  "userId": 123
}
```

**Response (Error):**
```json
{
  "status": "ERROR",
  "code": "ACTIVATION_TOKEN_INVALID_OR_EXPIRED",
  "message": "This activation link is invalid or has expired."
}
```

## Flow Diagram

```
1. User registers → Backend creates ActivationToken
2. Email service generates link: {FRONTEND_BASE_URL}/activate?token=<TOKEN>
3. User clicks email link → Opens frontend route: /activate
4. Frontend reads token from URL query string
5. Frontend calls: POST /api/v1/auth/activate with { token }
6. Backend validates token, activates account, marks token as used
7. Backend returns: { status: "OK", message: "Account activated", userId: 123 }
8. Frontend shows success message and redirects to /auth (login page)
```

## Implementation Details

### Email Link Generation
**File:** `backend/src/services/emailService.js`

- Uses `FRONTEND_BASE_URL` environment variable
- Generates link as: `${baseUrl}/activate?token=${encodeURIComponent(token)}`
- Token is properly URL-encoded to handle special characters

### Frontend Route
**File:** `frontend/src/main.jsx`

- Route: `/activate` (changed from `/auth/activate`)
- Component: `ActivationPage`

### Frontend Activation Page
**File:** `frontend/src/pages/ActivationPage/index.jsx`

1. Reads token from URL query parameter: `searchParams.get('token')`
2. Calls backend API:
   ```javascript
   POST /api/v1/auth/activate
   Body: { token: "<TOKEN>" }
   ```
3. Handles three states:
   - **Loading:** Shows "Activating your account..."
   - **Success:** Shows "Account Activated!" and redirects to `/auth` after 3 seconds
   - **Error:** Shows error message with "Go to Sign In" button

### Backend Route
**File:** `backend/src/routes/auth.routes.js`

- **Method:** POST only (GET route removed)
- **Path:** `/activate` (mounted at `/api/v1/auth`, so full path is `/api/v1/auth/activate`)

### Backend Controller
**File:** `backend/src/controllers/activationController.js`

**Behavior:**
1. Accepts token from `req.body.token` (query string support removed)
2. Validates token exists and is not expired/used
3. Activates user account:
   - Sets `accountStatus = 'ACTIVE'`
   - Sets `status = 'ACTIVE'`
   - Sets `emailVerified = 1`
   - Updates `updatedAt` timestamp
4. Marks activation token as used
5. Returns standardized response with `userId`
6. **Idempotent:** If user already active, returns success with "already active" message

## Key Changes Made

### Files Modified

1. **backend/src/services/emailService.js**
   - Changed activation URL from `/auth/activate` to `/activate`

2. **frontend/src/main.jsx**
   - Changed route from `/auth/activate` to `/activate`

3. **frontend/src/pages/ActivationPage/index.jsx**
   - Changed API call from GET with query string to POST with JSON body
   - Updated to use direct fetch instead of apiClient for better control
   - Simplified success handling (no auto-login)

4. **frontend/src/utils/apiClient.js**
   - Updated ALLOWED_ROUTES: removed `GET /api/v1/auth/activate`, added `POST /api/v1/auth/activate`

5. **backend/src/controllers/activationController.js**
   - Changed to only accept POST with token in body (removed query string support)
   - Added `emailVerified = 1` update during activation
   - Added `userId` to response
   - Updated comments to reflect canonical format

6. **backend/src/routes/auth.routes.js**
   - Removed GET route for `/activate`
   - Kept only POST route with canonical format documentation

## Rules Enforced

1. ✅ Token must not be placed in path segments (query string for frontend, JSON for backend)
2. ✅ Email link always points to frontend, never directly to backend
3. ✅ Frontend route matches email link format exactly
4. ✅ Backend only accepts POST requests with JSON body
5. ✅ Response format is consistent and includes `userId`
6. ✅ Activation is idempotent (clicking valid link twice returns appropriate response)

## Verification Steps

### 30-Second Verification

1. **Generate activation token** (register a new user or manually insert into DB):
   ```sql
   -- Get a user ID (example: user with email 'test@example.com')
   SELECT id, email FROM User WHERE email = 'test@example.com';
   
   -- Create activation token manually (if needed)
   -- Note: This uses the actual activation service, so use the registration flow normally
   ```

2. **Check email console output** (if SMTP not configured, activation link is logged):
   ```
   📧 Activation URL: http://localhost:5173/activate?token=abc123xyz789
   ```

3. **Open activation link in browser**:
   ```
   http://localhost:5173/activate?token=abc123xyz789
   ```

4. **Verify backend activation**:
   ```sql
   -- Check user status
   SELECT id, email, status, accountStatus, emailVerified, updatedAt 
   FROM User 
   WHERE email = 'test@example.com';
   
   -- Should show:
   -- status: 'ACTIVE'
   -- accountStatus: 'ACTIVE'
   -- emailVerified: 1
   ```

5. **Verify user can login**:
   - Navigate to `/auth`
   - Login with the activated account credentials
   - Should successfully authenticate

### Quick Test Commands

```bash
# 1. Register a new user (generates activation token)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","termsAccepted":true}'

# 2. Check activation link in console output (if SMTP not configured)

# 3. Activate account using the token from email/console
curl -X POST http://localhost:4000/api/v1/auth/activate \
  -H "Content-Type: application/json" \
  -d '{"token":"<TOKEN_FROM_EMAIL>"}'

# Expected response:
# {
#   "status": "OK",
#   "code": "ACCOUNT_ACTIVATED",
#   "message": "Account activated",
#   "userId": 123
# }

# 4. Verify account is active
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

## Testing Checklist

- [x] Email link format matches `/activate?token=`
- [x] Frontend route exists at `/activate`
- [x] Frontend reads token from query string
- [x] Frontend calls POST `/api/v1/auth/activate` with JSON body
- [x] Backend only accepts POST (no GET)
- [x] Backend reads token from request body
- [x] Backend sets `accountStatus = 'ACTIVE'`
- [x] Backend sets `emailVerified = 1`
- [x] Backend returns `userId` in response
- [x] Activation is idempotent (clicking twice works)
- [x] Invalid/expired tokens return proper error
- [x] User can login after activation
- [x] Post-activation email sent on first activation (PENDING → ACTIVE)
- [x] Post-activation email NOT sent on repeated activation (already ACTIVE)

## Migration Notes

### Breaking Changes
- **GET requests to `/api/v1/auth/activate` no longer work** - must use POST
- **Old email links pointing to `/auth/activate` will not work** - new links use `/activate`

### Backward Compatibility
- Old activation tokens in database are still valid (uses same token validation logic)
- Users with old email links need to request a new activation email

## Future Improvements

1. Consider adding rate limiting to activation endpoint
2. Consider adding resend activation email option on error page
3. Consider adding expiration time display in email template
4. Consider adding activation link click tracking for analytics

## Post-Activation Email: Account Activated

### Overview

After a user successfully activates their account via the activation flow, a confirmation email is automatically sent to confirm the activation. This email is sent **only once**, only when the user transitions from `PENDING` → `ACTIVE` status.

### Email Details

**Subject:** `Account Activated — OGC NewFinity`

**Content includes:**
- Clear confirmation message that the account has been activated
- Activation timestamp (formatted as localized date/time)
- Link to login page: `${FRONTEND_BASE_URL}/login`
- Security tip: "If you didn't activate this account, contact support."

### Idempotent Behavior

The activation confirmation email follows strict idempotency rules:

1. **First Activation (PENDING → ACTIVE):** Email is sent ✅
2. **Repeated Activation (Already ACTIVE):** Email is **NOT** sent ❌
   - Backend returns `OK` with code `ACCOUNT_ALREADY_ACTIVE`
   - No duplicate email is sent

### Implementation

**File:** `backend/src/services/emailService.js`

- Function: `sendAccountActivatedEmail({ to, displayName, activatedAt })`
- Uses the same email service infrastructure (SMTP or console mode)
- Follows the same template style as other transactional emails

**File:** `backend/src/controllers/activationController.js`

- Checks user status **before** activation update
- Stores `wasActiveBefore = (normalizeAccountStatus(user.accountStatus) === 'ACTIVE') || user.emailVerified === 1`
- Only sends email if `wasActiveBefore === false`
- Email sending failure does not affect activation success

### Console Mode Support

If SMTP is not configured, the activation confirmation email is logged to console exactly like other emails:

```
--- EMAIL (CONSOLE MODE) ---
TO: user@example.com
SUBJECT: Account Activated — OGC NewFinity
TEXT: [email text content]
HTML: [email HTML content]
--- END EMAIL ---
```

### Verification

To verify the post-activation email:

1. **Register a new user** → Get activation link from email/console
2. **Activate account** → Check console/SMTP for "Account Activated — OGC NewFinity" email
3. **Click activation link again** → Backend returns OK but **no second activation email** is sent

### Notes

- This email does **not** affect "New Login Detected" email logic
- Uses `FRONTEND_BASE_URL` for login links (consistent with other emails)
- Response JSON format remains unchanged

## Summary

All activation flows now use the canonical format:
- **Email link:** `{FRONTEND_BASE_URL}/activate?token=<TOKEN>`
- **Backend API:** `POST /api/v1/auth/activate` with `{ "token": "<TOKEN>" }`
- **Post-activation:** Confirmation email sent only on first activation (PENDING → ACTIVE)

This ensures consistency across email generation, frontend routing, and backend API, eliminating activation failures due to URL mismatches.

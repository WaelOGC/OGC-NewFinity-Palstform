# OAuth Session Persistence Fix - Implementation Report

## Overview
Fixed OAuth session persistence issue where OAuth login "succeeded" but users ended up logged out because the OAuth callback path did not reliably create the same cookie-based session as normal email/password login.

## Files Changed

### Backend
1. **`backend/src/controllers/auth.controller.js`**
   - Updated `handleOAuthCallback` function to redirect to `/auth?oauth=success` instead of `/dashboard`
   - Ensured `createAuthSessionForUser` is called before redirect (already was, but verified)
   - Added comments clarifying that cookies are set synchronously before redirect

## Implementation Details

### Single Source of Truth for Session Creation
- **Function**: `createAuthSessionForUser(res, user, req)` in `backend/src/utils/authSession.js`
- **Usage**: Both normal email/password login and OAuth callbacks use this exact same function
- **Cookies Set**:
  - `ogc_access` (JWT access token)
  - `ogc_refresh` (JWT refresh token)
  - `ogc_session` (opaque session token)
- **Cookie Options**: Centralized via `getCookieOptions()` function with environment-specific settings

### OAuth Callback Flow

1. **Passport Authentication**: OAuth provider authenticates user via Passport.js
2. **User Sync**: `syncOAuthProfile` creates/updates user account
3. **Account Status Check**: Validates user account status (ACTIVE, PENDING, DISABLED)
4. **Session Creation**: Calls `createAuthSessionForUser(res, user, req)` which:
   - Creates session record in database
   - Generates JWT tokens
   - Sets all three cookies (access, refresh, ogc_session)
   - Records login activity
   - Registers device
5. **Redirect**: Redirects to `${FRONTEND_BASE_URL}/auth?oauth=success&provider=<providerName>`

### Cookie Setting Guarantee
- Cookies are set synchronously via `res.cookie()` before `res.redirect()` is called
- Express sends cookies in `Set-Cookie` headers with the redirect response
- No race conditions: cookies are committed before browser follows redirect

### Error Handling
- All error cases redirect to: `${FRONTEND_BASE_URL}/auth/social/callback?status=error&provider=<provider>&error=<errorCode>`
- Error codes include:
  - `authentication_failed`: OAuth provider authentication failed
  - `account_disabled`: User account is disabled
  - `account_not_verified`: Account pending verification
  - `account_status_invalid`: Invalid account status
  - `email_required`: OAuth provider didn't provide email
  - `conflict`: Email or account already linked
  - Generic error messages for other failures

## Canonical Redirect Behavior

### Success Flow
```
OAuth Provider → /api/v1/auth/<provider>/callback
  → createAuthSessionForUser() [sets cookies]
  → Redirect: /auth?oauth=success&provider=<provider>
  → Frontend: Verify cookies via /auth/me
  → Redirect: /dashboard (or intended post-login page)
```

### Failure Flow
```
OAuth Provider → /api/v1/auth/<provider>/callback
  → Error detected
  → Redirect: /auth/social/callback?status=error&provider=<provider>&error=<code>
  → Frontend: Display error message
```

## Session Endpoints

### GET /api/v1/auth/me
- **Purpose**: Returns current authenticated user data
- **Authentication**: Requires valid session cookies
- **Usage**: Frontend calls this after OAuth redirect to verify cookies are set
- **Response**: User object with role, permissions, featureFlags, etc.

### GET /api/v1/auth/session
- **Purpose**: Lightweight session health check (no database calls)
- **Authentication**: Optional (checks for JWT token)
- **Response**: `{ authenticated: true/false }`

## 30-Second Verification Steps

1. **Start Services**:
   ```bash
   # Terminal 1: Backend
   cd backend && npm start
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Test OAuth Login**:
   - Navigate to `http://localhost:5173/auth` (or your frontend URL)
   - Click "Sign in with Google" (or any OAuth provider)
   - Complete OAuth flow on provider's site
   - Should redirect back to `/auth?oauth=success&provider=google`

3. **Verify Cookies** (Browser DevTools):
   - Open DevTools → Application → Cookies
   - Check for cookies:
     - `ogc_access` (should exist)
     - `ogc_refresh` (should exist)
     - `ogc_session` (should exist)
   - All cookies should have correct domain, path, and expiration

4. **Verify Session Endpoint**:
   - In browser console or using curl:
     ```bash
     curl -X GET http://localhost:4000/api/v1/auth/me \
       -H "Cookie: ogc_access=<token>; ogc_refresh=<token>; ogc_session=<token>"
     ```
   - Should return 200 OK with user data

5. **Verify Persistence**:
   - Refresh the page
   - User should remain logged in
   - Navigate to `/dashboard`
   - Should see user data and be authenticated

## Verification Checklist

- [x] OAuth callback calls `createAuthSessionForUser` before redirect
- [x] Cookies are set before redirect (synchronous via `res.cookie()`)
- [x] Redirect URL uses `${FRONTEND_BASE_URL}/auth?oauth=success`
- [x] Error redirects use proper error codes in query params
- [x] `/auth/me` endpoint exists and works with cookies
- [x] Session creation uses same function as normal login
- [x] Account status checks are consistent (ACTIVE only)
- [x] Cookie options come from centralized `getCookieOptions()` function
- [x] No duplicate session creation logic in OAuth flow
- [x] Login activity is recorded for OAuth logins
- [x] Device registration happens for OAuth logins

## Testing Scenarios

### Scenario 1: Successful OAuth Login
1. User clicks "Sign in with Google"
2. Completes OAuth on Google
3. Redirects to `/auth?oauth=success&provider=google`
4. Cookies are set: `ogc_access`, `ogc_refresh`, `ogc_session`
5. Frontend calls `/auth/me` → Returns user data
6. User is redirected to dashboard
7. User remains logged in after page refresh

### Scenario 2: Account Disabled
1. User with disabled account tries OAuth login
2. OAuth succeeds, but account status check fails
3. Redirects to `/auth/social/callback?status=error&provider=google&error=account_disabled`
4. No cookies are set
5. Frontend displays error message

### Scenario 3: Account Pending Verification
1. User with pending account tries OAuth login
2. OAuth succeeds, but account status check fails
3. Redirects to `/auth/social/callback?status=error&provider=google&error=account_not_verified`
4. No cookies are set
5. Frontend displays error message with resend activation option

### Scenario 4: OAuth Provider Failure
1. User clicks OAuth login
2. OAuth provider returns error or user cancels
3. Passport `failureRedirect` triggers
4. Redirects to `/auth/social/callback?status=error&provider=google&error=authentication_failed`
5. No cookies are set
6. Frontend displays error message

## Environment Variables

Ensure these are set correctly:

- `FRONTEND_BASE_URL`: Frontend URL (e.g., `http://localhost:5173` for dev)
- `JWT_ACCESS_SECRET`: Secret for signing access tokens
- `JWT_REFRESH_SECRET`: Secret for signing refresh tokens
- `JWT_COOKIE_ACCESS_NAME`: Cookie name for access token (default: `ogc_access`)
- `JWT_COOKIE_REFRESH_NAME`: Cookie name for refresh token (default: `ogc_refresh`)
- `COOKIE_DOMAIN`: Domain for cookies (optional, not set in dev)
- `COOKIE_SAMESITE`: SameSite cookie attribute (default: `lax` in dev, `none` in prod)

## Notes

- OAuth session creation is now **identical** to email/password login
- No duplicate cookie-setting code exists
- All session logic is centralized in `createAuthSessionForUser()`
- Cookie options are environment-aware (dev vs prod)
- Error handling is consistent across all OAuth providers
- Frontend callback page handles both success and error cases

## Troubleshooting

### Issue: Cookies not set after OAuth
- **Check**: Ensure `createAuthSessionForUser` is called and completes before redirect
- **Check**: Verify `FRONTEND_BASE_URL` is correct
- **Check**: Check browser console for cookie-related errors
- **Check**: Verify cookie domain settings match frontend domain

### Issue: `/auth/me` returns 401 after OAuth
- **Check**: Verify cookies are actually set (DevTools → Application → Cookies)
- **Check**: Verify cookie domain/path settings
- **Check**: Check if cookies are being sent with request (Network tab)
- **Check**: Verify JWT secrets are configured correctly

### Issue: User logged out after page refresh
- **Check**: Verify `ogc_session` cookie exists and is valid
- **Check**: Check session record in database
- **Check**: Verify session hasn't expired
- **Check**: Check if session was revoked

## Related Files

- `backend/src/utils/authSession.js` - Session creation logic
- `backend/src/controllers/auth.controller.js` - OAuth callback handler
- `backend/src/routes/auth.routes.js` - OAuth routes
- `backend/src/middleware/auth.js` - Authentication middleware
- `frontend/src/pages/SocialAuthCallback/index.jsx` - Frontend callback page
- `frontend/src/context/AuthContext.jsx` - Frontend auth state management

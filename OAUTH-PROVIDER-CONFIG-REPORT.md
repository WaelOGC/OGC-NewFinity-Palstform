# OAuth Provider Configuration Report

## Overview

This document describes the OAuth provider configuration system, canonical callback URLs, and the missing email flow implementation.

## Canonical Callback URLs

All OAuth providers use canonical callback URLs derived from `BACKEND_URL` environment variable. The format is consistent across all providers:

```
${BACKEND_URL}/api/v1/auth/${provider}/callback
```

### Provider-Specific Callback URLs

- **Google**: `${BACKEND_URL}/api/v1/auth/google/callback`
- **GitHub**: `${BACKEND_URL}/api/v1/auth/github/callback`
- **Discord**: `${BACKEND_URL}/api/v1/auth/discord/callback`
- **Twitter**: `${BACKEND_URL}/api/v1/auth/twitter/callback`
- **LinkedIn**: `${BACKEND_URL}/api/v1/auth/linkedin/callback`

### Configuration Location

Callback URLs are defined in `backend/src/utils/oauthConfig.cjs` using the `getOAuthCallbackUrl(provider)` function. All passport strategy configurations use this function to ensure consistency.

**CommonJS Compatibility Note**: The backend uses CommonJS for OAuth configuration utilities. The `oauthConfig` module is a `.cjs` file and must be imported using `require()` via `createRequire()` in ESM files. Do not use top-level `await import()` in `src/index.js` or other startup files; use `require()` instead.

## Redirect URI Configuration in Provider Dashboards

When configuring OAuth apps in provider dashboards, you must add the canonical callback URL to the list of authorized redirect URIs.

### Google OAuth Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add to "Authorized redirect URIs":
   - `https://your-backend-domain.com/api/v1/auth/google/callback` (production)
   - `http://localhost:4000/api/v1/auth/google/callback` (development)

### GitHub OAuth App Settings
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Edit your OAuth App
3. Add to "Authorization callback URL":
   - `https://your-backend-domain.com/api/v1/auth/github/callback` (production)
   - `http://localhost:4000/api/v1/auth/github/callback` (development)

### Discord Developer Portal
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → OAuth2
3. Add to "Redirects":
   - `https://your-backend-domain.com/api/v1/auth/discord/callback` (production)
   - `http://localhost:4000/api/v1/auth/discord/callback` (development)

### Twitter Developer Portal
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app → Settings → User authentication settings
3. Add to "Callback URI / Redirect URL":
   - `https://your-backend-domain.com/api/v1/auth/twitter/callback` (production)
   - `http://localhost:4000/api/v1/auth/twitter/callback` (development)

### LinkedIn Developer Portal
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Select your app → Auth tab
3. Add to "Authorized redirect URLs":
   - `https://your-backend-domain.com/api/v1/auth/linkedin/callback` (production)
   - `http://localhost:4000/api/v1/auth/linkedin/callback` (development)

## Missing Email Flow

### Problem

Some OAuth providers may not return an email address (or users may have hidden it). We must handle this gracefully without creating broken sessions or incorrect account linking.

### Solution

When an OAuth provider doesn't return an email:

1. **OAuth Callback Handler Detection**: The callback handler detects missing email via a special marker object (`__oauthMissingEmail`) passed from the passport verify callback.

2. **Email Ticket Creation**: A short-lived JWT ticket (10-minute TTL) is created containing:
   - Provider name
   - Provider user ID
   - Display name (if available)
   - Avatar URL (if available)

3. **Redirect to Frontend**: User is redirected to:
   ```
   ${FRONTEND_BASE_URL}/auth?oauth=needs_email&provider=${provider}&ticket=${ticket}
   ```

4. **Email Collection**: Frontend shows a form asking for email address.

5. **Completion**: User submits email, which is sent to `/api/v1/auth/oauth/complete` endpoint:
   - Ticket is verified
   - Email format is validated
   - If user exists with that email: provider is linked to existing account
   - If user doesn't exist: new user is created with provided email
   - Session is created via `createAuthSessionForUser()`
   - User is redirected to dashboard

### Implementation Files

- **Backend Utilities**:
  - `backend/src/utils/oauthConfig.cjs` - Canonical URL utilities (CommonJS module)
  - `backend/src/utils/oauthEmailTicket.js` - JWT ticket creation/verification
  - `backend/src/controllers/auth.controller.js` - Missing email detection and ticket creation
  - `backend/src/routes/auth.routes.js` - `/api/v1/auth/oauth/complete` endpoint

- **Frontend**:
  - `frontend/src/pages/AuthPage/index.jsx` - Missing email form UI
  - `frontend/src/utils/apiClient.js` - API client route registration

### Email Ticket Security

- Uses dedicated `OAUTH_EMAIL_TICKET_SECRET` environment variable (falls back to `JWT_ACCESS_SECRET` in dev with warning)
- 10-minute expiration
- Contains only provider ID and profile data (no sensitive info)
- Single-use (verified once then ticket is consumed)

## Success Redirect URLs

After successful OAuth authentication (with or without missing email flow), users are redirected to:

```
${FRONTEND_BASE_URL}/auth?oauth=success&provider=${provider}
```

The frontend then:
1. Verifies cookies are set by calling `/api/v1/auth/me`
2. Updates auth context
3. Redirects to `/dashboard`

## 60-Second Verification Steps

### Test OAuth with Email (Normal Flow)

1. **Start backend server** - Verify callback URLs are printed:
   ```
   [OAuth Config] Backend URL: http://localhost:4000
   [OAuth Config] Frontend URL: http://localhost:3000
   [OAuth Config] Callback URLs:
   [OAuth Config]   google: http://localhost:4000/api/v1/auth/google/callback
   [OAuth Config]   github: http://localhost:4000/api/v1/auth/github/callback
   ...
   ```

2. **Initiate OAuth login** - Click "Sign in with Google" (or other provider)

3. **Complete OAuth flow** - Authenticate with provider

4. **Verify redirect** - Should land at `/auth?oauth=success&provider=google`

5. **Check session** - Should be logged in, cookies set, `/api/v1/auth/me` works

6. **Verify redirect** - Should automatically redirect to `/dashboard`

### Test Missing Email Flow (Simulated)

To simulate missing email (for testing):

1. **Modify provider profile** - In `backend/src/config/passportProviders.js`, temporarily force email to null:
   ```javascript
   // In extractOAuthProfileData, force email = null for testing
   email = null; // FOR TESTING ONLY
   ```

2. **Initiate OAuth login** - Click "Sign in with [Provider]"

3. **Verify redirect** - Should land at `/auth?oauth=needs_email&provider=[provider]&ticket=[ticket]`

4. **Provide email** - Enter email address in form

5. **Submit** - Complete authentication

6. **Verify session** - Should be logged in, cookies set, redirect to dashboard

**Note**: Some providers (like GitHub with `user:email` scope) always return email. To test missing email flow, you may need to use a test account with email hidden or modify the code temporarily.

## Common Troubleshooting

### Wrong Callback URL

**Symptoms**: OAuth provider shows "redirect_uri_mismatch" error

**Solution**: 
1. Check backend startup logs for printed callback URLs
2. Verify `BACKEND_URL` environment variable matches your actual backend URL
3. Add exact callback URL (from logs) to provider dashboard redirect URI list
4. Ensure no trailing slashes or protocol mismatches (http vs https)

### FRONTEND_BASE_URL Wrong

**Symptoms**: After OAuth, user is redirected to wrong URL or gets 404

**Solution**:
1. Check backend startup logs for printed Frontend URL
2. Verify `FRONTEND_BASE_URL` environment variable is set correctly
3. Ensure it matches your actual frontend URL (including protocol and port if needed)

**Warning**: If `FRONTEND_BASE_URL` is missing, you'll see:
```
[OAuth Config] WARNING: FRONTEND_BASE_URL is missing. OAuth redirects will be wrong.
```

### Provider Didn't Return Email

**Symptoms**: User lands on `/auth?oauth=needs_email...` instead of success page

**Solution**: This is expected behavior. The user should:
1. See email input form
2. Provide their email address
3. Complete authentication
4. Be redirected to dashboard

**Note**: Some providers may not return email if:
- User has email visibility set to private
- Provider requires additional permissions/scopes
- Provider doesn't support email in OAuth profile

**Prevention**: Ensure OAuth scopes include email:
- GitHub: `['user:email']` ✓ (already configured)
- Google: `['profile', 'email']` ✓ (already configured)
- Discord: `['identify', 'email']` ✓ (already configured)
- LinkedIn: `['openid', 'profile', 'email']` ✓ (already configured)
- Twitter: `includeEmail: true` ✓ (already configured)

### Cookies Not Set

**Symptoms**: After OAuth success, user is not logged in, `/api/v1/auth/me` returns 401

**Solution**:
1. Check browser developer tools → Application → Cookies
2. Verify cookies `ogc_access` and `ogc_refresh` are present
3. Check cookie attributes:
   - `SameSite` should be `Lax` (dev) or `None` (production with HTTPS)
   - `Secure` should be `false` (dev) or `true` (production)
   - `Domain` should match your domain (or be unset for localhost)
4. Verify CORS configuration includes credentials
5. See `OAUTH-SESSION-REPORT.md` for detailed cookie troubleshooting

### Ticket Expired

**Symptoms**: User tries to complete OAuth with email but gets "ticket expired" error

**Solution**:
- Email tickets expire after 10 minutes
- User must complete email submission within 10 minutes
- If expired, user should restart OAuth flow
- Check ticket creation time in backend logs

## Environment Variables

### Required

- `FRONTEND_BASE_URL` - Frontend base URL (e.g., `http://localhost:3000` or `https://app.example.com`)
- `BACKEND_URL` - Backend base URL (e.g., `http://localhost:4000` or `https://api.example.com`)
  - If not set, defaults to `http://localhost:${PORT}`

### Optional

- `OAUTH_EMAIL_TICKET_SECRET` - Secret for signing OAuth email tickets
  - If not set, falls back to `JWT_ACCESS_SECRET` (dev only, logs warning)
  - Recommended to set in production for security

### Provider-Specific (Optional)

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`

## Startup Verification

On backend startup, OAuth configuration is printed:

```
[OAuth Config] OAuth Configuration:
[OAuth Config] Backend URL: http://localhost:4000
[OAuth Config] Frontend URL: http://localhost:3000
[OAuth Config] Callback URLs:
[OAuth Config]   google: http://localhost:4000/api/v1/auth/google/callback
[OAuth Config]   github: http://localhost:4000/api/v1/auth/github/callback
[OAuth Config]   discord: http://localhost:4000/api/v1/auth/discord/callback
[OAuth Config]   twitter: http://localhost:4000/api/v1/auth/twitter/callback
[OAuth Config]   linkedin: http://localhost:4000/api/v1/auth/linkedin/callback
```

If `FRONTEND_BASE_URL` is missing, a warning is printed:

```
[OAuth Config] WARNING: FRONTEND_BASE_URL is missing. OAuth redirects will be wrong.
```

Each provider strategy registration also logs its callback URL:

```
[OAuth Config] google callback: http://localhost:4000/api/v1/auth/google/callback
✓ Google OAuth strategy registered successfully
```

## Code References

- `backend/src/utils/oauthConfig.cjs` - Canonical URL utilities (CommonJS module)
- `backend/src/utils/oauthEmailTicket.js` - Email ticket JWT utilities
- `backend/src/config/passportProviders.js` - Passport strategy configuration
- `backend/src/controllers/auth.controller.js` - OAuth callback handler
- `backend/src/routes/auth.routes.js` - OAuth routes including `/oauth/complete`
- `backend/src/index.js` - Startup verification logging
- `frontend/src/pages/AuthPage/index.jsx` - Missing email UI

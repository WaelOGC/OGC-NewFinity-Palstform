# OAuth Profile Sync Implementation

## Overview

This document describes the unified OAuth profile sync system that handles linking OAuth accounts to users, supporting both login and connect flows.

## Key Components

### 1. Unified `syncOAuthProfile` Function

**Location:** `backend/src/services/userService.js`

**Purpose:** Single function that handles all OAuth account linking logic.

**Parameters:**
- `provider`: Provider name (google, github, twitter, linkedin, discord)
- `providerUserId`: Provider-specific user ID
- `email`: User email (may be null)
- `emailVerified`: Whether email is verified by provider
- `username`: Username from provider
- `displayName`: Display name from provider
- `avatarUrl`: Avatar URL from provider
- `profileJson`: Full provider profile JSON
- `existingUserId`: Optional - when user is already logged in and connecting provider

**Returns:** `{ user, isNewUser, isLinkedNewProvider }`

**Error Codes:**
- `OAUTH_EMAIL_REQUIRED`: No email provided and no existingUserId (cannot create account)
- `OAUTH_EMAIL_CONFLICT`: Email exists on different account during connect flow
- `OAUTH_ACCOUNT_ALREADY_LINKED`: Provider account already linked to another user

### 2. Profile Data Extraction

**Location:** `backend/src/config/passportProviders.js`

**Function:** `extractOAuthProfileData(provider, profile)`

Normalizes data from different OAuth providers into a common format:
- Google: `emails[0].value`, `displayName`, `photos[0].value`
- GitHub: `emails[0].value`, `username/login`, `_json.avatar_url`
- Twitter: `emails[0].value`, `username`, `_json.profile_image_url_https`
- LinkedIn: `emails[0].value`, `displayName`, `photos[0].value`
- Discord: `email`, `username/global_name`, constructed avatar URL

### 3. OAuth Callback Handler

**Location:** `backend/src/controllers/auth.controller.js`

**Function:** `handleOAuthCallback(req, res, next, providerName)`

**Features:**
- Handles both login and connect flows
- Supports JSON responses for API-first approach
- Checks account status (deleted, disabled)
- Creates auth session for login flow
- Skips session creation for connect flow (just links provider)

**Connect Flow Detection:**
- Checks `req.query.state` for JWT containing `{ userId, action: 'connect' }`
- If found, links provider to that user instead of creating new session

### 4. Connect/Disconnect Routes

**Location:** `backend/src/routes/auth.routes.js`

**Routes:**
- `GET /api/v1/auth/oauth/connect/:provider` - Connect provider (requires auth)
- `POST /api/v1/auth/oauth/disconnect/:provider` - Disconnect provider (requires auth)

**Connect Flow:**
1. User clicks "Connect" button (must be logged in)
2. Route creates JWT state token with userId
3. Redirects to OAuth provider with state parameter
4. Provider redirects back to callback
5. Callback extracts state, links provider to logged-in user

**Disconnect Flow:**
1. User clicks "Disconnect" button
2. Route checks if provider is connected
3. Prevents disconnection if it's the last auth method
4. Sets provider column to NULL
5. Returns success

### 5. Connected Providers in User Data

**Location:** `backend/src/services/userService.js`

**Function:** `getConnectedProviders(userId)`

Returns array of provider names (e.g., `['google', 'github']`) based on which provider ID columns are set.

**Included in:** `/auth/me` response as `user.connectedProviders`

## Frontend Integration

### Security Page

**Location:** `frontend/src/pages/dashboard/Security.jsx`

**Features:**
- Shows list of all providers (Google, GitHub, Twitter, LinkedIn, Discord)
- Displays connection status for each
- "Connect" button for unconnected providers
- "Disconnect" button for connected providers
- Refreshes user data after connect/disconnect

### AuthContext

**Location:** `frontend/src/context/AuthContext.jsx`

**Updates:**
- User object now includes `connectedProviders` array
- Automatically refreshed when user data is fetched

## Error Handling

### No Email Scenario

If provider doesn't provide email and user is not logged in:
- Returns `OAUTH_EMAIL_REQUIRED` error
- Message: "Your OAuth provider did not share an email. Please sign up with email or link from an existing account."

### Email Conflict Scenario

If email exists on different account during connect flow:
- Returns `OAUTH_EMAIL_CONFLICT` error
- Message: "This email is already used by another account."
- Prevents silent account linking across different accounts

### Account Already Linked

If provider account is already linked to a different user:
- Returns `OAUTH_ACCOUNT_ALREADY_LINKED` error
- Message: "This OAuth account is already linked to another user."

## Database Schema

Uses column-based approach (no separate OAuthAccount table):
- `googleId` VARCHAR(255) NULL
- `githubId` VARCHAR(255) NULL
- `twitterId` VARCHAR(255) NULL
- `linkedinId` VARCHAR(255) NULL
- `discordId` VARCHAR(255) NULL
- `authProvider` VARCHAR(50) NULL
- `avatarUrl` VARCHAR(500) NULL

All provider ID columns are indexed for fast lookups.

## Testing Checklist

### Backend

1. **New User OAuth Login:**
   - Provider provides email → creates new user, links provider
   - Provider doesn't provide email → returns OAUTH_EMAIL_REQUIRED

2. **Existing User OAuth Login:**
   - Email matches existing account → links provider to that account
   - Provider ID already linked → returns existing user

3. **Connect Flow:**
   - Logged-in user connects provider → links to logged-in user
   - Provider already linked to different user → returns OAUTH_ACCOUNT_ALREADY_LINKED
   - Email conflict → returns OAUTH_EMAIL_CONFLICT

4. **Disconnect Flow:**
   - Disconnect connected provider → success
   - Disconnect last auth method → returns CANNOT_DISCONNECT_LAST_AUTH

### Frontend

1. **Security Page:**
   - Shows correct connection status for each provider
   - Connect button works and redirects correctly
   - Disconnect button works and refreshes data

2. **User Data:**
   - `/auth/me` returns `connectedProviders` array
   - AuthContext updates when providers are connected/disconnected

## Notes

- All responses use consistent JSON format: `{ status: 'OK'|'ERROR', code: '...', message: '...', data: {...} }`
- Browser redirects are used for OAuth flows (required by OAuth 2.0)
- JSON responses are supported for API-first approach (when `Accept: application/json` header is present)
- Connect flow uses JWT in OAuth state parameter to securely pass userId
- State token expires in 10 minutes for security

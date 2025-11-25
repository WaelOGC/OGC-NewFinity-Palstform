# OGC NewFinity Platform — Auth System Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal; Security-Critical)**

## 1. Purpose

This document defines the complete internal authentication system used by the OGC NewFinity Platform, including:

- Token generation
- Token refresh lifecycle
- Role & permission enforcement
- Security rules
- Middleware behavior
- Session expiration
- Logout logic
- Admin-specific overrides

This document must remain consistent with the Auth API Blueprint.

## 2. Auth Architecture Overview

Authentication follows a dual-token strategy:

- **Access Token (JWT)** — short-lived, used for authorization
- **Refresh Token (Secure Cookie)** — long-lived, used to generate new access tokens

**Architecture flow:**

```
Frontend →
Auth API →
Token Manager →
User Store (DB) →
Session Validator →
Frontend (updated tokens)
```

## 3. Token Types

### 3.1 Access Token

- **Format:** JWT
- **Purpose:** Authorize access to protected routes
- **Lifespan:** ~15 minutes
- **Transport:** `Authorization: Bearer <token>` header
- **Stored:** In memory only (React state / context)

**Contains:**

- `user_id`
- `role`
- `issued_at`
- `expires_at`

### 3.2 Refresh Token

- Stored as HTTP-only, Secure, SameSite=strict cookie
- Cannot be accessed by JavaScript
- **Lifespan:** ~7–14 days
- Used to silently refresh the Access Token
- Revoked on logout or admin action

## 4. Authentication Flow

### 4.1 Login Flow

```
User submits credentials →
Backend validates email + password →
If valid:
    Generate Access Token
    Generate Refresh Token
    Set secure cookie
    Return user object + access token
UI redirects to /dashboard
```

On invalid credentials:

- 401 Unauthorized
- Detailed error not exposed (security rule)

### 4.2 Silent Refresh Flow

**Triggered when:**

- Access token expires
- API client receives 401 from server

**Flow:**

```
client.js calls /auth/refresh →
Backend validates Refresh Token →
If valid:
    Issue new Access Token
    Return new token
Retry original request
```

On invalid refresh:

- Clear cookies
- Redirect to `/login`

### 4.3 Logout Flow

```
Frontend calls /auth/logout →
Backend clears Refresh Token cookie →
Frontend clears access token from memory →
Redirect user to homepage or login
```

Sessions must end immediately.

## 5. Registration & Verification

### 5.1 Register

**User provides:**

- email
- password
- name (optional)

**Flow:**

- Create user in DB
- Send verification email (Phase 2)
- Redirect to `/login`

### 5.2 Verification (Phase 2)

- One-time verification token
- After verification → user becomes active

## 6. Role & Permission System

**Roles:**

- USER
- ADMIN
- PARTNER (future)

**Permissions:**

| Action | USER | ADMIN |
|--------|------|-------|
| Access Wallet | ✔ | ✔ |
| Use Amy Agent | ✔ | ✔ |
| Participate in Challenges | ✔ | ✔ |
| View Admin Panel | ✖ | ✔ |
| Adjust Contribution | ✖ | ✔ |
| Award Badges | ✖ | ✔ |
| Suspend Accounts | ✖ | ✔ |

Role is stored in:

- `USERS.role`

## 7. Backend Auth Middleware

Middleware ensures:

- Access token exists
- Token is valid
- Token is not expired
- User exists
- User status is active

If checks fail:

- Respond with 401 Unauthorized
- Log event in `activity_log`

Admin routes also require:

- `role === "admin"`

## 8. Security Rules

### 8.1 Passwords

- Must be hashed using bcrypt or Argon2
- Never logged
- Never returned to frontend

### 8.2 Tokens

- Refresh tokens must be HTTP-only
- Must be rotated on each use
- Access tokens must be short-lived

### 8.3 Brute-force protection

**Future:**

- Rate limit login attempts
- Lock account temporarily

### 8.4 Session Hijacking Prevention

- IP binding (optional Phase 2)
- User-agent binding
- Token rotation

## 9. Error Handling

**Login Errors**

- Always return generic errors
- Do not reveal if email exists

**Token Errors**

- Expired token → 401
- Invalid token → 401
- Missing refresh cookie → 401

**Role Errors**

- Unauthorized access → 403

Errors must be logged.

## 10. Database Interaction

**USERS Table**

Contains:

- `id`, `email`, `password_hash`, `role`, `status`

**STATUS_LOG**

Tracks:

- Suspensions
- Reactivations

**ROLES_LOG**

Tracks:

- Promotion/demotion
- Admin-invoked changes

## 11. API Endpoints (Internal Reference)

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/verify` (future)

All must follow the same response structure.

## 12. Integration With Other Modules

**Wallet**

- Requires valid access token
- Requires status = active

**Contribution**

- Contribution events are logged under authenticated context

**Badges**

- Badge updates reflect authenticated user

**Challenges**

- Challenge submissions require authentication

**Admin Tools**

- Token must contain `role: "admin"`

## 13. Versioning & Maintenance

Update this document when:

- Token structure changes
- Auth API is updated
- New roles are added
- Verification system launches
- 2FA is introduced (future)

Log changes in `docs/changelog.md`.

## 14. Linked Documents

- `/docs/api/auth-api-blueprint.md`
- `/docs/flows/frontend-backend-db-flow.md`
- `/docs/admin/admin-tools-overview.md`
- `/docs/database/schema-overview.md`
- `/docs/frontend/base-layout-components.md`


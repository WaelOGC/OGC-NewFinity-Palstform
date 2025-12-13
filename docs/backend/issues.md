# Backend Issues and Pending Fixes

This document tracks known issues and pending fixes for the OGC NewFinity Platform backend.

---

## ⚠ Pending Fixes – OAuth / Social Authentication

The OAuth login system (Google, GitHub, Discord, etc.) is currently not functioning as expected.
Although the email/password login flow is stable, the social authentication flow still has issues that prevent users from remaining logged in after completing OAuth sign-in.

### Symptoms:

- After completing Google or social login, the user is not kept logged in.
- `/auth/me` may return 401 after OAuth login.
- The OAuth callback sometimes fails to establish a persistent session.
- Behavior differs from the stable email/password login flow.

### Status:

- The issue is known and confirmed.
- The current OAuth implementation requires review and repair.
- Do not rely on Google/social login in production until this is fixed.

### Required Actions (Team Task):

1. Review OAuth callback session creation logic.
2. Verify cookie/session persistence after OAuth login.
3. Ensure `/auth/me` works consistently with OAuth-based sessions.
4. Confirm that connecting/disconnecting providers in the Security page works without breaking login.
5. Re-test all providers after fixes are applied.

**This note is for internal tracking and must remain until the issue is fully resolved.**

---

## Resolved Issues

### Auth Lifecycle URL Mismatches (Resolved 2024-12-XX)

### Problem:
Activation and password reset email links did not match frontend routes, causing users to be unable to activate accounts or reset passwords.

### Symptoms:
- Activation email links pointed to `/activate` but frontend route is `/auth/activate`
- Password reset email links (old flow) pointed to `/reset-password` but frontend route is `/auth/reset-password`
- Users clicking email links would get 404 errors or land on wrong pages

### Fixes Applied:
1. **Activation Email Link** (`backend/src/services/emailService.js`):
   - Changed from `/activate?token=...` to `/auth/activate?token=...`
   - Now matches frontend route `/auth/activate` (defined in `frontend/src/main.jsx`)

2. **Password Reset Email Link** (`backend/src/controllers/auth.controller.js` - `forgotPassword`):
   - Changed from `/reset-password?token=...` to `/auth/reset-password?token=...`
   - Now matches frontend route `/auth/reset-password`
   - New flow (`requestPasswordReset`) already used correct URL pattern

### Verification:
- ✅ Activation controller correctly reads token from `req.query.token || req.body.token` (supports both GET and POST)
- ✅ Activation controller validates token, updates user status to 'active', and marks token as used
- ✅ Password reset endpoints (`/api/v1/auth/reset-password` and `/api/v1/auth/password/reset/complete`) both work correctly
- ✅ Frontend routes match email link paths

### Status: **RESOLVED**

The complete auth lifecycle should now work:
1. Register → Receive activation email → Click link → Account becomes ACTIVE
2. Can log in after activation
3. Forgot password → Receive reset email → Click link → Reset password → Can log in with new password

---

# PHASE S3 — Account Data Export ("Download my data") Implementation Report

## Overview

This phase implements a secure, authenticated endpoint that generates a JSON account export for the currently logged-in user. The export includes profile information, sessions & devices, two-factor authentication status, and security activity logs. The feature is accessible via a "Download my data" button on the Security page.

## Backend Changes

### 1. Service Layer: `backend/src/services/accountExportService.js` (NEW)

Created a new service module to assemble the export payload:

- **Profile Section**: Queries the `User` table for basic profile information (id, email, username, fullName, country, phone, createdAt, updatedAt, lastLoginAt). Excludes sensitive data like password hashes, reset tokens, and verification tokens.

- **Sessions & Devices Section**: Queries the `AuthSession` table for all sessions belonging to the user. Includes fields: id, createdAt, lastSeenAt, expiresAt, ipAddress, userAgent, deviceFingerprint, revokedAt. Gracefully handles missing table (returns empty array).

- **Two-Factor Section**: Queries the `UserTwoFactor` table for 2FA status. Returns only metadata (isEnabled, createdAt, confirmedAt, updatedAt) - **never includes the secret**. Gracefully handles missing table.

- **Security Activity Section**: Queries the `UserActivityLog` table for the most recent 50 records. Includes: id, type (activityType), description, ipAddress, userAgent, createdAt. Wrapped in try/catch to gracefully handle missing table or schema differences.

- **Export Structure**: Returns a standardized object with:
  ```json
  {
    "generatedAt": "ISO timestamp",
    "version": "1.0",
    "profile": {...},
    "twoFactor": {...},
    "sessions": [...],
    "securityActivity": [...]
  }
  ```

### 2. Controller: `backend/src/controllers/account.controller.js`

Added `getAccountExport` handler:

- Validates user authentication (requires `req.user.id`)
- Calls `buildAccountExportForUser(userId)` to generate export payload
- Sets appropriate HTTP headers:
  - `Content-Type: application/json; charset=utf-8`
  - `Content-Disposition: attachment; filename="ogc-newfinity-account-export-YYYY-MM-DD.json"`
- Returns JSON string with 200 status
- Error handling: Returns 500 with user-friendly message if export generation fails

### 3. Routes: `backend/src/routes/account.routes.js`

Added new GET route:

```javascript
router.get('/export', requireAuth, accountController.getAccountExport);
```

- Protected with `requireAuth` middleware
- Mounted at `/api/v1/account/export` (via `/account` prefix in `routes/index.js`)

## Frontend Changes

### 1. API Client: `frontend/src/utils/apiClient.js`

**Added route to whitelist:**
```javascript
'GET /api/v1/account/export': true,
```

**Added new function `exportAccountData()`:**
- Uses `fetch` directly (bypasses JSON auto-parsing)
- Returns a `Blob` object for direct file download
- Handles errors gracefully with user-friendly messages
- Includes credentials for cookie-based authentication

**Kept legacy function `exportOwnAccountData()`** for backward compatibility (marked as deprecated).

### 2. Security Page: `frontend/src/pages/dashboard/Security.jsx`

**Updated state management:**
- Changed `exportLoading` → `exportBusy` (for consistency)
- Changed `exportSuccess` from string to boolean
- Kept `exportError` as string

**Updated `handleDownloadData()` function:**
- Calls `exportAccountData()` to get Blob
- Creates object URL from blob
- Generates filename: `ogc-newfinity-account-export-YYYY-MM-DD.json`
- Triggers download via temporary anchor element
- Cleans up object URL after download
- Shows success/error messages using new CSS classes

**Updated button and status messages:**
- Button uses `ogc-button-primary` class
- Shows "Preparing export…" while loading
- Error message uses `ogc-form-message ogc-form-message--error`
- Success message uses `ogc-form-message ogc-form-message--success`

### 3. CSS: `frontend/src/pages/dashboard/dashboard-pages.css`

Added new CSS classes for export status messages:

```css
.ogc-form-message {
  padding: 12px 16px;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

.ogc-form-message--error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.6);
  color: #fca5a5;
}

.ogc-form-message--success {
  background: rgba(0, 191, 166, 0.12);
  border: 1px solid rgba(0, 191, 166, 0.6);
  color: #00ffc6;
}
```

## Data Included in Export

### Profile
- id, email, username, fullName, country, phone
- createdAt, updatedAt, lastLoginAt
- **Excluded**: password hashes, reset tokens, verification tokens, secrets

### Sessions
- id, createdAt, lastSeenAt, expiresAt
- ipAddress, userAgent, deviceFingerprint
- revokedAt (if applicable)

### Two-Factor Authentication
- isEnabled (boolean)
- createdAt, confirmedAt, updatedAt (if enabled)
- **Excluded**: secret (never exported)

### Security Activity
- Most recent 50 records from UserActivityLog
- id, type (activityType), description
- ipAddress, userAgent, createdAt
- Gracefully handles missing table (returns empty array)

## Security Considerations

1. **Authentication Required**: Endpoint is protected with `requireAuth` middleware - only logged-in users can export their own data.

2. **No Secrets Exported**: 
   - Password hashes are never included
   - Password reset tokens are never included
   - Email verification tokens are never included
   - 2FA secrets are never included

3. **User-Scoped Data**: All queries filter by `userId` from the authenticated session - users can only export their own data.

4. **Graceful Degradation**: Missing tables (AuthSession, UserTwoFactor, UserActivityLog) are handled gracefully - export still succeeds with empty arrays for missing sections.

5. **Error Handling**: Export failures return user-friendly error messages without exposing internal details.

## Testing Checklist

### Backend Testing

- [x] Service compiles without errors
- [ ] Hit `GET /api/v1/account/export` with authenticated request (cookie/JWT)
- [ ] Verify response status: 200
- [ ] Verify headers include `Content-Type: application/json` and `Content-Disposition` with expected filename
- [ ] Verify JSON body contains: `generatedAt`, `version`, `profile`, `twoFactor`, `sessions`, `securityActivity`
- [ ] Verify profile data excludes password hashes and secrets
- [ ] Verify 2FA section excludes secret
- [ ] Test with user who has no sessions (empty array)
- [ ] Test with user who has no 2FA setup (isEnabled: false)
- [ ] Test with user who has no activity logs (empty array)

### Frontend Testing

- [x] Component compiles without errors
- [ ] Navigate to Security page while logged in
- [ ] Click "Download my data" button
- [ ] Verify button shows "Preparing export…" while loading
- [ ] Verify file downloads with name like `ogc-newfinity-account-export-2025-12-12.json`
- [ ] Verify file opens as valid JSON
- [ ] Verify file contains expected sections (profile, twoFactor, sessions, securityActivity)
- [ ] Verify success message appears after download
- [ ] Test error handling (e.g., disconnect backend) - verify error message appears
- [ ] Verify no errors in browser console

### Regression Testing

- [ ] Change password still works
- [ ] Sessions & devices cards still render correctly
- [ ] 2FA enable/disable still works
- [ ] Amy / Wallet / Overview routes are unaffected
- [ ] Other Security page features (delete account, etc.) still work

## Files Modified

### Backend
1. `backend/src/services/accountExportService.js` (NEW)
2. `backend/src/controllers/account.controller.js`
3. `backend/src/routes/account.routes.js`

### Frontend
1. `frontend/src/utils/apiClient.js`
2. `frontend/src/pages/dashboard/Security.jsx`
3. `frontend/src/pages/dashboard/dashboard-pages.css`

## Notes

- The export uses version "1.0" - future versions can add new fields while maintaining backward compatibility
- File naming follows pattern: `ogc-newfinity-account-export-YYYY-MM-DD.json`
- All database queries use parameterized statements to prevent SQL injection
- The service gracefully handles missing tables (common during initial setup or migrations)

## Future Enhancements

- Add pagination for security activity (currently limited to 50 records)
- Add export format options (JSON, CSV, etc.)
- Add scheduled exports (email delivery)
- Add export history tracking
- Add data retention policies for exports

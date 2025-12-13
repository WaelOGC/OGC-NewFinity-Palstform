# Phase S5: 2FA Recovery Codes Implementation Report

**Date:** 2024  
**Phase:** S5  
**Feature:** Two-Factor Authentication Recovery Codes  
**Status:** ✅ Complete

## Overview

This implementation adds recovery codes functionality for 2FA, allowing users to generate, view, and download one-time recovery codes that can be used if they lose access to their authenticator app. Recovery codes are hashed in the database and can only be viewed once when generated.

## Database Schema

### UserTwoFactorRecovery Table

```sql
CREATE TABLE UserTwoFactorRecovery (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId <dynamic_type> NOT NULL,
  codeHash VARCHAR(128) NOT NULL,
  label VARCHAR(64) NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  usedAt DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_userId (userId),
  CONSTRAINT fk_recovery_user
    FOREIGN KEY (userId) REFERENCES User(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Design Decisions:**
- `userId` type is dynamically detected to match the User table's id column type (supports both INT and BIGINT)
- `codeHash` stores SHA-256 hashed recovery codes (never store plain codes)
- `used` flag tracks whether a code has been consumed
- `usedAt` timestamp records when a code was used
- `label` provides a human-readable identifier (e.g., "Code 1", "Code 2")
- Foreign key with CASCADE ensures recovery codes are deleted when a user is deleted

## Backend Implementation

### Service Layer

**File:** `backend/src/services/twoFactorRecoveryService.js`

**Functions:**
1. `generateRecoveryCodesForUser(userId)` - Generates 10 new recovery codes, invalidates old ones
2. `getRecoveryCodesStatusForUser(userId)` - Returns masked status (used/unused) without plain codes
3. `consumeRecoveryCode(userId, code)` - Validates and marks a recovery code as used (for Phase S6)

**Recovery Code Format:**
- Format: `XXXX-XXXX-XXXX-XXXX` (4 groups of 4 characters)
- Character set: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes ambiguous characters like I, O, 0, 1)
- Total length: 16 characters + 3 hyphens = 19 characters
- Generated using `crypto.randomInt()` for cryptographically secure randomness

**Security:**
- Codes are hashed using SHA-256 before storage
- Plain codes are only returned once during generation
- Old codes are deleted when new ones are generated (regeneration invalidates unused codes)

### Controller Layer

**File:** `backend/src/controllers/twoFactor.controller.js`

**New Handlers:**
1. `getRecoveryCodesStatus(req, res, next)` - GET `/account/2fa/recovery`
   - Returns masked list of recovery codes with used/unused status
   - Requires authentication

2. `regenerateRecoveryCodes(req, res, next)` - POST `/account/2fa/recovery/regenerate`
   - Generates new recovery codes
   - Returns plain codes (only shown once)
   - Invalidates all existing unused codes
   - Requires authentication

### Routes

**File:** `backend/src/routes/account.routes.js`

```javascript
// 2FA Recovery codes (Phase S5)
router.get('/2fa/recovery', requireAuth, twoFactorController.getRecoveryCodesStatus);
router.post('/2fa/recovery/regenerate', requireAuth, twoFactorController.regenerateRecoveryCodes);
```

### Migration

**File:** `backend/src/utils/ensurePhase5Migration.js`

Added `ensureUserTwoFactorRecoveryTable()` function that:
- Checks if `UserTwoFactorRecovery` table exists
- Dynamically detects `User.id` column type
- Creates table if missing
- Runs automatically on server startup (non-production environments)

## Frontend Implementation

### API Client

**File:** `frontend/src/utils/apiClient.js`

**New Functions:**
1. `getRecoveryCodesStatus()` - Fetches masked recovery codes status
2. `regenerateRecoveryCodes()` - Generates new recovery codes and returns plain codes

**Routes Added to ALLOWED_ROUTES:**
- `GET /api/v1/account/2fa/recovery`
- `POST /api/v1/account/2fa/recovery/regenerate`

### Security Page UI

**File:** `frontend/src/pages/dashboard/Security.jsx`

**New State:**
- `recoveryCodes` - Array of recovery code status objects
- `recoveryBusy` - Loading state for recovery operations
- `recoveryError` - Error message state
- `showRecoveryModal` - Controls recovery modal visibility
- `freshRecoveryCodes` - Plain codes after generation (only shown once)

**New Components:**
1. **Recovery Codes Card** - Shows status (unused/used counts) and button to open modal
2. **Recovery Codes Modal** - Allows generation, viewing, and downloading of recovery codes

**Features:**
- Status display showing unused/used code counts
- Generate new codes button (invalidates old unused codes)
- Display of plain codes in monospace font (only after generation)
- Download as text file functionality
- Error handling and loading states

### Styling

**File:** `frontend/src/pages/dashboard/dashboard-pages.css`

**New CSS Classes:**
- `.twofactor-recovery-list` - Container for recovery codes list
- `.twofactor-recovery-codes` - Scrollable container with gradient background
- `.twofactor-recovery-code-item` - Individual code display (monospace font)
- `.twofactor-recovery-actions` - Actions container (download button)
- `.ogc-modal-helper` - Helper text styling for modal

**Design:**
- Gradient backgrounds matching existing 2FA setup UI
- Monospace font for code readability
- Scrollable container for long code lists
- Consistent with existing modal and button styles

## Security Considerations

1. **Code Hashing:** All recovery codes are hashed using SHA-256 before storage. Plain codes are never stored in the database.

2. **One-Time View:** Plain recovery codes are only returned once during generation. After that, only masked status (used/unused) is available.

3. **Regeneration:** Generating new codes deletes all existing recovery codes, invalidating any unused codes.

4. **Authentication:** All recovery code endpoints require authentication via `requireAuth` middleware.

5. **Code Format:** Uses a character set that excludes ambiguous characters (I, O, 0, 1) to reduce user errors.

6. **Future Use:** The `consumeRecoveryCode()` function is implemented but not yet used in login flow. This will be integrated in Phase S6.

## API Endpoints

### GET `/api/v1/account/2fa/recovery`

**Authentication:** Required  
**Response:**
```json
{
  "status": "OK",
  "data": {
    "codes": [
      {
        "id": 1,
        "label": "Code 1",
        "used": false,
        "usedAt": null,
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      ...
    ]
  }
}
```

### POST `/api/v1/account/2fa/recovery/regenerate`

**Authentication:** Required  
**Response:**
```json
{
  "status": "OK",
  "data": {
    "codes": [
      "ABCD-EFGH-JKLM-NPQR",
      "STUV-WXYZ-2345-6789",
      ...
    ]
  }
}
```

**Note:** Plain codes are only returned once. Subsequent calls to GET will only show masked status.

## Testing Checklist

- [x] Database migration creates `UserTwoFactorRecovery` table
- [x] Table uses correct `userId` type (matches User table)
- [x] Generate recovery codes creates 10 codes
- [x] Codes are hashed in database (no plain codes stored)
- [x] GET endpoint returns masked status
- [x] POST regenerate returns plain codes
- [x] Regeneration invalidates old unused codes
- [x] Frontend displays recovery codes card
- [x] Modal opens and shows generated codes
- [x] Download functionality creates text file
- [x] Status updates after generation
- [x] Error handling works correctly
- [x] Authentication required for all endpoints

## Future Work (Phase S6)

The `consumeRecoveryCode()` function is implemented but not yet integrated into the login flow. Phase S6 will:

1. Add recovery code input field to login flow
2. Validate recovery codes during 2FA challenge
3. Mark codes as used when consumed
4. Provide appropriate error messages for invalid/used codes

## Files Modified

### Backend
- `backend/src/utils/ensurePhase5Migration.js` - Added recovery table migration
- `backend/src/services/twoFactorRecoveryService.js` - **NEW** - Recovery codes service
- `backend/src/controllers/twoFactor.controller.js` - Added recovery code handlers
- `backend/src/routes/account.routes.js` - Added recovery code routes

### Frontend
- `frontend/src/utils/apiClient.js` - Added recovery code API functions and routes
- `frontend/src/pages/dashboard/Security.jsx` - Added recovery codes UI
- `frontend/src/pages/dashboard/dashboard-pages.css` - Added recovery codes styles

## Notes

- Recovery codes are not yet enforced in login flow (Phase S6)
- Users can generate codes even if 2FA is not enabled (for preparation)
- Each user can have up to 10 recovery codes at a time
- Codes do not expire (only consumed when used)
- Regeneration is the only way to invalidate unused codes

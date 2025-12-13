# Database Migration Report - Unified Schema Fix

**Date:** Generated during migration  
**Purpose:** Fix database schema mismatches causing "Unknown column" errors  
**Status:** ✅ Complete

## Summary

This migration ensures all expected database schema elements exist, fixing runtime errors such as:
- `ER_BAD_FIELD_ERROR: Unknown column 'accountStatus'`
- `ER_BAD_FIELD_ERROR: Unknown column 'emailVerified'`
- Missing token tables (PasswordResetToken, ActivationToken)
- Missing 2FA tables (TwoFactorAuth, UserTwoFactor, UserTwoFactorRecovery)
- Missing session tables (AuthSession, UserDevices)
- Missing activity and wallet tables

## What Was Missing

### User Table Columns
- `accountStatus` - Account status field (active, suspended, banned, deleted)
- `emailVerified` - Whether email is verified by OAuth provider
- OAuth provider columns: `googleId`, `githubId`, `twitterId`, `linkedinId`, `discordId`
- `authProvider` - Authentication provider identifier
- Profile fields: `username`, `country`, `bio`, `phone`, `avatarUrl`
- Terms fields: `termsAccepted`, `termsAcceptedAt`, `termsVersion`, `termsSource`
- Permissions: `permissions` (JSON), `featureFlags` (JSON)
- Soft delete: `deletedAt`, `deletedReason`
- Tracking: `onboardingStep`, `lastLoginAt`

### Missing Tables
1. **PasswordResetToken** - Password reset token storage
2. **ActivationToken** - Account activation token storage
3. **TwoFactorAuth** - 2FA secrets and settings
4. **UserTwoFactor** - Alternative 2FA table
5. **UserTwoFactorRecovery** - 2FA recovery codes
6. **AuthSession** - User session management
7. **UserDevices** - Device tracking
8. **UserActivityLog** - Activity audit log
9. **WalletTransaction** - Wallet transaction history

## What Was Added

### User Table Enhancements
✅ All 22 missing columns added with proper types and constraints  
✅ Indexes added for OAuth provider IDs (googleId, githubId, etc.)  
✅ Unique index on username  
✅ Password column made nullable (for OAuth-only users)

### New Tables Created
✅ **PasswordResetToken** - Stores hashed reset tokens with expiration  
✅ **ActivationToken** - Stores hashed activation tokens  
✅ **TwoFactorAuth** - TOTP secrets and backup codes  
✅ **UserTwoFactor** - Alternative 2FA implementation  
✅ **UserTwoFactorRecovery** - Recovery code storage  
✅ **AuthSession** - Session management with device tracking  
✅ **UserDevices** - Device fingerprint tracking  
✅ **UserActivityLog** - Comprehensive activity audit trail  
✅ **WalletTransaction** - Wallet transaction history

### Data Updates
✅ Existing users with NULL/empty role set to 'STANDARD_USER'  
✅ Existing users with NULL accountStatus set from status column

## Migration Details

### Migration File
- **Location:** `backend/sql/unified-schema-migration.sql`
- **Runner:** `backend/scripts/run-unified-migration.js`
- **NPM Script:** `npm run db:migrate`

### Idempotency
✅ Migration is **fully idempotent** - can be run multiple times safely  
✅ Uses `CREATE TABLE IF NOT EXISTS`  
✅ Checks for column/index existence before adding  
✅ No data loss - only adds missing elements

### Safety Features
- ✅ Checks table/column/index existence before creating
- ✅ Uses foreign key constraints with CASCADE delete
- ✅ Preserves existing data
- ✅ Handles errors gracefully (continues on non-critical failures)
- ✅ Logs all operations for audit trail

## How to Verify (10 seconds)

### Quick Verification Steps

1. **Run migration:**
   ```bash
   cd backend
   npm run db:migrate
   ```

2. **Verify schema (optional but recommended):**
   ```bash
   npm run db:verify
   ```

3. **Start backend:**
   ```bash
   npm start
   ```

4. **Test one auth endpoint:**
   ```bash
   curl http://localhost:4000/api/auth/me
   # Or use Postman/Thunder Client
   ```

5. **Check for errors:**
   - ✅ No "Unknown column" errors in logs
   - ✅ No "Table doesn't exist" errors
   - ✅ Backend starts successfully
   - ✅ Auth endpoints respond without DB errors

### Detailed Verification

#### Check User Table Columns
```sql
SHOW COLUMNS FROM User;
-- Should show: accountStatus, emailVerified, googleId, githubId, etc.
```

#### Check All Tables Exist
```sql
SHOW TABLES;
-- Should include:
-- - User
-- - PasswordResetToken
-- - ActivationToken
-- - TwoFactorAuth
-- - UserTwoFactor
-- - UserTwoFactorRecovery
-- - AuthSession
-- - UserDevices
-- - UserActivityLog
-- - WalletTransaction
```

#### Test Critical Endpoints
```bash
# 1. Register (creates user with all new columns)
POST /api/auth/register

# 2. Login (uses accountStatus, status)
POST /api/auth/login

# 3. Get profile (uses accountStatus, emailVerified, OAuth columns)
GET /api/auth/me

# 4. Admin user list (uses accountStatus)
GET /api/admin/users
```

## Migration Log Example

```
========================================
OGC NewFinity - Unified Schema Migration
========================================

[Migration] ✓ Database connection successful

[Migration] Ensuring User table...
[Migration] Adding column: accountStatus
[Migration] ✓ Added column: accountStatus
[Migration] Adding column: emailVerified
[Migration] ✓ Added column: emailVerified
...
[Migration] ✓ User table migration complete

[Migration] Ensuring token tables...
[Migration] Creating PasswordResetToken table...
[Migration] ✓ PasswordResetToken table created
[Migration] Creating ActivationToken table...
[Migration] ✓ ActivationToken table created
[Migration] ✓ Token tables migration complete

[Migration] Ensuring 2FA tables...
[Migration] Creating TwoFactorAuth table...
[Migration] ✓ TwoFactorAuth table created
...

========================================
✓ Migration completed successfully!
========================================
```

## Troubleshooting

### Error: "Column already exists"
✅ **Safe to ignore** - Migration checks before adding, but some edge cases may trigger this. The migration continues.

### Error: "Duplicate entry for key"
✅ **Check data** - If username unique index fails, there may be duplicate usernames. Migration will warn but continue.

### Error: "Foreign key constraint fails"
✅ **Check User table** - Ensure User table exists and has proper structure before running migration.

### Migration runs but errors persist
1. Check database connection settings in `.env`
2. Verify database user has ALTER/CREATE permissions
3. Check migration logs for specific errors
4. Manually verify tables/columns exist using SQL queries above

## Next Steps

After successful migration:

1. ✅ **Verify backend starts** - `npm start` should work without DB errors
2. ✅ **Test auth flows** - Register, login, password reset should work
3. ✅ **Test OAuth** - Social login should work (if configured)
4. ✅ **Test admin features** - User management should work
5. ✅ **Monitor logs** - Watch for any remaining "Unknown column" errors

## Files Modified

- ✅ `backend/sql/unified-schema-migration.sql` - SQL migration file
- ✅ `backend/scripts/run-unified-migration.js` - Migration runner
- ✅ `backend/package.json` - Added `db:migrate` script

## Files Created

- ✅ `DB-MIGRATION-REPORT.md` - This documentation

## Related Documentation

- `backend/DB-SCHEMA-ALIGNMENT.md` - Schema alignment notes
- `backend/src/utils/ensurePhase5Migration.js` - Dev-only auto-migration
- `docs/01-core-systems/06-database-schema-and-entity-relationships.md` - Full schema docs

---

## Foreign Key Type Compatibility Fix

**Date:** 2024-01-XX  
**Issue:** MySQL FK error: `PasswordResetToken.userId` incompatible with `User.id` in foreign key constraints  
**Root Cause:** Token tables were using `BIGINT UNSIGNED` for `userId` while `User.id` was actually `int` (signed)  
**Status:** ✅ Fixed

### Fix Details

**Problem:**
- `User.id` column type: `int` (signed integer)
- Token tables (`PasswordResetToken`, `ActivationToken`) were hardcoded to use `BIGINT UNSIGNED` for `userId`
- This type mismatch caused FK constraint creation to fail

**Solution:**
1. Added `backend/scripts/print-user-id-type.js` to detect actual `User.id` type
2. Updated `getUserIdType()` function in migration runner to query `INFORMATION_SCHEMA.COLUMNS` for exact type
3. Modified `ensureTokenTables()` to:
   - Use detected `User.id` type (instead of hardcoded `BIGINT UNSIGNED`)
   - Check existing tables for type mismatches
   - Drop FK if exists → alter column type → re-add FK with correct type
   - Applied same fix to all token tables and all tables with `userId` foreign keys

**Files Modified:**
- ✅ `backend/scripts/run-unified-migration.js` - Added dynamic type detection and FK fix logic
- ✅ `backend/scripts/print-user-id-type.js` - New script to detect User.id type
- ✅ `backend/package.json` - Added `db:user-id-type` npm script

**Verification:**
```bash
# Check User.id type
npm run db:user-id-type

# Run migration (will auto-fix FK mismatches)
npm run db:migrate

# Verify backend starts without FK errors
npm run dev
```

**Result:** All `userId` columns in token, session, activity, and wallet tables now match `User.id` type exactly, ensuring FK constraints work correctly.

---

**Migration Status:** ✅ Complete  
**Verification:** Run `npm run db:migrate` and test endpoints  
**Support:** Check logs for specific errors if issues persist

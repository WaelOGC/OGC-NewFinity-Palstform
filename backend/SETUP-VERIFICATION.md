# Wallet API Test Setup Verification

## ✅ Setup Complete

All scripts and paths have been normalized. The wallet API tests can now be run reliably without path confusion.

## Verified Configuration

### 1. Backend Scripts (`backend/package.json`)

✅ **Scripts configured:**
- `"start": "node src/index.js"` - Runs backend on port 4000 with wallet routes
- `"dev": "node src/server.js"` - Runs backend on port 3000 for local debugging (no wallet routes)
- `"test:wallet": "node test-wallet-api.js"` - Runs automated wallet API tests

### 2. Root-Level Scripts (`package.json`)

✅ **Convenience scripts added:**
- `"backend:start": "npm --prefix backend start"` - Start backend from project root
- `"backend:test:wallet": "npm --prefix backend run test:wallet"` - Run tests from project root

### 3. Test Files Location

✅ **All test files in correct location:**
- `backend/test-wallet-api.js` ✓
- `backend/test-wallet-api.ps1` ✓
- `backend/verify-wallet-system.js` ✓

### 4. Path Configuration

✅ **All scripts assume execution from `backend/` directory:**
- Test scripts use relative paths that work from `backend/`
- No hard-coded paths that assume different working directory
- PowerShell script error message updated to use `npm start`

### 5. Documentation Updated

✅ **All verification docs updated:**
- `backend/VERIFICATION-INSTRUCTIONS.md` - Uses `npm start` and `npm run test:wallet`
- `docs/backend/wallet-api-verification-summary.md` - Updated commands
- `docs/backend/wallet-api-verification.md` - Updated test execution commands
- `docs/backend/start-backend-test-guide.md` - Updated with correct commands
- `backend/verify-wallet-system.js` - Fixed console messages

## How to Use

### From `backend/` Directory

```bash
# Terminal 1: Start backend with wallet routes (port 4000)
cd backend
npm start

# Terminal 2: Run automated wallet tests
cd backend
npm run test:wallet
```

### From Project Root

```bash
# Terminal 1: Start backend
npm run backend:start

# Terminal 2: Run tests
npm run backend:test:wallet
```

### PowerShell Alternative

```powershell
# From backend/ directory
.\test-wallet-api.ps1
```

## Expected Test Results

When all tests pass, you should see:

```
✅ Backend Health Check
✅ User Registration (or Login if exists)
✅ Access Cookie Set
✅ Refresh Cookie Set
✅ Wallet Summary
✅ Demo Transactions
✅ List Transactions
✅ Stake Operation
✅ Unstake Operation
✅ Transfer Operation
✅ Wallet Balance Verification
```

## Port Configuration

- **Backend with wallet routes:** Port 4000 (`npm start`)
- **Backend for debugging:** Port 3000 (`npm run dev` - no wallet routes)
- **Test scripts:** Configured to use port 4000 by default

## Next Steps

1. Ensure MySQL database `ogc_newfinity` exists
2. Ensure tables `User`, `wallets`, and `transactions` are created
3. Configure `.env` file with required environment variables
4. Start backend: `cd backend && npm start`
5. Run tests: `cd backend && npm run test:wallet`

## Troubleshooting

If tests fail:
- Verify backend is running on port 4000
- Check database connection settings in `.env`
- Ensure all required tables exist
- Review error messages in console

---

## Auth & User Activation – MySQL Migration Steps

This section describes how to set up the database schema for user authentication and account activation.

### Prerequisites

- MySQL server running and accessible
- Database created (e.g., `ogc_newfinity`)
- MySQL user with CREATE, ALTER, INSERT, UPDATE, DELETE permissions

### Migration Steps

The auth system requires SQL schema files to be run. Recommended order:

1. **Base User Table** (`user-schema.sql`) - Creates the initial User table
2. **Activation & Terms** (`user-activation-schema.sql`) - Adds activation and terms acceptance columns
3. **Admin Users Enhancements** (`admin-users-last-login-and-roles.sql`) - Adds lastLoginAt, ensures status/role columns exist (optional, safe to run anytime)
4. **Admin Audit Logs** (`admin-audit-logs-schema.sql`) - Creates AdminAuditLog table for audit trail (optional, safe to run anytime)

### Step 1: Create Base User Table

If you're setting up a fresh database, run the base schema first:

```bash
mysql -u <USER> -p -h <HOST> <DATABASE> < backend/sql/user-schema.sql
```

**Example:**
```bash
mysql -u root -p -h localhost ogc_newfinity < backend/sql/user-schema.sql
```

This creates the `User` table with columns:
- `id` (BIGINT UNSIGNED, primary key)
- `email` (VARCHAR(255), unique, indexed)
- `password` (VARCHAR(255))
- `role` (VARCHAR(50), default 'user')
- `fullName` (VARCHAR(255), nullable)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

### Step 2: Add Activation & Terms Columns

Run the activation schema to add the required columns for account activation:

```bash
mysql -u <USER> -p -h <HOST> <DATABASE> < backend/sql/user-activation-schema.sql
```

**Example:**
```bash
mysql -u root -p -h localhost ogc_newfinity < backend/sql/user-activation-schema.sql
```

### Step 4: Create Admin Audit Logs Table (Optional)

Run the admin audit logs schema to enable audit trail logging:

```bash
mysql -u <USER> -p -h <HOST> <DATABASE> < backend/sql/admin-audit-logs-schema.sql
```

**Example:**
```bash
mysql -u root -p -h localhost ogc_newfinity < backend/sql/admin-audit-logs-schema.sql
```

This migration:
- Creates the `AdminAuditLog` table for audit trail logging
- Includes basic indexes for performance
- Safe to run multiple times

### Step 5: Add Admin Audit Logs Indexes (Optional, Recommended)

For optimal query performance on audit logs, run the index migration:

```bash
mysql -u <USER> -p -h <HOST> <DATABASE> < backend/sql/admin-audit-logs-indexes.sql
```

**Example:**
```bash
mysql -u root -p -h localhost ogc_newfinity < backend/sql/admin-audit-logs-indexes.sql
```

This migration:
- Ensures indexes exist for efficient audit log queries (pagination, filtering by actor, action, status)
- Safe to run multiple times - checks for existing indexes before creating
- Exits gracefully if AdminAuditLog table doesn't exist

**Verification:**
```sql
-- Check indexes on AdminAuditLog table
SHOW INDEX FROM AdminAuditLog;
```

### Step 6: Create Audit Logs Table (A1.3 - Admin User Status Changes)

Run the audit logs schema to enable A1.3 audit logging for admin user status changes:

```bash
mysql -u <USER> -p -h <HOST> <DATABASE> < backend/sql/audit-logs-schema.sql
```

**Example:**
```bash
mysql -u root -p -h localhost ogc_newfinity < backend/sql/audit-logs-schema.sql
```

This migration:
- Creates the `audit_logs` table for A1.3 audit logging
- Includes indexes for efficient queries: (event, created_at), (actor_user_id, created_at), (target_user_id, created_at)
- Safe to run multiple times - checks for existing table before creating

**Table Structure:**
- `id` - BIGINT AUTO_INCREMENT PRIMARY KEY
- `event` - VARCHAR(100) NOT NULL (e.g., 'ADMIN_USER_STATUS_CHANGE')
- `actor_user_id` - BIGINT NULL (admin performing action)
- `target_user_id` - BIGINT NULL (user whose status is being changed)
- `meta_json` - JSON NULL (stores fromStatus, toStatus, reason)
- `ip` - VARCHAR(64) NULL (IP address of request)
- `user_agent` - VARCHAR(255) NULL (user agent string)
- `created_at` - DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

**Verification:**
```sql
-- Check audit_logs table structure
DESCRIBE audit_logs;

-- Check indexes
SHOW INDEX FROM audit_logs;
```

**A1.3 Audit Logging Features:**
- ✅ Event: `ADMIN_USER_STATUS_CHANGE` (defined in `backend/src/constants/auditEvents.js`)
  - Logs admin user account status changes (ACTIVE, SUSPENDED, BANNED)
  - Captures: `fromStatus`, `toStatus`, `reason` in `meta_json`
  - Best-effort logging: never throws, non-blocking
  - Wired into endpoints: `PUT /api/v1/admin/users/:userId/status` and `PATCH /api/v1/admin/users/:userId/toggle-status`

**A2.3 Audit Logging Features:**
- ✅ Event: `ADMIN_USER_ROLES_CHANGE` (defined in `backend/src/constants/auditEvents.js`)
  - Logs admin user role assignment changes (founder, admin, support, viewer)
  - Captures: `rolesBefore`, `rolesAfter`, `reason` in `meta_json`
  - Role values are normalized to lowercase before logging (explicit values logged even if same role)
  - Best-effort logging: never throws, non-blocking
  - Wired into endpoint: `PATCH /api/v1/admin/users/:userId/role`

**A3 Bulk User Status Actions:**
- ✅ Endpoint: `POST /api/v1/admin/users/bulk-status`
- ✅ Request body: `{ "action": "suspend", "userIds": [12, 18, 44], "reason": "Spam abuse" }`
- ✅ Supported actions: `activate` → ACTIVE, `suspend` → SUSPENDED
- ✅ Batch size limit: Maximum 50 users per request
- ✅ Rate limiting: 5 requests per minute per admin (strict)
- ✅ Safety rules:
  - Rejects self-inclusion (actor.id must not appear in userIds)
  - Uses `assertCanModifyUser()` guard for each target user
  - Skips users that fail guard validation
  - Continues processing remaining users even if some updates fail
- ✅ Audit logging: One `ADMIN_USER_STATUS_CHANGE` event per successfully updated user
- ✅ Response structure: Returns summary (requested/updated/skipped) and per-user results
- ✅ Defensive behavior: Invalid user IDs are skipped, not fatal; batch continues on individual failures

**Note:** Audit logging is defensive and non-blocking. If the `audit_logs` table doesn't exist or insert fails, the error is logged to console with `[AuditLog]` prefix, but the main request flow continues normally.

**C2 Audit Logs CSV Export:**
- ✅ Endpoint: `GET /api/v1/admin/audit-logs/export.csv`
- ✅ Permission: `PERMISSIONS.ADMIN_AUDIT_READ` (required)
- ✅ Rate limiting: 3 exports per minute per admin user (strict)
- ✅ Filters (all optional):
  - `q`: Search query (searches `event` and `meta_json` as text)
  - `event`: Exact event name filter
  - `actorUserId`: Filter by actor user ID (integer, must be > 0)
  - `targetUserId`: Filter by target user ID (integer, must be > 0)
  - `dateFrom`: ISO date string (inclusive start date)
  - `dateTo`: ISO date string (inclusive end date)
  - `limit`: Maximum rows to export (default: 5000, hard max: 20000)
- ✅ CSV columns (exact order): `id`, `created_at`, `event`, `actor_user_id`, `target_user_id`, `ip`, `user_agent`, `meta_json`
- ✅ CSV safety: Proper escaping for commas, quotes, and newlines; CRLF replaced with spaces
- ✅ Defensive: Returns CSV with headers only if no rows found; validates all inputs; never crashes on empty table
- ✅ Example request: `/api/v1/admin/audit-logs/export.csv?event=ADMIN_USER_STATUS_CHANGE&dateFrom=2025-12-01&dateTo=2025-12-31`
- ✅ Response: `Content-Type: text/csv` with `Content-Disposition: attachment; filename="audit-logs-YYYY-MM-DD.csv"`

**C1 Audit Log Retention Policy:**
- ✅ Default retention period: 180 days (6 months)
- ✅ Configuration: `backend/src/config/auditRetention.js` (single source of truth)
- ✅ Cleanup service: `backend/src/services/auditLogRetentionService.js`
  - Function: `cleanupExpiredAuditLogs()`
  - Behavior: Deletes audit logs older than retention period
  - Safety: Never throws, uses parameterized SQL, only affects `audit_logs` table
  - Returns: `{ ok: boolean, deletedCount?: number, error?: string }`
- ✅ Manual cleanup script: `backend/src/scripts/cleanupAuditLogs.js`
  - Usage: `node backend/src/scripts/cleanupAuditLogs.js`
  - Logs: Start, retention days, deleted count, completion
  - Exit codes: 0 on success, 1 on failure
- ✅ How to change retention period:
  1. Edit `backend/src/config/auditRetention.js`
  2. Update `AUDIT_LOG_RETENTION_DAYS` constant
  3. Save and redeploy (no restart required for manual script execution)
- ✅ Recommended scheduling:
  - **System Cron (Linux/Mac):** `0 2 * * * cd /path/to/project && node backend/src/scripts/cleanupAuditLogs.js`
  - **PM2 Cron:** Add to ecosystem.config.js with `cron_restart: "0 2 * * *"`
  - **Windows Task Scheduler:** Daily task at 2:00 AM running the cleanup script
  - Note: Script does NOT auto-schedule - must configure scheduling manually
- ✅ Safety rules:
  - Cleanup must NOT run during request handling (script runs independently)
  - No table locking
  - No cascading deletes
  - Only affects `audit_logs` table
  - Uses parameterized SQL (injection-safe)
  - Logs failures without crashing

**D1 Global Settings Store:**
- ✅ Database table: `platform_settings` (schema in `backend/sql/platform-settings-schema.sql`)
  - Columns: `id`, `key_name` (UNIQUE), `value_type`, `value_json`, `updated_by_user_id`, `updated_at`, `created_at`
  - Apply: `mysql -u <USER> -p -h <HOST> <DATABASE> < backend/sql/platform-settings-schema.sql`
- ✅ Settings registry: `backend/src/constants/platformSettings.js`
  - Defines allowed keys and their types: `maintenance_mode` (boolean), `maintenance_message` (string), `feature_signup_enabled` (boolean), `rate_limit_multiplier` (number), `security_force_2fa_admins` (boolean)
  - Only keys in registry can be read/written via API
- ✅ Service: `backend/src/services/platformSettingsService.js`
  - `getAllPlatformSettings()` - Returns all settings with DB values merged over defaults
  - `getPlatformSetting(key)` - Returns single setting value (default if missing)
  - `setPlatformSetting({ key, value, actorUserId })` - Updates setting with validation
- ✅ Endpoints:
  - `GET /api/v1/admin/settings` - Get all settings (requires `ADMIN_SETTINGS_READ`)
  - `PUT /api/v1/admin/settings/:key` - Update setting (requires `ADMIN_SETTINGS_WRITE`, rate limited: 20/min)
  - Request body: `{ "value": true, "reason": "Emergency maintenance" }` (reason optional)
- ✅ Permissions:
  - `ADMIN_SETTINGS_READ` - Read access to platform settings
  - `ADMIN_SETTINGS_WRITE` - Write access to platform settings
- ✅ Audit logging:
  - Event: `ADMIN_SETTINGS_CHANGE` (defined in `backend/src/constants/auditEvents.js`)
  - Logger: `logAdminSettingsChange()` in `backend/src/utils/auditLogger.js`
  - Stores in `meta_json`: `key`, `valueBefore`, `valueAfter`, `reason`
  - Best-effort, non-blocking (never throws)
- ✅ Validation rules:
  - Boolean: must be boolean type
  - Number: must be finite number
  - String: must be string (trimmed, max 2000 chars)
  - JSON: must be object or array
- ✅ Defensive behavior:
  - Unknown keys rejected with clear error
  - Type validation with descriptive errors
  - Defaults returned even if DB empty
  - Never throws - all errors returned in result objects
- ✅ Example calls:
  ```bash
  # Get all settings
  GET /api/v1/admin/settings
  
  # Enable maintenance mode
  PUT /api/v1/admin/settings/maintenance_mode
  { "value": true, "reason": "Emergency maintenance" }
  
  # Update maintenance message
  PUT /api/v1/admin/settings/maintenance_message
  { "value": "System maintenance in progress. Expected downtime: 2 hours." }
  ```

### Admin User Write Permissions

The `ADMIN_USERS_WRITE` permission exists for user status modification operations. Only founder and admin roles have this permission. The `assertCanModifyUser()` guard helper blocks self-modification attempts (users cannot modify their own account through admin actions).

### Permission Registry (Authoritative)

**Phase B1 Implementation:** The backend is now the single source of truth for all permissions.

**Authoritative Registry:**
- **File:** `backend/src/constants/permissions.js`
- **Export:** `PERMISSIONS` (frozen object)
- **Rules:**
  - All permissions must be defined in this registry
  - No permission strings may be defined elsewhere
  - Registry is frozen (immutable)
  - Backend is authoritative; frontend can only consume

**Defined Permissions:**
- `ADMIN_USERS_READ` - Read access to user management
- `ADMIN_USERS_WRITE` - Write access to user management
- `ADMIN_ROLES_READ` - Read access to roles management
- `ADMIN_ROLES_WRITE` - Write access to roles management
- `ADMIN_AUDIT_READ` - Read access to audit logs
- `ADMIN_SETTINGS_READ` - Read access to platform settings
- `ADMIN_SETTINGS_WRITE` - Write access to platform settings
- `SYSTEM_HEALTH_READ` - Read access to system health

**Role → Permission Mapping:**
- **File:** `backend/src/constants/rolePermissions.js`
- **Export:** `ROLE_PERMISSIONS` (frozen object)
- **Rules:**
  - `null` means unrestricted (founder only)
  - All other roles must be explicit arrays
  - No inheritance magic
  - Unknown roles = no permissions

**Role Permissions:**
- `founder`: `null` (all permissions)
- `admin`: `[ADMIN_USERS_READ, ADMIN_USERS_WRITE, ADMIN_ROLES_READ, ADMIN_AUDIT_READ]`
- `support`: `[ADMIN_USERS_READ]`
- `viewer`: `[ADMIN_USERS_READ]`

**Permission Resolver:**
- **File:** `backend/src/utils/permissions.js`
- **Function:** `hasPermission(user, permission)`
- **Behavior:**
  - Supports both `user.role` (string) and `user.roles` (array)
  - Founder (null) bypasses all checks
  - Unknown roles = no permissions
  - No throws — returns booleans only
  - Backward-compatible reads

**Runtime Warning (Development Only):**
- On backend startup, a parity check runs automatically
- Collects all permissions referenced in code
- Compares against `PERMISSIONS` registry
- Logs warnings for unknown permissions (does not crash)
- Prevents silent drift where permissions are used but not registered

**Example Warning:**
```
[PermissionRegistry] ⚠️  Unknown permissions referenced in code:
[PermissionRegistry]   - ADMIN_UNKNOWN_PERMISSION
[PermissionRegistry] Add these to backend/src/constants/permissions.js
```

**Backward Compatibility:**
- `backend/src/constants/adminPermissions.js` is deprecated but maintained
- Re-exports from authoritative registry for legacy code
- New code should import from `constants/permissions.js`

### Role Editing (Founder-Only) - Phase B2

**Phase B2 Implementation:** Founder-only role permission editing with hard safety rules.

**Endpoint:**
- **PUT** `/api/v1/admin/roles/:roleName`
- **Access:** Founder role only
- **Request Body:**
  ```json
  {
    "permissions": ["ADMIN_USERS_READ", "ADMIN_USERS_WRITE", "ADMIN_AUDIT_READ"],
    "reason": "Expanded admin scope"
  }
  ```

**Founder-Only Guard:**
- **File:** `backend/src/utils/founderGuard.js`
- **Function:** `assertFounder(actor)`
- **Behavior:**
  - Returns `{ ok: boolean, code?, reason? }` (never throws)
  - Checks `actor.role === 'founder'`
  - Used by all role-editing endpoints

**Critical Permissions (Non-Removable):**
- **File:** `backend/src/constants/criticalPermissions.js`
- **Export:** `CRITICAL_PERMISSIONS` (frozen array)
- **Permissions:**
  - `ADMIN_USERS_READ`
  - `ADMIN_USERS_WRITE`
  - `ADMIN_ROLES_READ`
- **Rule:** Every critical permission must exist in at least one role
- **Protection:** Prevents system lockout by ensuring core permissions remain accessible

**Safety Rules (Hard Requirements):**
1. **Founder role cannot be edited** - `founder` role is immutable
2. **Critical permission coverage** - All critical permissions must exist in at least one role
3. **Valid permissions only** - All permissions must be from `PERMISSIONS` registry
4. **No duplicates** - Permission arrays must be unique
5. **Input normalization** - Permissions are trimmed and deduplicated

**Error Codes:**
- `FOUNDER_ONLY` - Non-founder attempted to edit roles
- `ROLE_NOT_FOUND` - Role does not exist
- `INVALID_PERMISSION` - Invalid or duplicate permissions
- `CRITICAL_PERMISSION_REMOVAL_BLOCKED` - Would remove last instance of critical permission

**Persistence Model:**
- **Current:** In-memory updates (lost on server restart)
- **Source:** `backend/src/constants/rolePermissions.js` (frozen config)
- **Service:** `backend/src/services/rolePermissionsService.js`
- **Note:** Updates are applied to mutable in-memory copy
- **Future:** Persistence to database or config file should be added
- **Assumption:** No `role_definition` table exists; using config-based approach

**Audit Logging Hook:**
- **Status:** Placeholder for Phase C
- **TODO:** `ADMIN_ROLE_DEFINITION_CHANGE` audit event
- **Location:** After successful role update in `updateAdminRole` controller

**Defensive Requirements:**
- ✅ No throws - all guards return result objects
- ✅ No partial updates - all-or-nothing validation
- ✅ Backend remains authoritative
- ✅ Founder role immutable
- ✅ Critical permissions protected

### Important Notes

⚠️ **If columns already exist:** MySQL doesn't support `IF NOT EXISTS` in `ALTER TABLE` statements. If you run `user-activation-schema.sql` on a database that already has these columns, you'll get errors like "Duplicate column name 'status'".

**Solutions:**
1. **Check before running:** Query the database to see which columns exist:
   ```sql
   DESCRIBE User;
   ```
2. **Skip if exists:** If you already have the activation columns, you only need to run `user-activation-schema.sql` if you're missing the `ActivationToken` table.
3. **Fresh start:** If you're okay with recreating the database, drop and recreate:
   ```sql
   DROP TABLE IF EXISTS ActivationToken;
   DROP TABLE IF EXISTS User;
   ```
   Then run both schema files in order.

### Verification

After running both migrations, verify the schema:

```sql
-- Check User table structure
DESCRIBE User;

-- Check ActivationToken table structure
DESCRIBE ActivationToken;

-- Verify required columns exist
SHOW COLUMNS FROM User LIKE 'status';
SHOW COLUMNS FROM User LIKE 'termsAccepted';
```

Expected User table columns:
- ✅ `id`, `email`, `password`, `role`, `fullName`
- ✅ `status`, `termsAccepted`, `termsAcceptedAt`, `termsVersion`, `termsSource`
- ✅ `createdAt`, `updatedAt`

Expected ActivationToken table:
- ✅ `id`, `userId`, `token`, `used`, `expiresAt`, `createdAt`

### Quick Setup (Fresh Database)

If starting from scratch, run both files in sequence:

```bash
# From project root
cd backend

# Step 1: Base User table
mysql -u <USER> -p -h <HOST> <DATABASE> < sql/user-schema.sql

# Step 2: Activation & Terms
mysql -u <USER> -p -h <HOST> <DATABASE> < sql/user-activation-schema.sql
```

## Applying the User Table Migration (MySQL)

### Recommended: Use the Unified Migration File

**For fixing authentication database schema issues, use the unified migration file:**

`backend/sql/fix-user-table-migration.sql`

This migration file:
- ✅ **Safely checks if columns exist** before adding them (no duplicate column errors)
- ✅ **Creates the User table** if it doesn't exist
- ✅ **Adds all required columns** for registration, login, and activation:
  - `status` (VARCHAR(50), default 'pending_verification')
  - `termsAccepted` (TINYINT(1), default 0)
  - `termsAcceptedAt` (DATETIME, nullable)
  - `termsVersion` (VARCHAR(20), nullable)
  - `termsSource` (VARCHAR(50), nullable)
- ✅ **Creates the ActivationToken table** if it doesn't exist
- ✅ **Adds indexes** for performance
- ✅ **Updates existing users** to 'active' status if needed
- ✅ **Safe to run multiple times** - won't crash if columns already exist

### How to Apply the Migration

#### Option 1: MySQL Command Line (Recommended)

```bash
mysql -u <USERNAME> -p -h <HOST> <DATABASE_NAME> < backend/sql/fix-user-table-migration.sql
```

**Example:**
```bash
mysql -u root -p -h localhost ogc_newfinity < backend/sql/fix-user-table-migration.sql
```

#### Option 2: MySQL Workbench / phpMyAdmin

1. Open MySQL Workbench or phpMyAdmin
2. Select your database (e.g., `ogc_newfinity`)
3. Open the SQL tab/editor
4. Copy and paste the entire contents of `backend/sql/fix-user-table-migration.sql`
5. Execute the script

#### Option 3: MySQL Interactive Shell

```bash
mysql -u <USERNAME> -p -h <HOST> <DATABASE_NAME>
source backend/sql/fix-user-table-migration.sql;
```

### Verify the Migration

After running the migration, verify the schema:

```sql
-- Check User table structure
DESCRIBE User;

-- Check ActivationToken table structure
DESCRIBE ActivationToken;

-- Verify specific columns exist
SHOW COLUMNS FROM User LIKE 'status';
SHOW COLUMNS FROM User LIKE 'termsAccepted';
SHOW COLUMNS FROM User LIKE 'termsAcceptedAt';
SHOW COLUMNS FROM User LIKE 'termsVersion';
SHOW COLUMNS FROM User LIKE 'termsSource';
```

**Expected User table columns:**
- ✅ `id`, `email`, `password`, `role`, `fullName`
- ✅ `status`, `termsAccepted`, `termsAcceptedAt`, `termsVersion`, `termsSource`
- ✅ `createdAt`, `updatedAt`

**Expected ActivationToken table:**
- ✅ `id`, `userId`, `token`, `used`, `expiresAt`, `createdAt`

### What This Migration Fixes

This migration resolves the following errors:
- ❌ `Unknown column 'role' in 'field list'` → ✅ Fixed
- ❌ `Unknown column 'status' in 'field list'` → ✅ Fixed
- ❌ `Unknown column 'termsAccepted' in 'field list'` → ✅ Fixed
- ❌ `Unknown column 'termsAcceptedAt' in 'field list'` → ✅ Fixed
- ❌ `Unknown column 'termsVersion' in 'field list'` → ✅ Fixed
- ❌ `Unknown column 'termsSource' in 'field list'` → ✅ Fixed
- ❌ `Table 'ActivationToken' doesn't exist` → ✅ Fixed

After applying this migration, registration, login, and activation should work without database errors.

**Note:** The User table now includes a `role` column (VARCHAR(50) NOT NULL DEFAULT 'user'). Running `fix-user-table-migration.sql` will:
- Add the `role` column to existing databases if it doesn't exist
- Default existing users to 'user' role
- Ensure new registrations automatically get the 'user' role

**Quick verification:**
```sql
DESCRIBE User;
-- Check that 'role' appears with type VARCHAR(50) and default 'user'
```

### Troubleshooting Auth Registration Errors

If you see errors like:
- `Unknown column 'role' in 'field list'`
- `Unknown column 'status' in 'field list'`
- `Unknown column 'termsAccepted' in 'field list'`

**Solution:** Run `fix-user-table-migration.sql` to add the missing columns. This file safely checks for existing columns before adding them. The migration will:
- Add the `role` column with default value 'user' for all existing users
- Add other missing columns as needed

If you see errors like:
- `Duplicate column name 'status'`

**Solution:** This shouldn't happen with `fix-user-table-migration.sql` as it checks for column existence. If you still see this error, check your schema with `DESCRIBE User;` to confirm all required columns are present.

### Fixing ActivationToken Table (If Missing)

If you see errors like:
- `Table 'ogc_newfinity.activationtoken' doesn't exist`
- `Table 'ogc_newfinity.ActivationToken' doesn't exist`

**Solution:** The `fix-user-table-migration.sql` file creates the `ActivationToken` table automatically. Re-run the migration:

```bash
# From project root
mysql -u <USER> -p -h <HOST> <DATABASE_NAME> < backend/sql/fix-user-table-migration.sql
```

**Example:**
```bash
mysql -u root -p -h localhost ogc_newfinity < backend/sql/fix-user-table-migration.sql
```

**Alternative (MySQL Workbench / phpMyAdmin):**
1. Open MySQL Workbench or phpMyAdmin
2. Select your database (e.g., `ogc_newfinity`)
3. Open the SQL tab/editor
4. Copy and paste the entire contents of `backend/sql/fix-user-table-migration.sql`
5. Execute the script

**Verify the table was created:**
```sql
DESCRIBE ActivationToken;
```

**Expected columns:**
- ✅ `id` (BIGINT UNSIGNED, primary key)
- ✅ `userId` (BIGINT UNSIGNED, foreign key to User.id)
- ✅ `token` (VARCHAR(255), unique, stores hashed activation token)
- ✅ `used` (TINYINT(1), default 0)
- ✅ `expiresAt` (DATETIME)
- ✅ `createdAt` (TIMESTAMP, default CURRENT_TIMESTAMP)

**Note:** The migration is idempotent (safe to run multiple times). It uses `CREATE TABLE IF NOT EXISTS`, so it won't fail if the table already exists.

---

## Auth Run & Test Checklist (Local Dev)

This checklist helps you verify that the authentication system is working correctly after database migrations.

### Prerequisites

- ✅ Database migration completed (see "Applying the User Table Migration" section above)
- ✅ MySQL database `ogc_newfinity` exists and is accessible
- ✅ Backend `.env` file configured with database credentials

### Step 1: Start the Backend

In your first terminal window:

```bash
cd backend
npm start
```

**Expected output:**
```
OGC NewFinity backend listening on localhost:4000
```

**Note:** This runs the Node/Express API on `http://localhost:4000`. Keep this terminal window open.

### Step 2: Start the Frontend

In a **second terminal window**:

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Note:** This runs the Vite/React app on `http://localhost:5173`.

### Step 3: Open the Auth Page

In your browser, visit:

```
http://localhost:5173/auth
```

**Description:** This is the login / registration UI for OGC NewFinity. You should see a form with options to create an account or sign in.

### Step 4: Test Registration

Fill in the **"Create account"** form with:

- **Full name** (e.g., "John Doe")
- **Email** (e.g., "test@example.com")
- **Password** (minimum requirements as specified)
- **Confirm password** (must match password)
- **Check the Terms & Conditions checkbox** ✓

Click **"Create account"**.

### Expected Behavior (After DB Migration)

✅ **Success indicators:**
- No `Unknown column 'status'` error
- No `Unknown column 'termsAccepted'` error
- Either a success message, or an activation-related message/error only

❌ **If you see database errors:**
- `Unknown column 'status' in 'field list'` → Run the migration (see "Applying the User Table Migration" section)
- `Unknown column 'termsAccepted' in 'field list'` → Run the migration

### Notes About ActivationToken

⚠️ **Important:** There may still be a separate error related to the `ActivationToken` table or activation flow. This will be handled in a later task.

**This checklist's purpose is to confirm:**
1. ✅ Backend and frontend both run without errors
2. ✅ `/auth` page loads correctly
3. ✅ The database schema for the `User` table is correct (no missing column errors)

If you see activation-related errors (not database schema errors), those are expected and will be addressed separately.

---

## Configuring SMTP Email

The platform supports sending real activation emails via SMTP. When a user registers, an activation email is automatically sent with a link to activate their account.

### How It Works

1. **User registers** → Activation token is created
2. **Email is sent** → If SMTP is configured, real email is sent; otherwise, logged to console
3. **User clicks activation link** → Account becomes active

### Environment Variables

To enable real email sending, configure the following variables in your `backend/.env` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password-or-app-password
SMTP_FROM=noreply@ogc-newfinity.com
FRONTEND_URL=http://localhost:5175
```

### Variable Descriptions

- **SMTP_HOST**: SMTP server hostname
  - Gmail: `smtp.gmail.com`
  - SendGrid: `smtp.sendgrid.net`
  - Outlook: `smtp-mail.outlook.com`
  - Custom: Your SMTP server hostname

- **SMTP_PORT**: SMTP server port
  - `587` - TLS (most common, recommended)
  - `465` - SSL
  - `25` - Unencrypted (not recommended)

- **SMTP_USER**: SMTP authentication username (usually your email address)

- **SMTP_PASS**: SMTP authentication password
  - For Gmail: Use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
  - For other providers: Your email password or app-specific password

- **SMTP_FROM**: Email address to send from (e.g., `noreply@ogc-newfinity.com`)

- **FRONTEND_URL**: Frontend URL used in activation links (default: `http://localhost:5175`)

### Development Mode (No SMTP)

If SMTP variables are not configured, the system will:
- Log emails to the console instead of sending them
- Display activation URLs in the terminal
- Allow testing without email server setup

**Example console output:**
```
📧 ACTIVATION EMAIL (Development Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: user@example.com
Subject: Activate your OGC NewFinity Account
Activation URL: http://localhost:5175/auth/activate?token=abc123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Sample Configuration

**Gmail Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ogc-newfinity.com
FRONTEND_URL=http://localhost:5175
```

**SendGrid Example:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@ogc-newfinity.com
FRONTEND_URL=http://localhost:5175
```

### Verification

After configuring SMTP, start the backend and check the console:

**If SMTP is configured correctly:**
```
✅ SMTP email transport configured and verified
```

**If SMTP fails:**
```
⚠️  Failed to initialize SMTP transport, falling back to console logging: [error message]
```

### Email Content

Activation emails include:
- **Subject**: "Activate your OGC NewFinity Account"
- **Welcome message** with user's name (if provided)
- **Clickable activation button**
- **Plain text activation link** as fallback
- **Expiration notice** (24 hours)

### Troubleshooting

**Emails not sending:**
1. Verify all SMTP variables are set in `.env`
2. Check SMTP credentials are correct
3. For Gmail, ensure you're using an App Password (not regular password)
4. Check firewall/network allows outbound SMTP connections
5. Verify SMTP_PORT matches your provider's requirements

**Connection errors:**
- Try port `587` (TLS) or `465` (SSL)
- Check if your network blocks SMTP ports
- Verify SMTP_HOST is correct for your provider

**Authentication errors:**
- For Gmail: Generate a new App Password
- Verify SMTP_USER and SMTP_PASS are correct
- Some providers require the full email address as SMTP_USER

---

## SMTP Email – Quick Test

### Prerequisites

1. Set `FRONTEND_URL=http://localhost:5173` in `.env`
2. Fill in SMTP_* values in `.env` (e.g., Gmail App Password)

### Test Steps

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm start
   ```

4. Register a new user from `http://localhost:5173/auth`

### Expected Results

**If SMTP is configured:**
- Email arrives in inbox (check spam folder if not in inbox)
- Terminal shows: `[EmailService] SMTP connection verified – real emails will be sent.`
- Terminal shows: `[EmailService] Activation email sent to [email]`

**If SMTP is missing or invalid:**
- Terminal shows: `[EmailService] SMTP NOT configured – running in DEVELOPMENT mode (emails printed to console only).`
- Terminal displays a clear block:
  ```
  ==========================================
  ACTIVATION EMAIL (DEVELOPMENT MODE)
  To: [email]
  Subject: Activate your OGC NewFinity Account
  Activation URL: http://localhost:5173/auth/activate?token=[token]
  ==========================================
  ```

### Notes

- Do not include any secrets or real credentials in documentation
- The server will always start, even if SMTP configuration is missing or invalid
- All logs clearly indicate which email mode is active (SMTP or development console)


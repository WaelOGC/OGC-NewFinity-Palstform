# OGC NewFinity — DB Schema Alignment (Auth & User tables)

This guide helps you verify and align the database schema for the User and ActivationToken tables across different environments (local dev, VPS, staging, production).

## Quick Start

### 1. Check Schema

From the `backend` folder:

```bash
cd backend
npm run db:check:user-schema
```

**Expected output:**
- ✅ Exit code 0 + green messages → schema is aligned
- ❌ Exit code 1 + missing columns list → run the unified migration

### 2. Run Unified Migration

If the check reports missing columns, run the unified migration:

```bash
cd backend
npm run db:migrate:unified
```

This executes `sql/fix-user-table-migration.sql` using the current `.env` DB settings.

**Note:** The migration is **idempotent** (safe to run multiple times) thanks to defensive checks in the SQL that verify column existence before adding them.

### 3. Verify After Migration

After running the migration, re-check:

```bash
npm run db:check:user-schema
```

You should see:
- ✅ "User table has all required columns"
- ✅ "ActivationToken table has all required columns"
- 🎉 "Schema looks good. No migration required."

## What Gets Checked

### User Table Required Columns

- `id` - Primary key
- `email` - User email (unique)
- `password` - Hashed password
- `role` - User role (default: 'user')
- `fullName` - User's full name
- `status` - Account status (pending_verification, active, disabled)
- `termsAccepted` - Boolean flag for terms acceptance
- `termsAcceptedAt` - Timestamp of terms acceptance
- `termsVersion` - Version of terms accepted (e.g., 'v1.0')
- `termsSource` - Source of registration (email_password, google, etc.)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### ActivationToken Table Required Columns

- `id` - Primary key
- `userId` - Foreign key to User.id
- `token` - Hashed activation token (SHA-256)
- `used` - Boolean flag (0 = unused, 1 = used)
- `expiresAt` - Token expiration datetime
- `createdAt` - Token creation timestamp

## Environment Setup

### Prerequisites

1. **Database connection configured** in `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=ogc_newfinity
   ```

2. **Node.js dependencies installed**:
   ```bash
   cd backend
   npm install
   ```

### Fresh Environment Scenario

On a clean database:

1. Run the migration:
   ```bash
   npm run db:migrate:unified
   ```

2. Verify the schema:
   ```bash
   npm run db:check:user-schema
   ```

3. Test registration + activation flows:
   - No "Unknown column" errors should occur
   - User registration should work
   - Email activation should work

### Existing Environment Scenario

On an existing database:

1. Check current schema:
   ```bash
   npm run db:check:user-schema
   ```

2. If missing columns are reported:
   ```bash
   npm run db:migrate:unified
   ```

3. Verify again:
   ```bash
   npm run db:check:user-schema
   ```

## Troubleshooting

### "SQL file not found" Error

Ensure you're running the command from the `backend` directory:
```bash
cd backend
npm run db:migrate:unified
```

### "Connection refused" or Database Connection Errors

1. Verify your `.env` file has correct database credentials
2. Ensure MySQL/MariaDB is running
3. Test connection manually:
   ```bash
   mysql -u $DB_USER -p -h $DB_HOST $DB_NAME
   ```

### "Unknown column" Errors After Migration

1. Run the schema check:
   ```bash
   npm run db:check:user-schema
   ```

2. If columns are still missing, check:
   - Database connection is using the correct database
   - Migration completed without errors
   - No transaction rollbacks occurred

3. Re-run the migration if needed:
   ```bash
   npm run db:migrate:unified
   ```

## Manual Verification (Optional)

You can also verify the schema manually using MySQL:

```sql
-- Check User table structure
DESCRIBE User;

-- Check ActivationToken table structure
DESCRIBE ActivationToken;

-- Verify specific columns exist
SHOW COLUMNS FROM User LIKE 'status';
SHOW COLUMNS FROM User LIKE 'termsAccepted';
```

## Migration File Details

The unified migration file (`sql/fix-user-table-migration.sql`) includes:

- ✅ Safe column addition (checks existence before adding)
- ✅ Table creation (if tables don't exist)
- ✅ Index creation (for performance)
- ✅ Data migration (updates existing users to 'active' status if needed)
- ✅ Idempotent design (safe to run multiple times)

## Production Deployment

**Important:** Do not add automatic migration in production startup. Keep migrations as **manual/explicit** commands to avoid unexpected schema changes.

Before deploying to production:

1. Run schema check on production database:
   ```bash
   npm run db:check:user-schema
   ```

2. If migration is needed, run it during a maintenance window:
   ```bash
   npm run db:migrate:unified
   ```

3. Verify after migration:
   ```bash
   npm run db:check:user-schema
   ```

4. Test critical flows (registration, login, activation) before marking deployment complete.

## Related Files

- Migration SQL: `backend/sql/fix-user-table-migration.sql`
- Migration runner: `backend/scripts/run-unified-user-migration.js`
- Schema checker: `backend/scripts/check-user-schema.js`
- SQL runner utility: `backend/src/utils/runSqlFile.js`

# Database Documentation

This folder contains database schema documentation, migration guides, and schema drift reports for the OGC NewFinity Platform.

## Structure

### Migrations
- `unified-schema-migration.md` - Unified schema migration guide covering all database schema fixes and additions

### Schema Issues
- `user-devices-schema-drift.md` - User devices schema drift report

### Schema Documentation
- `schema-overview.md` - Overall database schema overview

## Key Migrations

### Unified Schema Migration
The unified schema migration (`unified-schema-migration.md`) addresses:
- Missing User table columns (accountStatus, emailVerified, OAuth provider IDs, profile fields, etc.)
- Missing authentication tables (PasswordResetToken, ActivationToken)
- Missing 2FA tables (TwoFactorAuth, UserTwoFactor, UserTwoFactorRecovery)
- Missing session tables (AuthSession, UserDevices)
- Missing activity and wallet tables (UserActivityLog, WalletTransaction)
- Proper indexes and constraints

### Schema Drift Handling
- `user-devices-schema-drift.md` documents schema mismatches between code expectations and database reality
- All migrations are idempotent and safe to run multiple times

## Database Files

SQL migration files are located in `backend/sql/`:
- `unified-schema-migration.sql` - Main unified schema migration
- `user-schema.sql` - User table schema
- `wallet-schema.sql` - Wallet table schema
- `account-system-phase1-migration.sql` - Account system Phase 1 migration
- `account-system-phase5-roles-permissions-migration.sql` - Roles and permissions migration
- Additional phase-specific migrations

## Resolved Issues

All schema drift issues documented in migration reports have been addressed through the unified schema migration. The database now includes all required columns and tables for:
- User management and authentication
- OAuth provider integration
- Two-factor authentication
- Session management
- Activity logging
- Wallet functionality

## Related Documentation

- Backend implementation: [`../backend/`](../backend/)
- Account system: [`../backend/account-system-phase*.md`](../backend/)
- API contracts: [`../02-api-contracts/`](../02-api-contracts/)

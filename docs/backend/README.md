# Backend Documentation

This folder contains backend implementation documentation, API specifications, fixes, and issues tracking for the OGC NewFinity Platform.

## Structure

### API Specifications
- `admin-users-api-spec.md` - Admin Users API contract
- `admin-audit-logs-endpoint.md` - Admin audit logs endpoint specification
- `auth-me-contract.md` - Auth /me endpoint contract
- `auth-error-codes-standardization.md` - Authentication error codes and response standardization

### Feature Implementations

#### Account System
- `account-system-phase1-implementation.md` - Account system Phase 1 implementation
- `account-system-phase2-security-implementation.md` - Security implementation
- `account-system-phase3-2fa-implementation.md` - Two-factor authentication implementation
- `account-system-phase4-roles-access-spec.md` - Roles and access control specification
- `account-system-phase5-roles-permissions-implementation.md` - Roles and permissions implementation
- `account-system-phase6-admin-console-implementation.md` - Admin console implementation

#### Wallet System
- `wallet-basic-api-implementation.md` - Basic wallet API implementation
- `wallet-transactions-api-implementation.md` - Wallet transactions API
- `wallet-staking-api-implementation.md` - Staking API implementation
- `wallet-transfer-api-implementation.md` - Transfer API implementation
- `wallet-overview-api-implementation.md` - Wallet overview API implementation
- `wallet-rewards-api-implementation.md` - Rewards API implementation
- `wallet-history-api-implementation.md` - History API implementation
- `wallet-advanced-api-implementation.md` - Advanced wallet features

#### Security & Authentication
- `secure-change-password-implementation.md` - Secure password change implementation
- `session-device-management-implementation.md` - Session and device management
- `account-data-export-implementation.md` - Account data export functionality
- `account-deletion-implementation.md` - Account deletion implementation
- `2fa-recovery-codes-implementation.md` - 2FA recovery codes
- `login-2fa-enforcement-implementation.md` - Login 2FA enforcement

#### Other Features
- `challenge-entry-api-implementation.md` - Challenge entry API
- `amy-agent-shell-implementation.md` - Amy Agent shell implementation

### Standardizations & Configuration
- `account-status-standardization.md` - Account status enum standardization
- `activation-flow-standardization.md` - Activation flow standardization
- `oauth-provider-configuration.md` - OAuth provider configuration
- `oauth-session-configuration.md` - OAuth session configuration
- `cookie-session-fix.md` - Cookie and session fixes
- `email-mode-configuration.md` - Email mode configuration
- `environment-configuration-fix.md` - Environment configuration fixes
- `proxy-configuration-fix.md` - Proxy configuration fixes
- `feature-gates-configuration.md` - Feature gates configuration
- `feature-gates-adjustment.md` - Feature gates adjustments

### Fixes
- `backend-fixes.md` - General backend fixes
- `profile-security-pages-fixes.md` - Profile and security pages fixes
- `admin-role-detection-fix.md` - Admin role detection fix
- `admin-ui-access.md` - Admin UI access fixes
- `eaddrinuse-fix.md` - EADDRINUSE error fix

### Verification & Testing
- `wallet-api-verification.md` - Wallet API verification checklist
- `wallet-api-verification-summary.md` - Wallet API verification summary
- `start-backend-test-guide.md` - Backend startup and testing guide

### Blueprints
- `backend-implementation-blueprint.md` - Backend implementation blueprint

### Issues Tracking
- `issues.md` - Current issues and resolved fixes

## Issues and Resolved Work

See [`issues.md`](./issues.md) for:
- Pending fixes and known issues
- Resolved issues with implementation details
- Required actions for team tasks

## Related Documentation

- Database migrations: [`../database/`](../database/)
- Frontend integration: [`../frontend/`](../frontend/)
- API contracts: [`../02-api-contracts/`](../02-api-contracts/)

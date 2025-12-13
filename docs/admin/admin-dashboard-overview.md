# Admin Dashboard Overview

## Purpose

The Admin Dashboard is the central control panel for operations, moderation, and system management in the OGC NewFinity Platform.

It is designed for Founder, Core Team, and Admin roles with permission-gated access. The dashboard provides visibility and safe actions over users, content, platform health, and configurations.

## Scope

The Admin Dashboard encompasses:

- **Admin module system**: Registry-driven architecture for scalable module addition
- **Role/permission gated access controls**: Secure access based on user roles and permissions
- **Admin APIs**: Endpoints under `/api/v1/admin/*` that power dashboard functionality
- **Auditability**: Activity logs for admin actions (existing and planned)
- **Observability surfaces**: Basic status and health indicators for platform monitoring
- **Operational workflows**: User management, platform configuration, moderation queues (planned)

## Non-goals

The Admin Dashboard is explicitly NOT:

- A public-facing dashboard (this is for administrative users only)
- A replacement for DevOps tools (CI/CD, logs, APM systems)
- A full ERP or finance suite
- A full analytics warehouse (only operational indicators, not comprehensive analytics)
- A place for experimental endpoints without contract discipline

## Module Registry

The Admin Dashboard is built on a module-based architecture designed to scale as platform needs grow. Each module represents a distinct functional area for administrative operations.

### Current Modules

The following modules are currently implemented:

**Users Management**

- Admin Users listing endpoint under `/api/v1/admin/users` (existing)
- Permission-gated access (existing)
- Supports paging, search, and schema-drift tolerance (existing)
- User profile viewing and role/status management capabilities

### Planned Modules

The following modules are planned for future implementation:

**Core Operations:**

- Roles & Permissions
- System Activity Logs
- Platform Settings
- Feature Flags
- Announcements / Broadcasts

**Trust & Safety:**

- Content Moderation
- User Reports & Appeals
- Abuse Prevention Controls

**Platform & Reliability:**

- Service Health
- Background Jobs / Queue Monitor
- Rate Limit Monitoring
- Incident Mode (Degraded Operations)

**Finance & Tokens** (if applicable to this platform):

- Token/Rewards Oversight
- Wallet Operations Review
- Transaction Dispute Review

**Developer/Admin Tools:**

- API Keys / Integrations
- Webhook & Provider Status
- Email/SMTP Diagnostics

Modules are enabled by routes, permissions, and UI navigation entries. Planned modules are documented placeholders; implementation requires API contract, UI components, and tests.

## Navigation & Information Architecture

The Admin Dashboard navigation structure is organized into stable categories that remain consistent even as modules expand. Each module requires a route, permission requirement, UI page, and documented API contract.

### Recommended Navigation Structure

**Overview**

- Dashboard Home (KPIs + status)
- System Status (health and degraded indicators)

**User Operations**

- Users
- Roles & Permissions (planned)
- User Reports (planned)

**Moderation**

- Content Queue (planned)
- Appeals (planned)

**Platform**

- Settings (planned)
- Feature Flags (planned)
- Integrations (planned)

**Reliability**

- Service Health (planned)
- Jobs/Queues (planned)
- Rate Limits (planned)

**Finance / Wallet** (if enabled)

- Wallet Oversight (planned)
- Rewards Oversight (planned)

Categories must remain stable even if modules expand. Each module has: route, permission requirement, UI page, and documented API contract.

## Dashboard States

All Admin Dashboard modules must implement consistent UI states for a predictable user experience. These states apply to both frontend components and admin API responses.

### Loading

- Display skeleton UI or spinner during data fetching
- Disable destructive actions while loading
- Optional "last updated" timestamp placeholders

### Empty

Distinguish between "empty" (no data matching query) and "no permission" states.

- Example: zero users returned for filter query → show empty state
- Always provide next action: clear filters, refresh, adjust query
- Include helpful messaging explaining why the state is empty

### Error

- Display user-friendly error message when API request fails
- Provide "Retry" action
- Do not leak stack traces or raw HTML responses
- Log detailed error information server-side for debugging

### Degraded Mode

Degraded mode indicates that the Admin Dashboard can still load, but some modules show limited capability.

**Example triggers:**

- Database connectivity unstable
- External provider failures (OAuth/email)
- Background queue down

**Behavior:**

- Read-only mode where necessary
- Disable high-risk actions
- Show banner indicating degraded operations
- Provide clear messaging about what is unavailable

### State Implementation Checklist

- Each module page must implement: loading + empty + error + degraded states
- Each admin API should return consistent JSON error responses
- Permission failures should be distinct from empty states

## Related References

- [Admin Users API Specification](../backend/admin-users-api-spec.md)
- [Backend Issues and Pending Fixes](../backend/issues.md)
- [Service Health Monitoring Specification](../04-backend/88-backend-service-health-monitoring-and-status-endpoint-specification.md)
- [Admin API Contract](../02-api-contracts/28-admin-api-contract.md)
- [Admin Dashboard Architecture](./ADMIN-DASHBOARD-ARCHITECTURE.md)
- [Admin Roles and Permissions](./ADMIN-ROLES-AND-PERMISSIONS.md)

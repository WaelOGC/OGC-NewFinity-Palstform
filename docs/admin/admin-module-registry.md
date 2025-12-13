# Admin Module Registry

## Purpose

This registry is the single source of truth for what modules exist in the Admin Dashboard.

Each module must be traceable to: UI route, backend route(s), required permissions, and operational states. This registry ensures consistency across implementation, documentation, and future development.

## Registry Rules

Every module in the Admin Dashboard must conform to the following rules:

**Required Fields:**

- `id`: Unique identifier (kebab-case, immutable once introduced)
- `name`: Human-readable display name
- `navGroup`: Navigation category (see Navigation Groups section)
- `status`: One of `active`, `planned`, or `disabled`
- `uiRoute`: Frontend route path
- `apiRoutes`: Backend API endpoint(s) that power this module
- `permissions`: Required roles or permissions for access
- `owner`: Team or individual responsible for the module
- `notes`: Implementation details, constraints, or important information

**Status Definitions:**

- `active`: Module is implemented and available for use
- `planned`: Module is documented but not yet implemented
- `disabled`: Module exists but is temporarily disabled (feature flag or maintenance)

**Change Management:**

- Module IDs are kebab-case and never change once introduced
- New modules require adding a registry entry plus creating a dedicated module specification file
- Status changes from `planned` to `active` require implementation completion and documentation
- When a module is deprecated, its status changes to `disabled` and a deprecation note is added

**UI Route Convention:**

All admin modules use the route pattern `/admin/{module-path}` where `module-path` matches the module's `id` field.

## Navigation Groups

Navigation groups provide stable categories for organizing modules. These groups remain consistent even as modules expand:

- **Overview**: Dashboard home, KPIs, and system status
- **User Operations**: User management, roles, and user-related workflows
- **Moderation**: Content moderation, reports, and appeals
- **Platform**: Settings, feature flags, and platform configuration
- **Reliability**: Service health, jobs, queues, and rate limits
- **Finance / Wallet**: Wallet operations, rewards, and transaction oversight (if enabled)
- **Developer Tools**: API keys, integrations, webhooks, and developer utilities

## Modules

### Active Modules

**users-management**

- **Name**: Users Management
- **NavGroup**: User Operations
- **Status**: active
- **UIRoute**: `/admin/users`
- **APIRoutes**: `/api/v1/admin/users`, `/api/v1/admin/users/:userId`
- **Permissions**: `FOUNDER`, `CORE_TEAM`, `ADMIN` role, or `MANAGE_USERS` permission
- **Owner**: Platform Team
- **Notes**: Schema-drift tolerant listing endpoint; supports paging and search; user profile viewing and role/status management capabilities

### Planned Modules

**roles-permissions**

- **Name**: Roles & Permissions
- **NavGroup**: User Operations
- **Status**: planned
- **UIRoute**: `/admin/roles`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Role definition and permission assignment management

**system-activity-logs**

- **Name**: System Activity Logs
- **NavGroup**: Overview
- **Status**: planned
- **UIRoute**: `/admin/activity-logs`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Comprehensive system activity and audit trail viewing

**platform-settings**

- **Name**: Platform Settings
- **NavGroup**: Platform
- **Status**: planned
- **UIRoute**: `/admin/settings`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Platform-wide configuration and environment settings

**feature-flags**

- **Name**: Feature Flags
- **NavGroup**: Platform
- **Status**: planned
- **UIRoute**: `/admin/feature-flags`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Global and per-user feature flag management with rollout control

**announcements**

- **Name**: Announcements
- **NavGroup**: Platform
- **Status**: planned
- **UIRoute**: `/admin/announcements`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: System-wide announcements and broadcast management

**content-moderation**

- **Name**: Content Moderation
- **NavGroup**: Moderation
- **Status**: planned
- **UIRoute**: `/admin/moderation`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Content review queue and moderation actions

**user-reports**

- **Name**: User Reports
- **NavGroup**: Moderation
- **Status**: planned
- **UIRoute**: `/admin/user-reports`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: User-submitted reports and appeals management

**service-health**

- **Name**: Service Health
- **NavGroup**: Reliability
- **Status**: planned
- **UIRoute**: `/admin/service-health`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Service status monitoring and health indicators

**jobs-queues**

- **Name**: Jobs & Queues
- **NavGroup**: Reliability
- **Status**: planned
- **UIRoute**: `/admin/jobs`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Background job monitoring and queue status

**rate-limit-monitoring**

- **Name**: Rate Limit Monitoring
- **NavGroup**: Reliability
- **Status**: planned
- **UIRoute**: `/admin/rate-limits`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Rate limit status and configuration oversight

**incident-mode**

- **Name**: Incident Mode
- **NavGroup**: Reliability
- **Status**: planned
- **UIRoute**: `/admin/incident-mode`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Degraded operations mode and incident response controls

**integrations**

- **Name**: Integrations
- **NavGroup**: Platform
- **Status**: planned
- **UIRoute**: `/admin/integrations`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Third-party integration management and configuration

**api-keys**

- **Name**: API Keys
- **NavGroup**: Developer Tools
- **Status**: planned
- **UIRoute**: `/admin/api-keys`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: API key management and access control

**email-diagnostics**

- **Name**: Email Diagnostics
- **NavGroup**: Developer Tools
- **Status**: planned
- **UIRoute**: `/admin/email-diagnostics`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Email/SMTP diagnostics and delivery status monitoring

**wallet-oversight**

- **Name**: Wallet Oversight
- **NavGroup**: Finance / Wallet
- **Status**: planned
- **UIRoute**: `/admin/wallet-oversight`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Wallet operations review and transaction oversight

**rewards-oversight**

- **Name**: Rewards Oversight
- **NavGroup**: Finance / Wallet
- **Status**: planned
- **UIRoute**: `/admin/rewards-oversight`
- **APIRoutes**: TBD
- **Permissions**: admin-only
- **Owner**: Unassigned
- **Notes**: Token and rewards distribution oversight

## Module Spec Template

Every module requires a dedicated specification file that follows this template structure. Create specification files at `docs/admin/modules/{module-id}.md`.

```markdown
# {Module Name} Module Specification

## Purpose

Brief description of what this module does and why it exists.

## UI Routes

- Primary route: `/admin/{module-path}`
- Nested routes (if applicable): List sub-routes
- Route parameters: Document any dynamic segments

## API Routes

- Primary endpoint: `/api/v1/admin/{endpoint}`
- Additional endpoints: List all endpoints this module uses
- Request/Response formats: Reference API contract documentation

## Permissions Model

- Required roles: List roles that can access this module
- Required permissions: List specific permissions if using permission-based access
- Special cases: Document any edge cases or exceptions

## Data Model

(Optional - include if module has specific data requirements)

- Key entities: List main data structures
- Relationships: Document entity relationships
- Constraints: Document business rules or validation requirements

## Page States

Document how the module handles each state:

- **Loading**: How loading state is displayed
- **Empty**: Empty state messaging and actions
- **Error**: Error handling and retry mechanisms
- **Degraded**: Behavior when services are degraded

## Auditing Events

List all audit events this module generates:

- Event names: Use consistent naming convention
- When triggered: Document what actions trigger events
- Event payload: Reference audit log schema

## Acceptance Criteria

- Functional requirements: List must-have features
- Performance requirements: Response time, data limits, etc.
- Security requirements: Access controls, validation, etc.
- Accessibility requirements: Keyboard navigation, screen readers, etc.
```

## Related References

- [Admin Dashboard Overview](./admin-dashboard-overview.md)
- [Admin Users API Specification](../backend/admin-users-api-spec.md)
- [Backend Issues and Pending Fixes](../backend/issues.md)
- [Admin API Contract](../02-api-contracts/28-admin-api-contract.md)
- [Admin Dashboard Architecture](./ADMIN-DASHBOARD-ARCHITECTURE.md)

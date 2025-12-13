// backend/src/config/adminModuleRegistry.js

/**
 * Admin Module Registry
 * 
 * Server-side source of truth for admin modules.
 * Must match docs/admin/admin-module-registry.md
 * 
 * Each module entry includes:
 * - id: Unique identifier (kebab-case)
 * - name: Human-readable display name
 * - navGroup: Navigation category
 * - status: active | planned | disabled
 * - uiRoute: Frontend route path
 * - apiRoutes: Array of API endpoints or "TBD"
 * - permissions: Array of required permissions/roles (or ["ADMIN"] for admin-only)
 * - owner: Team or individual responsible
 * - notes: Implementation details
 */

export const ADMIN_MODULES = [
  // Active Modules
  {
    id: 'users-management',
    name: 'Users Management',
    navGroup: 'User Operations',
    status: 'active',
    uiRoute: '/admin/users',
    apiRoutes: ['/api/v1/admin/users', '/api/v1/admin/users/:userId'],
    permissions: ['FOUNDER', 'CORE_TEAM', 'ADMIN', 'VIEW_ADMIN_DASHBOARD', 'MANAGE_USERS'],
    owner: 'Platform Team',
    notes: 'Schema-drift tolerant listing endpoint; supports paging and search; user profile viewing and role/status management capabilities',
  },

  // Planned Modules
  {
    id: 'roles-permissions',
    name: 'Roles & Permissions',
    navGroup: 'User Operations',
    status: 'planned',
    uiRoute: '/admin/roles',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Role definition and permission assignment management',
  },
  {
    id: 'system-activity-logs',
    name: 'System Activity Logs',
    navGroup: 'Overview',
    status: 'planned',
    uiRoute: '/admin/activity-logs',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Comprehensive system activity and audit trail viewing',
  },
  {
    id: 'platform-settings',
    name: 'Platform Settings',
    navGroup: 'Platform',
    status: 'planned',
    uiRoute: '/admin/settings',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Platform-wide configuration and environment settings',
  },
  {
    id: 'feature-flags',
    name: 'Feature Flags',
    navGroup: 'Platform',
    status: 'planned',
    uiRoute: '/admin/feature-flags',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Global and per-user feature flag management with rollout control',
  },
  {
    id: 'announcements',
    name: 'Announcements',
    navGroup: 'Platform',
    status: 'planned',
    uiRoute: '/admin/announcements',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'System-wide announcements and broadcast management',
  },
  {
    id: 'content-moderation',
    name: 'Content Moderation',
    navGroup: 'Moderation',
    status: 'planned',
    uiRoute: '/admin/moderation',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Content review queue and moderation actions',
  },
  {
    id: 'user-reports',
    name: 'User Reports',
    navGroup: 'Moderation',
    status: 'planned',
    uiRoute: '/admin/user-reports',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'User-submitted reports and appeals management',
  },
  {
    id: 'service-health',
    name: 'Service Health',
    navGroup: 'Reliability',
    status: 'planned',
    uiRoute: '/admin/service-health',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Service status monitoring and health indicators',
  },
  {
    id: 'jobs-queues',
    name: 'Jobs & Queues',
    navGroup: 'Reliability',
    status: 'planned',
    uiRoute: '/admin/jobs',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Background job monitoring and queue status',
  },
  {
    id: 'rate-limit-monitoring',
    name: 'Rate Limit Monitoring',
    navGroup: 'Reliability',
    status: 'planned',
    uiRoute: '/admin/rate-limits',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Rate limit status and configuration oversight',
  },
  {
    id: 'incident-mode',
    name: 'Incident Mode',
    navGroup: 'Reliability',
    status: 'planned',
    uiRoute: '/admin/incident-mode',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Degraded operations mode and incident response controls',
  },
  {
    id: 'integrations',
    name: 'Integrations',
    navGroup: 'Platform',
    status: 'planned',
    uiRoute: '/admin/integrations',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Third-party integration management and configuration',
  },
  {
    id: 'api-keys',
    name: 'API Keys',
    navGroup: 'Developer Tools',
    status: 'planned',
    uiRoute: '/admin/api-keys',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'API key management and access control',
  },
  {
    id: 'email-diagnostics',
    name: 'Email Diagnostics',
    navGroup: 'Developer Tools',
    status: 'planned',
    uiRoute: '/admin/email-diagnostics',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Email/SMTP diagnostics and delivery status monitoring',
  },
  {
    id: 'wallet-oversight',
    name: 'Wallet Oversight',
    navGroup: 'Finance / Wallet',
    status: 'planned',
    uiRoute: '/admin/wallet-oversight',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Wallet operations review and transaction oversight',
  },
  {
    id: 'rewards-oversight',
    name: 'Rewards Oversight',
    navGroup: 'Finance / Wallet',
    status: 'planned',
    uiRoute: '/admin/rewards-oversight',
    apiRoutes: 'TBD',
    permissions: ['ADMIN'],
    owner: 'Unassigned',
    notes: 'Token and rewards distribution oversight',
  },
];

# OGC NewFinity Platform — Dashboard Navigation Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

This document defines the full dashboard navigation structure for the authenticated areas of the OGC NewFinity Platform.

It ensures consistent behavior, predictable layout mapping, and a clear separation between user, wallet, Amy AI Agent, and admin sections.

Navigation is a core part of the platform UX and must follow strict naming and structural rules.

## 2. Navigation Philosophy

The dashboard follows these principles:

- **Simple & predictable** — the user always knows where they are.
- **Roles matter** — Admins see more menus than Users.
- **Section isolation** — Wallet, Amy, and Admin each have their own sub-sidebars.
- **Layout-driven** — Navigation is determined by layout, not pages.
- **Expandable** — Should support future modules (Governance, Analytics, API Tools).

## 3. Main Dashboard Navigation Map

### 3.1 Root Dashboard (DashboardLayout)

**/dashboard**

- • Overview (`/dashboard/overview`)
- • Profile (`/dashboard/profile`)
- • Security (`/dashboard/security`)

These pages represent the universal dashboard accessible to all authenticated users.

## 4. Wallet Navigation (WalletLayout)

**Base Path:**

`/wallet`

**Navigation Structure:**

- Wallet Overview         → `/wallet`
- Earnings & Rewards      → `/wallet/earnings`
- Transaction History     → `/wallet/history`
- Contribution Mining     → `/wallet/contribution`
- Badges & Achievements   → `/wallet/badges`

**Notes:**

- Ordering must remain consistent.
- Active states must reflect exact matching.
- Future additions:
  - Staking
  - Governance Rewards
  - On-chain Sync Page

## 5. Amy AI Agent Navigation (AmyLayout)

**Base Path:**

`/ai-agent`

**Navigation Structure:**

- Tool Categories         → `/ai-agent`
- Tool Usage History      → `/ai-agent/history`
- Saved Outputs           → `/ai-agent/saved`    (Phase 2+)
- Favorites               → `/ai-agent/favorites` (Phase 2+)

**Rules:**

- Core tools (write, code, design, business, etc.) appear inside the category grid, not the sidebar.
- Sidebar must remain minimal and uncluttered.

## 6. Admin Panel Navigation (AdminLayout)

**Base Path:**

`/admin`

**Navigation Structure:**

- Admin Overview          → `/admin`
- User Management        → `/admin/users`
- Challenge Management   → `/admin/challenges`
- Badge Management       → `/admin/badges`
- Reports & Analytics    → `/admin/reports`
- Notifications Center    → `/admin/notifications`
- System Logs            → `/admin/logs`   (future)

**Role Enforcement:**

Only users with role "admin" may access any of these routes.

## 7. Navigation Rendering Rules

### 7.1 Active State

A menu item is active when:

- `currentPath === menuItem.path`

For parent-level matching:

- `currentPath.startsWith(menuItem.basePath)`

### 7.2 Sidebar Variations

Each layout loads its own sidebar:

- `DashboardLayout` → `DashboardSidebar`
- `WalletLayout`    → `WalletSidebar`
- `AmyLayout`       → `AmySidebar`
- `AdminLayout`     → `AdminSidebar`

### 7.3 Icons

Icons must be:

- lightweight
- consistent style
- same size across all sections

## 8. Role-Based Visibility

**Example rule:**

```
if user.role !== "admin": hide Admin menu block
```

**Partner roles (future):**

Will unlock partner analytics pages.

## 9. File Structure Reference

**components/sidebar/**

- `DashboardSidebar.jsx`
- `WalletSidebar.jsx`
- `AmySidebar.jsx`
- `AdminSidebar.jsx`

Each sidebar imports its own navigation map from:

- `constants/navigation.js`

## 10. Versioning & Maintenance

Update this document when:

- New dashboard modules are added
- Navigation order changes
- New sidebar variations are introduced
- Admin tools expand

Record all significant changes in `docs/changelog.md`.

## 11. Linked Documents

- `/docs/frontend/layouts-and-navigation.md`
- `/docs/frontend/base-layout-components.md`
- `/docs/frontend/file-structure.md` (future)
- `/docs/flows/dashboard-flow.md` (future)


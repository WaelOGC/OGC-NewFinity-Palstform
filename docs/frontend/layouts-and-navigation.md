# OGC NewFinity Platform — Frontend Layouts & Navigation

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

This document defines the full architecture of the frontend layout system used across the OGC NewFinity Platform.

It ensures consistent UI and routing behavior across all dashboards, public pages, and authenticated user areas.

This document is part of the internal documentation set and must follow repository naming, structural, and versioning rules.

## 2. Layout System Overview

The platform uses a multi-layout architecture, separating public pages, authentication pages, and dashboard pages into dedicated layout containers.

**Layout Types:**

- **AuthLayout**
  - Handles: login, register, password reset
  - Minimal UI
  - No header, no sidebar
  - Used for onboarding flows

- **PlatformLayout**
  - Used for: main website and public pages
  - Shared header and footer
  - Global navigation
  - No dashboard sidebar

- **DashboardLayout**
  - Used for: all authenticated dashboards
  - Contains sidebar + dashboard header
  - Protected routes
  - Handles: user dashboard, wallet, Amy Agent, admin sections

- **Sub-Layouts** (specialized children of DashboardLayout)
  - WalletLayout → wallet pages
  - AmyLayout → Amy AI dashboard
  - AdminLayout → admin tools panel

Each layout controls its own UI region, state, and theme behavior.

## 3. Routing & Layout Mapping

The platform uses a route → layout → page mapping system.

### 3.1 Public Pages (PlatformLayout)

- /
- /about
- /services
- /challenge
- /roadmap
- /contact

### 3.2 Authentication Pages (AuthLayout)

- /login
- /register
- /forgot-password
- /reset-password
- /verify

### 3.3 Dashboard Pages (DashboardLayout)

- /dashboard/overview
- /dashboard/profile
- /dashboard/security

### 3.4 Wallet Dashboard (WalletLayout)

- /wallet
- /wallet/earnings
- /wallet/history
- /wallet/contribution
- /wallet/badges

### 3.5 Amy Agent Dashboard (AmyLayout)

- /ai-agent
- /ai-agent/tools
- /ai-agent/history

### 3.6 Admin Panel (AdminLayout)

- /admin
- /admin/users
- /admin/reports
- /admin/challenges
- /admin/notifications

## 4. Base Layout Responsibilities

### 4.1 AuthLayout

- Provides container for authentication-related pages.
- No header/footer.
- Minimal design for focus.
- Manages onboarding forms.

### 4.2 PlatformLayout

- Provides header, footer, and global navigation.
- Hosts all public-facing pages.
- Integrates with the main corporate website.

### 4.3 DashboardLayout

- Provides sidebar navigation.
- Manages dashboard-level state.
- Enforces protected routes (requires valid JWT).
- Contains dashboard header.

### 4.4 Specialized Layouts

Each sub-layout extends DashboardLayout and injects feature-specific components:

**WalletLayout**
- Wallet navigation
- Sync status information
- Token balance summary

**AmyLayout**
- Tool categories navigation
- Dynamic tool container
- Context manager for Amy responses

**AdminLayout**
- Admin panel navigation map
- Access limitations
- Log & moderation tools

## 5. Layout File Structure

Recommended file structure inside `/src/layouts/`:

```
layouts/
  AuthLayout.jsx
  PlatformLayout.jsx
  DashboardLayout.jsx
  wallet/
    WalletLayout.jsx
  amy/
    AmyLayout.jsx
  admin/
    AdminLayout.jsx
```

## 6. Navigation System

### 6.1 Route Protection

Protected routes must use a shared component:

```jsx
<ProtectedRoute roles={["user","admin"]}>
    <DashboardPage />
</ProtectedRoute>
```

### 6.2 Role-Based Access

Admin routes must check:

- `role === "admin"`

### 6.3 Sidebar & Menu Rules

- Dashboard pages must define their sidebar item.
- Wallet & Amy layouts define their own sub-navigation.

## 7. Theme Structure

The system supports:

- Dark theme
- Light theme (future)
- System-based theme selection

Dashboard layouts must apply theme classes at layout-level.

## 8. Versioning & Maintenance

This document must be updated when:

- New layouts are added
- Navigation structure changes
- New dashboards (e.g., Governance) are introduced

Record major changes in `/docs/changelog.md`.

## 9. Linked Documents

After additional internal files are created, link them here:

- `/docs/frontend/base-layout-components.md`
- `/docs/frontend/dashboard-navigation.md`
- `/docs/flows/*`

END OF FILE CONTENT


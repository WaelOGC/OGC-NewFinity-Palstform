# OGC NewFinity Platform — Admin Tools Overview

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

The Admin Tools subsystem provides the administrative and moderation capabilities required to manage the OGC NewFinity Platform.

This includes:

- User management
- Contribution & badge adjustments
- Challenge oversight
- Reward controls
- Logs & monitoring
- Notifications
- Platform stability
- Early governance controls

This document defines the core architecture and responsibilities of the Admin Tools.

## 2. Admin Panel Overview

**Base Path:**

`/admin`

Admin access is restricted to:

- `role === "admin"`

The Admin Panel is built with:

- `AdminLayout`
- `AdminSidebar`
- Admin-specific UI components
- Admin API endpoints

## 3. Admin Core Modules

The Admin dashboard contains the following modules:

### 3.1 Admin Overview

A summary view showing:

- User stats
- Total contribution counts
- Badge distribution
- Earnings distribution
- Active challenges
- System alerts

### 3.2 User Management

Handles:

- Searching users
- Viewing detailed user profiles
- Role updates (user → admin)
- Account status changes (active, suspended)
- Viewing contribution history
- Viewing badge history
- Admin adjustments

Fields visible include:

- Email
- Wallet balance
- Contribution score
- Badges
- Recent activity

### 3.3 Challenge Management

Admins can:

- Approve new challenges
- Moderate challenge submissions
- Adjust challenge visibility
- Remove or flag inappropriate content
- Reward winners (future)

### 3.4 Badge Management

Admins can:

- Award badges
- Remove badges
- View badge logs
- Adjust badge progress

### 3.5 Contribution Adjustments

Admins can:

- Add contribution
- Remove contribution
- Bulk adjust contribution scores
- View contribution logs

Logged in:

- `activity_log`

### 3.6 Reports & Analytics

Includes:

- Challenge performance
- Wallet earnings statistics
- Contribution trends
- Badge acquisition trends
- User activity stats

Future versions:

- Export to CSV
- Real-time dashboards
- Admin insights panel

### 3.7 Notifications Center

Admins can:

- Send global announcements
- Send targeted notifications
- Manage queued messages
- View notification delivery logs

Future:

- Scheduled notifications
- Category-based filtering

### 3.8 System Logs

Stores:

- `roles_log`
- `status_log`
- `activity_log`

Used for:

- Moderation
- Security oversight
- Auditing
- Debugging platform behavior

## 4. Admin UI Structure

Admin Panel follows a clear wireframe system:

```
[Admin Header - Admin name, actions]
[Admin Sidebar - Navigation links]
[Admin Content Area]
    • Dashboard widgets
    • Tables (users, logs, challenges)
    • Graphs (analytics)
    • Forms (badge/contribution adjustments)
```

Admin components:

- `AdminHeader.jsx`
- `AdminSidebar.jsx`
- `AdminTable.jsx`
- `AdminStatsWidget.jsx`
- `AdminModal.jsx`

## 5. Data & Database Integration

Admin Tools rely heavily on the following tables:

**USERS**

- `user_id`
- `email`
- `role`
- `status`
- `created_at`

**WALLETS**

- `wallet_id`
- `user_id`
- `balance`
- `updated_at`

**ACTIVITY_LOG**

- `event_type`
- `user_id`
- `metadata`
- `timestamp`

**ROLES_LOG**

Tracks role updates.

**STATUS_LOG**

Tracks account status changes.

## 6. API Integration

Admin API endpoints include:

**GET /admin/users**

List users.

**GET /admin/users/:id**

Detailed profile.

**POST /admin/roles/update**

Update roles.

**POST /admin/status/update**

Suspend/activate accounts.

**POST /admin/contribution/add**

Admin-awarded contribution.

**POST /admin/badges/award**

Award a badge.

**GET /admin/logs**

View logs.

Future:

- `/admin/challenges`
- `/admin/notifications`
- `/admin/analytics`

## 7. Security & Permissions

Key rules:

- All admin endpoints require JWT + role "admin".
- Admin actions are always logged.
- Sensitive changes (role, status) must require confirmation.
- Admin UI must clearly display user status and history.
- No silent/background changes — all must be logged.

## 8. Versioning & Maintenance

Update this document when:

- New admin modules are introduced
- Permissions change
- Logs expand
- New analytics panels are added

Record changes in `/docs/changelog.md`.

## 9. Linked Documents

- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/database/schema-overview.md` (next mission)
- `/docs/api/admin-api-blueprint.md` (future)


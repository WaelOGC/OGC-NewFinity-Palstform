# OGC NewFinity Platform — Flows Overview

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

This document provides a high-level overview of the core user and system flows across the OGC NewFinity Platform.

It serves as the master reference for:

- User experience flows
- Authentication flows
- Dashboard flows
- Wallet flows
- Contribution & Badge flows
- Amy Agent flows
- Admin flows (overview level)
- Cross-module interaction

This document links all functional modules together into a unified understanding of how the platform works.

## 2. User Lifecycle Flow

The core user journey:

```
Visitor → Registration → Verification → Login →
Dashboard Overview → Wallet → Amy → Challenges → Rewards →
Long-term engagement → Contribution growth → Badges → Governance (future)
```

**Key Stages:**

- First visit
- Authentication
- Dashboard onboarding
- Reward-based engagement
- Long-term growth via Contribution + Badges

## 3. Authentication Flow

**Main steps:**

```
User enters credentials →
System validates →
Generate JWT tokens →
Set secure cookies →
Redirect to dashboard →
Refresh tokens automatically (silent refresh)
```

Authentication includes:

- Login
- Register
- Forgot password
- Reset password
- Email verification
- Token refresh
- Sign-out

Auth UI lives under:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

## 4. Dashboard Flow

Once authenticated, the user enters:

`/dashboard`

**Flow:**

```
Load user → Load role → Load sidebar → Show overview →
User navigates between pages → Sidebar updates active state →
ProtectedRoute ensures access control
```

Dashboard sections:

- Overview
- Profile
- Security
- Settings (future)

Navigation tied to:

- `DashboardLayout`
- `DashboardSidebar`
- Role-based access (admin routes hidden for users)

## 5. Wallet Flow

Wallet is accessed via:

`/wallet`

**Wallet flow:**

```
Load balance → Load pending rewards →
Display sync status →
User navigates wallet tabs →
Fetch tab-specific data (earnings/history/contribution/badges)
```

Wallet tabs:

- Overview
- Earnings
- History
- Contribution
- Badges

Wallet integrates with:

- Contribution System
- Badges
- Amy Rewards
- Admin adjustments
- Reward engine (Phase 2)

## 6. Contribution Flow

**Contribution events flow:**

```
User performs action →
Action triggers contribution event →
System logs event →
Contribution score increases →
Contribution score displayed in wallet →
Badge system checks milestones →
Badge progression occurs
```

Contribution sources:

- Amy usage
- Challenges
- Engagement
- Content creation
- Admin adjustments

## 7. Badge Flow

**Badge progression flow:**

```
Contribution event logged →
Progress applied to badge category →
If requirement met → Award badge →
Badge becomes visible in wallet →
Badge may increase multipliers (Phase 2)
```

Badge UI flow:

- Badge Grid
- Badge Modal
- Badge progress display

Badges affect:

- Contribution multiplier (future)
- Earnings multiplier (future)

## 8. Amy Agent Flow

**Amy flow:**

```
User opens Amy →  
Selects tool category →  
Executes action (text/design/code/business/etc.) →  
Amy returns output →  
System logs event →  
Contribution increases →  
Badge progress increases →
(optional) Save output (Phase 2+)
```

Amy integrates with:

- Contribution System
- Wallet rewards (future)
- User history
- Admin logs

Paths:

- `/ai-agent`
- `/ai-agent/history`
- `/ai-agent/saved` (future)

## 9. Admin Flow (High-Level)

**Admin lifecycle:**

```
Admin logs in →
Admin dashboard loads →
Admin selects module →
System fetches necessary data →
Admin performs actions (approve, update, adjust, award, notify)
```

Admin can manage:

- Users
- Contribution
- Badges
- Challenges
- Logs
- Notifications

Admin path:

`/admin`

## 10. Navigation Flow Summary

High-level map:

**Public Layout**

- → Homepage
- → About
- → Contact
- → Challenge Listing

**Auth Layout**

- → Login
- → Register

**Dashboard Layout**

- → Overview
- → Wallet
- → Amy
- → Profile
- → Security

**Admin Layout**

- → Admin Dashboard
- → Users
- → Challenges
- → Logs

Layouts define route → UI structure mapping.

## 11. Cross-Module Interaction

This section explains how modules influence each other.

**Contribution ↔ Wallet**

Contribution generates earnings (Phase 2+).

**Amy ↔ Contribution**

Using Amy tools produces contribution events.

**Challenges ↔ Contribution**

Challenge participation adds contribution and can trigger badges.

**Badges ↔ Wallet**

Badges increase future multipliers.

**Admin ↔ Everything**

Admins moderate all systems and logs.

## 12. Linked Documents

- `/docs/frontend/layouts-and-navigation.md`
- `/docs/frontend/dashboard-navigation.md`
- `/docs/wallet/wallet-product-spec.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/admin/admin-tools-overview.md`
- `/docs/database/schema-overview.md`
- `/docs/mermaid/*` (future links)


# OGC NewFinity Platform — Database Schema Overview

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

This document defines the high-level database schema for the OGC NewFinity Platform.

It provides an internal reference for:

- Backend development
- API design
- Admin tools
- Wallet & rewards
- Contribution system
- Badge progression
- Challenge system
- Analytics and logs

This is not a full Prisma schema — it is the foundational schema overview.

## 2. Database Philosophy

The OGC Platform database is built with the following principles:

- Normalized structure
- Clear relationships
- Scalable tables
- Full auditability via logs
- Upgradeable for Phase 2 & 3 features (staking / governance)
- Role-based & activity-based tracking

## 3. Core Tables

Below are the essential tables for Phase 1 and Phase 2.

### 3.1 USERS

Stores user accounts.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique |
| password_hash | String | Hashed password |
| role | Enum(user, admin, partner) | Access level |
| status | Enum(active, suspended) | Account state |
| created_at | Timestamp | Registration time |
| updated_at | Timestamp | Last update |

### 3.2 WALLETS

Stores reward balances.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → USERS(id) |
| balance | Decimal | Token balance |
| pending_rewards | Decimal | Yet-to-claim earnings |
| last_sync_at | Timestamp | Last sync time |
| updated_at | Timestamp | Last update |

### 3.3 TRANSACTIONS

Wallet transaction history.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → USERS(id) |
| type | Enum(earning, adjustment, challenge, amy, admin) | Transaction type |
| amount | Decimal | Amount of tokens |
| metadata | JSON | Additional info |
| created_at | Timestamp | Transaction time |

### 3.4 CONTRIBUTION_EVENTS

Tracks contribution events.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → USERS(id) |
| category | Enum(amy, challenge, engagement, content, admin) | Contribution source |
| points | Integer | Contribution points |
| metadata | JSON | Additional detail |
| created_at | Timestamp | When event happened |

### 3.5 BADGES

Static badge definition table.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Badge name |
| category | String | Badge category |
| description | String | Badge description |
| level | Enum(bronze, silver, gold, diamond) | Badge level |
| requirement | Integer | Required points/usage |
| multiplier | Decimal | Contribution multiplier |
| created_at | Timestamp | Created time |

### 3.6 USER_BADGES

User-specific badge progress.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → USERS(id) |
| badge_id | UUID | FK → BADGES(id) |
| progress | Integer | Current progress |
| earned | Boolean | Earned or not |
| earned_at | Timestamp | Award time |

### 3.7 CHALLENGES

Challenge definitions.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | String | Challenge title |
| category | String | Category (creative, technical) |
| description | Text | Challenge description |
| status | Enum(active, closed) | Challenge state |
| created_at | Timestamp | Created |
| updated_at | Timestamp | Updated |

### 3.8 SUBMISSIONS

Challenge submissions by users.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| challenge_id | UUID | FK → CHALLENGES(id) |
| user_id | UUID | FK → USERS(id) |
| content_url | String | URL to submission |
| votes | Integer | Future voting system |
| created_at | Timestamp | When submitted |

## 4. Log Tables

Logging is mandatory for transparency.

### 4.1 ACTIVITY_LOG

Tracks system-wide events.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → USERS(id) |
| event | String | Event type |
| metadata | JSON | Extra details |
| created_at | Timestamp | Time logged |

### 4.2 ROLES_LOG

Tracks all role changes.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → USERS(id) |
| old_role | String | Previous role |
| new_role | String | Updated role |
| changed_by | UUID | Admin user id |
| created_at | Timestamp | When changed |

### 4.3 STATUS_LOG

Tracks account status changes.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → USERS(id) |
| old_status | String | Previous status |
| new_status | String | Updated status |
| changed_by | UUID | Admin user |
| created_at | Timestamp | When changed |

## 5. Relationships (High-Level)

- USERS 1 ──── 1 WALLETS
- USERS 1 ──── * TRANSACTIONS
- USERS 1 ──── * CONTRIBUTION_EVENTS
- USERS * ──── * BADGES (through USER_BADGES)
- CHALLENGES 1 ──── * SUBMISSIONS
- USERS 1 ──── * ACTIVITY_LOG

Future relationships:

- USERS → GOVERNANCE_VOTES
- USERS → STAKING

## 6. Future Tables (Phase 2–3)

**STAKING**

- stake_id
- amount
- duration
- APR
- rewards

**GOVERNANCE**

- proposals
- votes
- participation score

**NOTIFICATIONS**

- message
- target group
- delivery status

## 7. Versioning & Maintenance

Update this document when:

- New tables are added
- Table fields change
- Contribution/Badge logic evolves
- Challenge system expands
- Staking/Governance is introduced

Record changes in `/docs/changelog.md`.

## 8. Linked Documents

- `/docs/admin/admin-tools-overview.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/wallet/wallet-product-spec.md`


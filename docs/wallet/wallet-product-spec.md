# OGC NewFinity Platform — Wallet Product Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

The OGC Wallet is the central economic system of the OGC NewFinity Platform.

It manages token balance, earnings, Contribution-Based Mining, badges, rewards, and future staking/governance features.

This document defines the full product specification of the Wallet Module.

## 2. Wallet Overview

The wallet provides users with:

- Token balance (off-chain + synced view)
- Earnings & Rewards
- Contribution Mining
- Badges & Achievements
- Transaction History
- Future staking (Phase 2+)
- Governance integration (Phase 3+)

The Wallet is tightly integrated with:

- Contribution System
- Badge Engine
- Amy Agent Rewards
- Admin reward adjustments
- Off-chain reward logic (Genesis Phase)

## 3. Architecture & Layout

### 3.1 Base Path

`/wallet`

### 3.2 Layout

Handled by:

- `WalletLayout.jsx`

Includes:

- Wallet sidebar
- Wallet top-summary (balance + sync status)
- Main content area

## 4. Wallet Phases (Roadmap)

**Phase 1 — Genesis (Current)**

- Off-chain rewards only
- Manual reconciliation
- Contribution Mining (Preview)
- Badges (Preview)
- No staking
- No governance voting

**Phase 2 — Expansion**

- Simulated staking
- Enhanced rewards model
- Contribution → Earnings → Wallet integration live
- Sync scheduler
- Badge engine fully active

**Phase 3 — Decentralized**

- Token staking
- Automated reward distribution
- Governance voting pages
- On-chain reconciliation

## 5. Wallet Tabs

### 5.1 Overview

**/wallet**

Displays:

- Token balance
- Earnings summary
- Reward multipliers (future)
- Last sync time
- Contribution & badge shortcuts
- Pending payouts

### 5.2 Earnings & Rewards

**/wallet/earnings**

Shows:

- Recent reward events
- Earnings graph
- Bonus multipliers (future)
- Admin-adjusted rewards
- Amy-generated rewards

### 5.3 Transaction History

**/wallet/history**

Shows:

- All wallet transactions
- Pagination
- Filters (Type, Date, Source)

Events include:

- Earnings
- Admin adjustments
- Challenge participation
- Contribution-Based Mining events

### 5.4 Contribution Mining

**/wallet/contribution**

Shows:

- Contribution score
- Breakdown of actions
- Mining formula summary
- Leaderboard access (future)

Contribution actions include:

- Creating content
- Supporting challenges
- Using Amy
- Daily engagement

### 5.5 Badges & Achievements

**/wallet/badges**

Shows:

- Earned badges
- Locked badges
- Badge levels
- Badge points → earnings multiplier (future)

Badges link to:

- Contribution
- Challenges
- Amy usage
- Engagement

## 6. Syncing & Data Flow

### 6.1 Off-Chain (Phase 1)

- All rewards stored in MySQL
- Blockchain not yet active
- Admin can adjust balances

### 6.2 On-Chain (Phase 2/3)

- Real Polygon integration
- Transaction hash linking
- Sync scheduler (cron job)
- On-chain staking

### 6.3 Data Sources

Rewards come from:

- Contribution System
- Challenge Program
- Amy Agent
- Admin decisions
- Automated platform logic

## 7. Component Structure

Recommended folder structure:

```
src/pages/wallet/
    index.jsx
    earnings.jsx
    history.jsx
    contribution.jsx
    badges.jsx

src/layouts/wallet/
    WalletLayout.jsx

src/components/wallet/
    WalletSummary.jsx
    EarningsList.jsx
    ContributionBreakdown.jsx
    BadgeGrid.jsx
```

## 8. API Integration

Wallet uses these endpoints:

**GET /wallet/balance**

Returns:

- `balance`
- `pendingRewards`
- `lastSyncAt`

**GET /wallet/transactions**

Paginated list of events.

**GET /wallet/contribution**

Returns contribution score & breakdown.

**GET /wallet/badges**

Returns badges + metadata.

All endpoints require JWT.

## 9. Versioning & Maintenance

Update this document when:

- New staking features are introduced
- Governance integration begins
- Contribution or badge logic changes
- Wallet UI expands

Changes must be logged in `/docs/changelog.md`.

## 10. Linked Documents

- `/docs/wallet/wallet-ui-wireframes.md` (next task)
- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/api/wallet-api-blueprint.md`


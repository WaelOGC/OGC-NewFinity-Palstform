# OGC NewFinity Platform — Governance System Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal; Phase 3)**

## 1. Purpose

The Governance System enables OGC NewFinity users to participate in platform decision-making by:

- Staking tokens
- Gaining governance rights
- Voting on proposals
- Submitting proposals (qualified users)
- Influencing platform direction

Governance is introduced in Phase 3 and is tightly connected to:

- Subscription System
- Wallet (staking)
- Contribution System
- Badges (governance badges)
- Notifications

This document defines the complete governance framework.

## 2. Governance Architecture Overview

Components include:

### 2.1 Staking Engine

Users stake OGCFinity to unlock governance rights.

### 2.2 Governance Dashboard

UI for:

- Voting
- Proposal browsing
- Proposal creation
- Staking status

### 2.3 Proposal Engine

Where new proposals are created, validated, and published.

### 2.4 Voting Engine

Handles voting weight, vote submission, and vote counting.

### 2.5 Governance Rewards

Token or contribution rewards for participation.

## 3. Governance Eligibility

Governance participation requires:

### 3.1 Governance Tier (via Subscription System)

Access is granted to users with:

- `subscription.tier === "governance"`

### 3.2 Staking Requirements

Minimum stake required (example values):

| Tier | Governance Stake |
|------|------------------|
| Governance Tier | 100 OGCFinity |
| Extended Tier | 500 OGCFinity |
| Proposer Tier | 1000 OGCFinity |

(Actual values defined in Phase 3 rollout.)

### 3.3 Account Requirements

- Account must be active
- No suspensions
- Verified in Phase 2 KYC (optional)

## 4. Proposal System

### 4.1 Proposal Types

- Platform feature proposals
- Reward distribution changes
- Governance rules
- System improvements

### 4.2 Proposal Fields

Each proposal includes:

| Field | Description |
|-------|-------------|
| id | Unique proposal ID |
| category | Feature / governance / reward |
| title | Proposal title |
| description | Detailed content |
| created_by | User ID |
| stake_required | Minimum stake |
| status | draft / active / closed |
| start_at | Voting start |
| end_at | Voting end |
| results | Vote tallies |

### 4.3 Proposal Lifecycle

```
Draft → Submitted → Validation → Published →
Voting Phase → Closed → Results Released → Archived
```

### 4.4 Validation Rules

Admin or governance council verifies that a proposal:

- Is not a duplicate
- Does not violate system rules
- Does not contain harmful content

## 5. Voting System

### 5.1 Voting Weights

Voting power is determined by:

```
stake_amount × governance_multiplier
```

Multipliers come from:

- Badges
- Contribution milestones
- Special governance events

**Example:**

| Stake | Multiplier | Vote Weight |
|-------|------------|-------------|
| 100 | 1.0 | 100 |
| 250 | 1.1 | 275 |
| 500 | 1.2 | 600 |

### 5.2 Vote Types

- Yes / No
- Multi-choice (future)

### 5.3 Voting Flow

```
User opens proposal →
System checks eligibility →
User submits vote →
Backend logs vote →
Voting engine updates tallies →
UI updates in real-time →
Voting closes →
Results published
```

### 5.4 Voting Security

- One vote per user
- Immutable vote logs
- Privacy protection
- Admin cannot override votes

## 6. Staking Model

### 6.1 Staking Flow

```
User stakes OGCFinity →
System locks tokens →
Governance tier activated →
Voting rights applied →
Rewards accumulate (optional)
```

### 6.2 Staking Requirements

- Minimum amount
- Lock-in period (example: 30 days)
- Early unstake penalty (optional)

### 6.3 Unstaking Flow

```
User requests unstake →
Lock period check →
If eligible → tokens returned →
Governance rights removed
```

## 7. Governance Rewards

Rewards may include:

- Contribution points
- Wallet token rewards
- Governance badges
- Priority access
- Reputation scores

Reward logic:

```
Participation → Reward event → Wallet + Contribution update
```

## 8. Governance UI Structure

**Path:**

`/governance`

**Pages:**

### 8.1 Governance Overview

Shows:

- Staking status
- Active proposals
- Voting progress
- Rewards earned

### 8.2 Proposal List

List of all active + past proposals.

### 8.3 Proposal Details

Shows:

- Full content
- Vote options
- Vote weight
- Stake status

### 8.4 Create Proposal

For qualified users.

### 8.5 Governance Rewards Page

Shows participation rewards and history.

## 9. Admin Governance Tools

Admins can:

- Validate proposals
- Flag inappropriate proposals
- Manage proposal categories
- View voting logs (not vote content)
- Publish governance updates

Admins cannot:

- Change votes
- Manipulate results

## 10. Database Structure (Phase 3)

### 10.1 GOVERNANCE_STAKE

- `id`
- `user_id`
- `amount`
- `multiplier`
- `created_at`

### 10.2 PROPOSALS

- `id`
- `title`
- `description`
- `category`
- `created_by`
- `stake_required`
- `status`
- `start_at`
- `end_at`
- `created_at`
- `updated_at`

### 10.3 VOTES

- `id`
- `user_id`
- `proposal_id`
- `weight`
- `choice`
- `created_at`

### 10.4 GOVERNANCE_REWARDS

- `id`
- `user_id`
- `proposal_id`
- `reward_type`
- `amount`
- `created_at`

## 11. API Overview (High-Level)

- `GET /governance/proposals`
- `GET /governance/proposals/:id`
- `POST /governance/proposals/create`
- `POST /governance/vote`
- `POST /governance/stake`
- `POST /governance/unstake`

**Admin:**

- `POST /admin/governance/validate`
- `POST /admin/governance/flag`

## 12. Notifications Integration

Triggered for:

- New proposals
- Voting reminders
- Staking updates
- Governance rewards

## 13. Versioning & Maintenance

Update this document when:

- Staking rules change
- Governance weights evolve
- Proposal structure changes
- Voting engine expands

Record changes in `/docs/changelog.md`.

## 14. Linked Documents

- `/docs/specs/subscription-system-spec.md`
- `/docs/database/schema-overview.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/admin/admin-tools-overview.md`


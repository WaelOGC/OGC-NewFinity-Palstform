# OGC NewFinity Platform — Contribution System Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

The Contribution System is a core mechanism of the OGC NewFinity Platform used to measure user participation, engagement, creativity, productivity, and platform activity.

Contribution directly influences:

- Reward earnings
- Badge achievements
- Wallet growth
- Leaderboards (future)
- User progression

This document defines the complete system that powers Contribution-Based Mining.

## 2. Contribution Overview

Contribution is represented as a numeric score that increases when users perform platform-approved actions.

Contribution is used to:

- Measure user engagement
- Determine daily/weekly reward payouts
- Unlock badges
- Boost reputation
- Encourage healthy platform use

Contribution does not decrease; it only grows.

## 3. Contribution Actions (Scoring Events)

The contribution system records and scores events from multiple parts of the platform.

Below are the core scoring categories:

### 3.1 Amy AI Agent Usage

Each time a user performs an AI action:

- • Text generation  
- • Code assistance  
- • Design assistance  
- • Business analysis  
- • Creative tools

**Contribution Score:** +2 to +10 points depending on complexity.

### 3.2 Challenge Participation

Contribution for:

- • Submitting to a challenge  
- • Voting (future)  
- • Sharing results  
- • Completing challenge tasks  

**Contribution Score:** +10 to +25 points.

### 3.3 Platform Engagement

Daily actions:

- • Logging in  
- • Completing profile  
- • Community support  
- • Interacting with admin posts  

**Contribution Score:** +1 to +5 per action.

### 3.4 Content Creation

Actions:

- • Publishing content (future)  
- • Sharing gallery assets (future)  

**Contribution Score:** +5 to +15.

### 3.5 Admin Awarded Contribution

Admins may manually add contribution for:

- Exceptional help
- Testing support
- Event participation

**Contribution Score:** +1 to +100.

## 4. Contribution Formula

The formula processes contribution events and stores them as contribution score.

### 4.1 Base Formula

```
Contribution Score = Sum of all contribution events
```

### 4.2 Weighted Formula (Phase 2)

When multipliers launch:

```
DailyContribution = BaseScore × (1 + BadgeMultiplier)
```

### 4.3 Badge Multiplier (Phase 2+)

Badges will have a contribution multiplier:

- Bronze Badge  → +1%
- Silver Badge  → +2%
- Gold Badge    → +5%
- Diamond       → +10%

## 5. Data Flow & System Architecture

Contribution flow:

```
User performs action → 
Action produces contribution event → 
Event is logged → 
Contribution score increases → 
Wallet reflects earnings (Phase 2) →
Badges update based on contribution milestones
```

**Storage:**

- Phase 1: MySQL (off-chain)
- Phase 2+: MySQL + reward engine
- Phase 3+: On-chain sync when governance launches

## 6. Contribution UI Overview

**UI Route:**

`/wallet/contribution`

**UI Sections:**

**A. Contribution Score Card**

- Big number
- "Next level" progress bar

**B. Contribution Breakdown**

List or grid showing:

- Amy usage
- Challenge participation
- Daily login
- Content creation
- Admin-awarded points

**C. Leaderboard (Future)**

- Top users
- Weekly / monthly ranking

## 7. Admin Tools Integration

Contribution must integrate with Admin Tools:

**Admin capabilities:**

- Add contribution
- Adjust contribution
- View contribution logs
- Filter by user/date/action
- Export contribution events

Contribution logs are stored in:

- `activity_log`

## 8. API Integration

**GET /contribution/score**

Returns:

- `score`
- `breakdown`
- `nextLevelProgress`

**GET /contribution/events**

Returns paginated contribution events.

**POST /admin/contribution/add**

Admin-only.

## 9. Component Structure for Implementation

Recommended file structure:

```
src/pages/wallet/contribution.jsx

src/components/wallet/
    ContributionCard.jsx
    ContributionBreakdown.jsx
```

## 10. Versioning & Maintenance

Update this document when:

- New contribution sources are added
- Badges introduce new multipliers
- Challenge system expands
- Admin tools evolve

Log changes in `/docs/changelog.md`.

## 11. Linked Documents

- `/docs/wallet/wallet-product-spec.md`
- `/docs/wallet/wallet-ui-wireframes.md`
- `/docs/badges/badges-and-levels-spec.md` (next mission)
- `/docs/api/contribution-api-blueprint.md` (future)


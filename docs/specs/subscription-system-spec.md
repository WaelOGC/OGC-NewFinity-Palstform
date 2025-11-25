# OGC NewFinity Platform — Subscription System Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)**

## 1. Purpose

The Subscription System controls user access to premium features across the OGC NewFinity Platform.

It determines:

- Tool access (Amy Agent)
- Usage limits
- Priority processing
- Challenge privileges
- Future automation features
- Wallet/Staking bonuses (Phase 3)

This document defines the full subscription architecture for Phase 2 and Phase 3.

## 2. Subscription Tiers (Phase 2)

OGC NewFinity supports the following tiers:

### 2.1 Free Tier

- Basic Amy tools
- Limited daily usage
- Standard challenge participation
- No premium workflows
- No history saving
- No advanced analytics

### 2.2 Standard Tier

- All Free Tier tools
- Increased daily usage
- Access to selected premium tools
- Amy History (Phase 2)
- Priority processing
- Challenge bonus participation

### 2.3 Premium Tier

- Unlimited usage
- Access to all tools
- Full history
- Project folders
- Multi-modal tools
- Early access to Automation (Phase 3)
- Premium challenge access
- Personalized insights

### 2.4 Governance Tier (Phase 3)

- Requires staking
- Includes everything in Premium
- Voting rights
- Proposal creation
- Governance rewards
- Governance dashboard

## 3. Subscription Benefits Matrix

| Feature | Free | Standard | Premium | Governance |
|---------|------|----------|---------|------------|
| Writing Tools | ✔ | ✔ | ✔ | ✔ |
| Code Tools | ✔ | ✔ | ✔ | ✔ |
| Business Tools | Limited | ✔ | ✔ | ✔ |
| Design/Creative Tools | ✔ | ✔ | ✔ | ✔ |
| Tool Daily Limit | Low | Medium | Unlimited | Unlimited |
| Priority Processing | ✖ | ✔ | ✔ | ✔ |
| Amy History | ✖ | ✔ | ✔ | ✔ |
| Project Folders | ✖ | ✖ | ✔ | ✔ |
| Multi-Modal Inputs | ✖ | ✖ | ✔ | ✔ |
| Automation Workflows | ✖ | ✖ | ✖ | ✔ |
| Challenge Participation | Standard | Bonus | Premium | Exclusive |
| Contribution Bonuses | ✖ | +5% | +10% | +15% |
| Governance | ✖ | ✖ | ✖ | ✔ |

## 4. Subscription Access Rules

### 4.1 Amy Tools

Each tool includes:

- `subscription`: free / standard / premium / governance

Tools may be:

- Fully restricted
- Partially restricted
- Usage-limited
- Unlocked for all tiers

### 4.2 Challenge Program

Tiers modify:

- Participation bonuses
- Priority access to special challenge events
- Multi-submission entry (Premium)

### 4.3 Contribution System

Higher tiers receive multipliers (Phase 2+):

| Tier | Contribution Bonus |
|------|-------------------|
| Free | 0% |
| Standard | +5% |
| Premium | +10% |
| Governance | +15% |

### 4.4 Reward Engine (Phase 2+)

Premium users receive increased reward events.

## 5. Billing & Lifecycle (Phase 2)

### 5.1 Billing Providers (Phase 2)

- Stripe
- PayPal (optional)
- Regional methods (future)

### 5.2 Subscription States

| State | Meaning |
|-------|---------|
| active | Paid and current |
| trial | Temporary free trial |
| grace | Payment failed but still active |
| expired | Benefits removed |
| canceled | User canceled plan |

### 5.3 Renewal Flow

```
Payment processed →
Subscription renewed →
Tier updated →
Benefits recalculated →
Confirmation sent
```

### 5.4 Grace Period Flow

```
Payment failed →
Grace countdown →
User notified →
Retry attempts →
If failed → subscription expires
```

### 5.5 Cancelation Flow

```
User → Cancel →
System marks pending-cancel →
Plan remains active until billing cycle ends →
At end → downgrade to Free Tier
```

## 6. Subscription UI Structure

### 6.1 Subscription Dashboard

`/subscription`

Contains:

- Current plan
- Renewal date
- Benefits list
- Upgrade button
- Usage statistics
- Billing history (Phase 2)

### 6.2 Plan Comparison Page

`/subscription/compare`

### 6.3 Upgrade Flow

- Select tier
- Payment
- Confirmation

### 6.4 Admin Subscription Panel

`/admin/subscriptions`

Admins can:

- Modify plans
- View billing logs
- Grant free months
- Force downgrade
- View payment status

## 7. Backend Architecture

### 7.1 Subscription Service

Handles:

- Activation
- Renewal
- Cancelation
- Grace period
- Tier logic
- API integration

### 7.2 Billing Webhooks (Phase 2)

Stripe → `subscription.created`

- `subscription.updated`
- `subscription.canceled`
- `payment_failed`

### 7.3 Database

**Tables:**

**SUBSCRIPTIONS**

- `id`
- `user_id`
- `tier`
- `status`
- `renewal_date`
- `created_at`
- `updated_at`

**BILLING_LOG**

- `id`
- `event_type`
- `user_id`
- `metadata`
- `timestamp`

## 8. Notifications Integration

Triggered for:

- Renewal reminders
- Failed payments
- Trial expiring
- Subscription upgraded
- Subscription downgraded

## 9. Phase 3 Additions

- Governance tier
- Staking required for governance
- Voting dashboard
- Staking dashboard
- Governance proposals
- Rewards for participation

## 10. Versioning & Maintenance

Update this document when:

- Subscription tiers change
- Billing logic evolves
- New features are added
- Governance tier is activated

Ryan to record updates in `/docs/changelog.md`

## 11. Linked Documents

- `/docs/amy/amy-system-spec.md`
- `/docs/amy/amy-feature-matrix.md`
- `/docs/admin/admin-tools-overview.md`
- `/docs/database/schema-overview.md`
- `/docs/specs/governance-system-spec.md` (future)


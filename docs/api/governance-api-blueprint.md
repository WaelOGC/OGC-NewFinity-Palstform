# OGC NewFinity Platform — Governance API Blueprint

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal; Phase 3 API Contract)**

## 1. Purpose

This document defines the API contract for the Governance System, introduced in Phase 3 of the OGC NewFinity Platform.

It covers:

- Staking
- Governance tier activation
- Proposal creation
- Proposal validation
- Voting
- Vote weight logic
- Governance rewards
- Admin governance controls
- Public proposal browsing

All endpoints follow the platform-wide authentication, permissions, and audit rules.

## 2. Base URLs

- `/api/governance`
- `/api/admin/governance`

## 3. Endpoints — STAKING

### 3.1 POST /api/governance/stake

User stakes tokens to activate governance eligibility.

**Auth**

- Required
- User must have enough wallet balance
- User must not be suspended

**Payload**

```json
{
  "amount": 250
}
```

**Response (201)**

```json
{
  "status": "success",
  "message": "Staked successfully.",
  "stake": {
    "amount": 250,
    "multiplier": 1.1
  }
}
```

### 3.2 POST /api/governance/unstake

User requests to unstake.

**Response (200)**

```json
{
  "status": "success",
  "message": "Unstake request submitted."
}
```

**Rules:**

- Unstake only allowed after lock period
- Governance permissions removed when unstaked

### 3.3 GET /api/governance/stake

Returns user's staking details.

**Response (200)**

```json
{
  "status": "success",
  "stake": {
    "amount": 250,
    "multiplier": 1.1,
    "created_at": "2025-01-01"
  }
}
```

## 4. Endpoints — PROPOSALS

### 4.1 GET /api/governance/proposals

List all active & closed proposals.

**Response (200)**

```json
{
  "status": "success",
  "proposals": [
    {
      "id": "101",
      "title": "Update Challenge Rewards",
      "category": "rewards",
      "status": "active",
      "start_at": "...",
      "end_at": "..."
    }
  ]
}
```

### 4.2 GET /api/governance/proposals/:id

Returns full proposal details.

**Response (200)**

```json
{
  "status": "success",
  "proposal": {
    "id": "101",
    "title": "Update Challenge Rewards",
    "description": "Full proposal details...",
    "category": "rewards",
    "stake_required": 250,
    "status": "active",
    "start_at": "...",
    "end_at": "..."
  }
}
```

### 4.3 POST /api/governance/proposals/create

Creates a new proposal (eligible users only).

**Auth**

- User must be in "governance" tier
- User must meet stake threshold

**Payload**

```json
{
  "title": "Increase Contribution Rewards",
  "description": "Proposal details...",
  "category": "rewards"
}
```

**Response (201)**

```json
{
  "status": "success",
  "proposal_id": "101"
}
```

## 5. Endpoints — VOTING

### 5.1 POST /api/governance/vote

User casts a vote.

**Payload**

```json
{
  "proposal_id": "101",
  "choice": "yes"
}
```

**Response (201)**

```json
{
  "status": "success",
  "message": "Vote submitted.",
  "weight": 275
}
```

**Vote Weight Formula**

```
vote_weight = stake_amount × multiplier
```

### 5.2 GET /api/governance/vote/:proposal_id

Returns vote status for the authenticated user.

**Response (200)**

```json
{
  "status": "success",
  "vote": {
    "choice": "yes",
    "weight": 275
  }
}
```

## 6. Endpoints — REWARDS (Phase 3)

### 6.1 GET /api/governance/rewards

Shows rewards user earned from governance participation.

**Response**

```json
{
  "status": "success",
  "rewards": [
    {
      "proposal_id": "101",
      "reward_type": "contribution",
      "amount": 25
    }
  ]
}
```

## 7. Endpoints — ADMIN (Governance Moderation)

### 7.1 POST /api/admin/governance/validate

Validates a proposal before publishing.

**Payload**

```json
{
  "proposal_id": "101"
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Proposal validated."
}
```

### 7.2 POST /api/admin/governance/flag

Flags proposal for violations.

**Payload**

```json
{
  "proposal_id": "101",
  "reason": "Duplicated or harmful content."
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Proposal flagged."
}
```

## 8. Error Responses (Unified)

**400 Invalid**

```json
{ "status": "error", "message": "Invalid payload." }
```

**401 Unauthorized**

```json
{ "status": "error", "message": "Authentication required." }
```

**403 Forbidden**

```json
{ "status": "error", "message": "Insufficient governance rights." }
```

**404 Not Found**

```json
{ "status": "error", "message": "Proposal not found." }
```

**409 Conflict**

```json
{ "status": "error", "message": "User has already voted." }
```

**500 Server Error**

```json
{ "status": "error", "message": "Unexpected server error." }
```

## 9. Linked Documents

- `/docs/specs/governance-system-spec.md`
- `/docs/database/schema-overview.md`
- `/docs/admin/admin-tools-overview.md`
- `/docs/specs/subscription-system-spec.md`


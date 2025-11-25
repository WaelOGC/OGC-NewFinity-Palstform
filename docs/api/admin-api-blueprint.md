# OGC NewFinity Platform — Admin API Blueprint

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal; API Contract)**

## 1. Purpose

This API blueprint defines all administrator-only endpoints in the OGC NewFinity Platform.

Admin APIs allow management of:

- Users
- Roles
- Account status
- Contribution adjustments
- Badge awarding
- Challenge moderation
- Notification publishing
- Subscription overrides
- Governance proposal validation
- System logs
- Platform-wide insights

Admin endpoints are extremely sensitive and enforce strict authentication and auditing.

## 2. Base URL

`/api/admin`

All endpoints require:

- JWT authentication
- `role === "admin"` permission
- Mandatory logging in `activity_log`

## 3. Endpoints — USER MANAGEMENT

### 3.1 GET /api/admin/users

Returns list of all users.

**Response (200)**

```json
{
  "status": "success",
  "users": [
    {
      "id": "123",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "created_at": "..."
    }
  ]
}
```

### 3.2 GET /api/admin/users/:id

Returns a detailed view of a specific user.

**Response (200)**

```json
{
  "status": "success",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "user",
    "status": "active",
    "wallet": {
      "balance": 50.25
    },
    "contribution": 1250,
    "badges": [ ... ],
    "created_at": "..."
  }
}
```

### 3.3 POST /api/admin/users/role

Updates a user's role.

**Payload**

```json
{
  "user_id": "123",
  "new_role": "admin"
}
```

**Response**

```json
{
  "status": "success",
  "message": "User role updated."
}
```

### 3.4 POST /api/admin/users/status

Updates account status (active/suspended).

**Payload**

```json
{
  "user_id": "123",
  "status": "suspended"
}
```

**Response**

```json
{
  "status": "success",
  "message": "User status updated."
}
```

## 4. Endpoints — CONTRIBUTION MANAGEMENT

### 4.1 POST /api/admin/contribution/add

Adds contribution to a user.

**Payload**

```json
{
  "user_id": "123",
  "points": 50,
  "reason": "Special challenge reward"
}
```

**Response**

```json
{
  "status": "success",
  "message": "Contribution added."
}
```

### 4.2 POST /api/admin/contribution/remove

Removes contribution from a user.

**Payload**

```json
{
  "user_id": "123",
  "points": 20,
  "reason": "Correction of error"
}
```

### 4.3 GET /api/admin/contribution/logs

View contribution logs for users.

## 5. Endpoints — BADGE MANAGEMENT

### 5.1 POST /api/admin/badges/award

Awards a badge to a user.

**Payload**

```json
{
  "user_id": "123",
  "badge_id": "badge_01"
}
```

### 5.2 POST /api/admin/badges/remove

Removes a badge from a user.

**Payload**

```json
{
  "user_id": "123",
  "badge_id": "badge_01"
}
```

### 5.3 GET /api/admin/badges/logs

Returns badge change logs.

## 6. Endpoints — CHALLENGE MODERATION

### 6.1 POST /api/admin/challenges/create

Creates a new challenge.

### 6.2 POST /api/admin/challenges/update/:id

Updates challenge data.

### 6.3 POST /api/admin/challenges/close/:id

Closes a challenge.

### 6.4 GET /api/admin/challenges/:id/submissions

View all submissions for moderation.

### 6.5 POST /api/admin/challenges/submission/approve

Approve a user submission.

### 6.6 POST /api/admin/challenges/submission/reject

Reject a submission.

### 6.7 POST /api/admin/challenges/submission/flag

Flag a submission for violations.

(All payloads follow the Challenge API blueprint.)

## 7. Endpoints — SUBSCRIPTION MANAGEMENT

### 7.1 POST /api/admin/subscription/modify

Admin manually changes a user's subscription tier.

### 7.2 POST /api/admin/subscription/credit

Admin grants free subscription days or credits.

### 7.3 GET /api/admin/subscription/users

Returns subscription list + status.

(Refer to Subscription API Blueprint.)

## 8. Endpoints — GOVERNANCE MODERATION (Phase 3)

### 8.1 POST /api/admin/governance/validate

Validate proposals before activation.

### 8.2 POST /api/admin/governance/flag

Flag inappropriate proposals.

### 8.3 GET /api/admin/governance/logs

View governance moderation logs.

(Refer to Governance API Blueprint.)

## 9. Endpoints — NOTIFICATION SENDING

### 9.1 POST /api/admin/notifications/send

Send broadcast notifications to all or filtered users.

### 9.2 POST /api/admin/notifications/user

Send notification to a specific user.

### 9.3 GET /api/admin/notifications/logs

Admins view notification history.

(Refer to Notification API Blueprint.)

## 10. Endpoints — LOGS & ANALYTICS

### 10.1 GET /api/admin/logs/activity

Returns system-wide activity logs.

### 10.2 GET /api/admin/logs/roles

Returns all role change logs.

### 10.3 GET /api/admin/logs/status

Returns account status logs.

### 10.4 GET /api/admin/logs/errors

(Phase 2) Backend error logs for debugging.

## 11. Security & Audit Rules

All admin actions must be logged in `activity_log`

Sensitive actions (roles, status, rewards) must write:

- `admin_id`
- `user_id`
- `event_type`
- `metadata`
- `timestamp`

Admin endpoints must:

- Reject non-admin roles
- Reject expired tokens
- Enforce validation schemas
- Prevent mass actions without filters (safety rule)

## 12. Error Responses (Unified)

**400 Bad Request**

```json
{ "status": "error", "message": "Invalid admin action." }
```

**401 Unauthorized**

```json
{ "status": "error", "message": "Authentication required." }
```

**403 Forbidden**

```json
{ "status": "error", "message": "Admin permission required." }
```

**404 User/Resource Not Found**

```json
{ "status": "error", "message": "Resource not found." }
```

**409 Conflict**

```json
{ "status": "error", "message": "Action already performed." }
```

**500 Server Error**

```json
{ "status": "error", "message": "Unexpected server error." }
```

## 13. Linked Documents

- `/docs/admin/admin-tools-overview.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/specs/challenge-program-spec.md`
- `/docs/specs/subscription-system-spec.md`
- `/docs/specs/governance-system-spec.md`
- `/docs/database/schema-overview.md`


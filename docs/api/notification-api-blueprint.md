# OGC NewFinity Platform — Notification System API Blueprint

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal; API Contract)**

## 1. Purpose

The Notification System handles all user-facing alerts across the OGC NewFinity Platform, including:

- System updates
- Challenge alerts
- Amy Agent updates
- Subscription events
- Governance events
- Admin announcements
- Reward notifications
- Engagement nudges

This API blueprint defines the notification endpoints, payloads, rules, and behaviors.

## 2. Base URLs

- `/api/notifications`
- `/api/admin/notifications`

## 3. Notification Types

### 3.1 System Notifications

- Platform updates
- Scheduled maintenance
- Feature releases

### 3.2 Challenge Notifications

- New challenges
- Submission approval
- Submission rejection
- Challenge closing
- Voting events (Phase 2)

### 3.3 Amy Agent Notifications

- Tool usage summaries (Phase 2)
- Skill unlocks (future)

### 3.4 Subscription Notifications

- Successful payment
- Payment failed
- Trial ending
- Renewal reminders
- Downgrade / upgrade confirmation

### 3.5 Governance Notifications

- New proposals
- Voting reminders
- Staking updates
- Results posted

### 3.6 Reward Notifications

- Contribution rewards
- Badge earned
- Challenge rewards

## 4. Endpoints — USER

### 4.1 GET /api/notifications

Returns the authenticated user's notifications.

**Response (200)**

```json
{
  "status": "success",
  "notifications": [
    {
      "id": "901",
      "type": "challenge",
      "title": "Your submission was approved!",
      "message": "You earned +10 contribution.",
      "is_read": false,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### 4.2 GET /api/notifications/unread

Returns a list of unread notifications.

**Response (200)**

```json
{
  "status": "success",
  "count": 2,
  "notifications": [ ... ]
}
```

### 4.3 POST /api/notifications/read

Marks one notification as read.

**Payload**

```json
{
  "id": "901"
}
```

**Response**

```json
{
  "status": "success",
  "message": "Notification marked as read."
}
```

### 4.4 POST /api/notifications/read-all

Marks all notifications as read.

**Response**

```json
{
  "status": "success",
  "message": "All notifications marked as read."
}
```

## 5. Endpoints — ADMIN

### 5.1 POST /api/admin/notifications/send

Admin sends a notification to:

- a single user
- a user group
- all users
- specific tier (standard/premium/governance)

**Payload**

```json
{
  "target": "all",
  "type": "system",
  "title": "New Feature Released",
  "message": "Amy History is now available for Standard and Premium users."
}
```

**Response (201)**

```json
{
  "status": "success",
  "message": "Notification sent."
}
```

### 5.2 POST /api/admin/notifications/user

Sends notification to a specific user.

**Payload**

```json
{
  "user_id": "123",
  "title": "Subscription Updated",
  "message": "Your plan has been upgraded to Premium."
}
```

### 5.3 GET /api/admin/notifications/logs

View all notifications sent by admin.

**Response**

```json
{
  "status": "success",
  "logs": [
    {
      "id": "111",
      "target": "all",
      "title": "System Maintenance",
      "created_at": "2025-01-01"
    }
  ]
}
```

## 6. Notification Delivery Behavior

### 6.1 Storage

Notifications stored in:

**NOTIFICATIONS table**

| Field | Description |
|-------|-------------|
| id | primary key |
| user_id | FK → USERS |
| type | system / challenge / subscription / governance / reward |
| title | notification title |
| message | body text |
| is_read | boolean |
| created_at | timestamp |

### 6.2 Delivery Logic

**Flow:**

```
Trigger event →
Notification created →
Stored in NOTIFICATIONS →
Unread count updated →
Client polls or receives push (Phase 3)
```

Push notifications added in Phase 3.

## 7. Notification Rules

- Notifications must be short and clear
- Sensitive events require admin permission
- Users can toggle categories (Phase 2+)
- System notifications cannot be disabled
- No notification spam (rate-limited)

## 8. Error Responses (Unified)

**400 Bad Request**

```json
{ "status": "error", "message": "Invalid notification payload." }
```

**401 Unauthorized**

```json
{ "status": "error", "message": "Authentication required." }
```

**403 Forbidden**

```json
{ "status": "error", "message": "Admin permission required." }
```

**404 Notification Not Found**

```json
{ "status": "error", "message": "Notification not found." }
```

**500 Server Error**

```json
{ "status": "error", "message": "Unexpected server error." }
```

## 9. Linked Documents

- `/docs/specs/subscription-system-spec.md`
- `/docs/specs/challenge-program-spec.md`
- `/docs/specs/governance-system-spec.md`
- `/docs/database/schema-overview.md`
- `/docs/admin/admin-tools-overview.md`


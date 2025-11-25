# OGC NewFinity Platform — Challenge API Blueprint

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal; API Contract)**

## 1. Purpose

This API blueprint defines all endpoints for the Challenge System, covering:

- Public challenge browsing
- Challenge details
- Submissions
- Admin challenge management
- Admin submission moderation
- Approval, rejection, flagging
- Voting and ranking (Phase 2)
- Reward issuance

All endpoints must follow a unified contract and respect platform-wide security rules.

## 2. Base URL

- `/api/challenges`
- `/api/admin/challenges`

All endpoints require JWT authentication unless marked as public.

## 3. Endpoints — PUBLIC (User)

### 3.1 GET /api/challenges

Returns a list of active challenges.

**Response (200)**

```json
{
  "status": "success",
  "challenges": [
    {
      "id": "123",
      "title": "Weekly Creative Challenge",
      "category": "creative",
      "description": "Create a unique design...",
      "status": "active",
      "start_at": "2025-01-01",
      "end_at": "2025-01-07"
    }
  ]
}
```

### 3.2 GET /api/challenges/:id

Returns full challenge details.

**Response (200)**

```json
{
  "status": "success",
  "challenge": {
    "id": "123",
    "title": "Design Challenge",
    "category": "creative",
    "description": "Full challenge details...",
    "start_at": "2025-01-01",
    "end_at": "2025-01-07",
    "reward_points": 15,
    "badge_awarded": null
  }
}
```

### 3.3 POST /api/challenges/:id/submit

User submits to a challenge.

**Auth**

- Required
- User must be active
- User must not be suspended

**Payload**

```json
{
  "content_url": "https://cdn.example.com/submission.png",
  "notes": "My design"
}
```

**Response (201)**

```json
{
  "status": "success",
  "submission_id": "456",
  "message": "Submission received and pending review."
}
```

## 4. Endpoints — USER (View Personal Submissions)

### 4.1 GET /api/challenges/:id/submissions/me

Returns the authenticated user's submissions.

**Response (200)**

```json
{
  "status": "success",
  "submissions": [
    {
      "id": "456",
      "status": "pending",
      "content_url": "...",
      "notes": "...",
      "created_at": "..."
    }
  ]
}
```

## 5. Endpoints — ADMIN (Challenge Management)

### 5.1 POST /api/admin/challenges/create

Creates a new challenge.

**Payload**

```json
{
  "title": "AI Art Challenge",
  "category": "creative",
  "description": "Detailed instructions...",
  "start_at": "...",
  "end_at": "...",
  "reward_points": 20,
  "badge_awarded": "badge_id"
}
```

**Response (201)**

```json
{
  "status": "success",
  "challenge_id": "789"
}
```

### 5.2 POST /api/admin/challenges/update/:id

Updates an existing challenge.

**Payload**

(Only fields to update)

```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Challenge updated."
}
```

### 5.3 POST /api/admin/challenges/close/:id

Marks a challenge as closed.

**Response (200)**

```json
{
  "status": "success",
  "message": "Challenge closed."
}
```

## 6. Endpoints — ADMIN (Submission Moderation)

### 6.1 GET /api/admin/challenges/:id/submissions

Lists submissions for a challenge.

**Response (200)**

```json
{
  "status": "success",
  "submissions": [
    {
      "id": "456",
      "user_id": "111",
      "content_url": "...",
      "notes": "...",
      "status": "pending",
      "created_at": "..."
    }
  ]
}
```

### 6.2 POST /api/admin/challenges/submission/approve

Approves a submission.

**Payload**

```json
{
  "submission_id": "456"
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Submission approved.",
  "reward_points": 10
}
```

### 6.3 POST /api/admin/challenges/submission/reject

Rejects a submission.

**Payload**

```json
{
  "submission_id": "456",
  "reason": "Inappropriate content"
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Submission rejected."
}
```

### 6.4 POST /api/admin/challenges/submission/flag

Flags content for review.

**Payload**

```json
{
  "submission_id": "456",
  "reason": "Possible violation"
}
```

## 7. Phase 2 — Voting System (Future)

### 7.1 POST /api/challenges/:id/vote

**Payload:**

```json
{
  "choice": "option_a"
}
```

### 7.2 GET /api/challenges/:id/ranking

Returns sorted ranking data.

## 8. Error Responses (Unified)

**400 Bad Request**

```json
{ "status": "error", "message": "Invalid data." }
```

**401 Unauthorized**

```json
{ "status": "error", "message": "Authentication required." }
```

**403 Forbidden**

```json
{ "status": "error", "message": "You do not have permission." }
```

**404 Not Found**

```json
{ "status": "error", "message": "Resource not found." }
```

**500 Server Error**

```json
{ "status": "error", "message": "Something went wrong." }
```

## 9. Linked Documents

- `/docs/specs/challenge-program-spec.md`
- `/docs/database/schema-overview.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/admin/admin-tools-overview.md`
- `/docs/specs/governance-system-spec.md`


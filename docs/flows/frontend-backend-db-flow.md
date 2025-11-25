# OGC NewFinity Platform — Frontend → Backend → Database Connection Flow

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal, Technical)**

## 1. Purpose

This document explains how the OGC NewFinity Platform performs end-to-end communication between:

- Frontend (React + Vite)
- Backend (Node.js + Express + Prisma)
- Database (MySQL)

It provides a technical view of:

- Request lifecycle
- Auth token flow
- Data processing
- Validation rules
- Logging
- Error handling
- Integration with Wallet, Contribution, Badges, Amy, and Admin modules

## 2. High-Level Request Lifecycle

```
Frontend →
API Client →
Backend Controller →
Service Layer →
Prisma Repository →
Database →
Back to Service →
Back to Controller →
Normalized API Response →
Frontend UI  
```

## 3. Frontend Layer (React, Vite)

### 3.1 API Client (src/api/client.js)

Responsible for:

- Attaching access tokens
- Handling refresh token logic
- Centralizing GET/POST/PATCH/DELETE
- Logging client errors
- Normalizing responses
- Returning standardized objects

### 3.2 API Modules

- `src/api/auth.js`
- `src/api/wallet.js`
- `src/api/contribution.js`
- `src/api/badges.js`
- `src/api/amy.js`
- `src/api/admin.js`

**Rules:**

- Each module contains only functions for its domain
- No UI logic
- All requests must go through client.js

## 4. Authentication (Token Lifecycle)

### 4.1 Access Token (JWT)

- Short-lived
- Sent in `Authorization: Bearer <token>`
- Used for all protected routes

### 4.2 Refresh Token (HTTP-only Cookie)

- Long-lived
- Auto-renews access token

**Process:**

```
Access token expired →
Frontend detects 401 →
client.js triggers /auth/refresh →
Backend issues new access token →
Retry original request
```

### 4.3 Sign-Out Flow

- Remove access token
- Invalidate refresh token cookie
- Redirect to `/login`

## 5. Backend Layer (Node.js, Express)

Backend structure:

- `controllers/`
- `services/`
- `repositories/`
- `middleware/`
- `validators/`
- `utils/`

### 5.1 Controller Layer

Handles:

- Request → response
- Basic parameter extraction
- HTTP status codes
- Calling service methods

### 5.2 Service Layer

Contains business logic:

- Wallet reward calculations
- Badge progression
- Contribution scoring
- Amy interaction logging
- Admin moderation rules

### 5.3 Repository Layer (Prisma)

Handles:

- Database queries
- CRUD operations
- Complex joins
- Query optimization

### 5.4 Middleware

- Auth middleware
- Role checks
- Rate limiting (future)
- Input sanitization

### 5.5 Validators

Uses e.g., Zod or Joi:

- Validate input
- Prevent malicious payloads
- Enforce schema contracts

## 6. Database Layer (MySQL + Prisma ORM)

### 6.1 Prisma Responsibilities

- Map schemas → SQL tables
- Generate types for TypeScript/JS
- Handle relationships
- Handle migrations
- Ensure data integrity

### 6.2 Query Flow

```
Service → Repository → Prisma → Database
Database → Prisma → Repository → Service
```

### 6.3 Transaction Rules

Used for:

- Reward payouts
- Badge awarding
- Contribution event logging
- Admin adjustments

## 7. Example Flow — Wallet Page Load

**Frontend:**

`GET /wallet/balance`

**Backend (Controller → Service → Repository):**

1. Verify JWT
2. Fetch wallet record
3. Fetch pending rewards
4. Fetch sync status
5. Normalize response

**Database:**

- Query `WALLETS`
- Query `TRANSACTIONS` (recent)

**Response:**

```json
{
  "balance": 42.50,
  "pendingRewards": 5.00,
  "lastSyncAt": "...",
  "status": "success"
}
```

**Frontend:**

- Display balance
- Display cards
- Trigger sub-requests (earnings, badges, contribution)

## 8. Example Flow — Contribution Event Logging

**Triggered by:**

- Amy usage
- Challenge submission
- Engagement
- Admin adjustments

**Flow:**

```
Frontend triggers action →
API logs event →
service calculates contribution →
repository writes CONTRIBUTION_EVENTS →
service updates contribution total →
controller responds →
UI refreshes contribution page
```

**Database writes:**

- new `CONTRIBUTION_EVENTS` row
- update total contribution in cache (future)

## 9. Example Flow — Admin Awarding a Badge

`POST /admin/badges/award`

**Backend:**

- Validate admin user
- Validate badge exists
- Insert into `USER_BADGES` table
- Write log entry into `ACTIVITY_LOG`
- Normalize response

**UI:**

- Badge grid updates
- Modal shows "Badge Awarded"

## 10. Error Handling Flow

### 10.1 Frontend

- Centralized error handler
- User-friendly messages
- Auto-retry for expired tokens
- Fallback pages

### 10.2 Backend

Errors include:

- Auth errors → 401
- Validation errors → 400
- Permission errors → 403
- Not found → 404
- Server error → 500

All errors logged in:

- `activity_log`

## 11. Logging & Audit Chain

Every sensitive action produces a log entry:

- `roles_log`
- `status_log`
- `activity_log`

**Logged fields:**

- `user_id`
- `admin_id` (if relevant)
- `event type`
- `metadata`
- `timestamp`

**Used for:**

- Admin audits
- Security checks
- Challenge moderation
- Future governance insights

## 12. Cross-System Integration

| Module | Interacts With | Purpose |
|--------|----------------|---------|
| Wallet | Contribution, Badges, Admin | Rewards, adjustments |
| Contribution | Amy, Challenges, Wallet | Scoring |
| Badges | Contribution, Admin | Progression |
| Amy | Contribution, Wallet | Reward triggers |
| Admin | All subsystems | Moderation, logs |

## 13. Versioning & Maintenance

Update this document when:

- Backend logic changes
- Database schema evolves
- API contracts change
- New modules (staking, governance) are introduced

Record changes in `/docs/changelog.md`.

## 14. Linked Documents

- `/docs/database/schema-overview.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/wallet/wallet-product-spec.md`
- `/docs/frontend/file-structure.md`
- `/docs/api/*`


# OGC NewFinity Platform — Challenge Program Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)**

## 1. Purpose

The Challenge Program is an engagement system that encourages creativity, learning, productivity, and community participation across the OGC NewFinity Platform.

Challenges allow users to:

- Create submissions
- Compete in themed categories
- Earn contribution points
- Earn badges
- Receive rewards (Phase 2+)
- Improve platform ranking

Admins can manage challenges, submissions, rewards, and user moderation via Admin Tools.

This document defines the complete Challenge Program, including user flow, admin flow, data structure, rules, and future scaling.

## 2. Challenge Categories

Core challenge categories include:

### 2.1 Creative Challenges

- Art
- Design
- Branding
- Visual storytelling

### 2.2 Technical Challenges

- Coding
- Logic problems
- Debugging
- App-building mini tasks

### 2.3 AI Challenges

- Amy Agent-based
- Prompt engineering
- Tool-based output
- Workflow competitions

### 2.4 Mixed Challenges

- Problem-solving
- Productivity
- Creativity + analytics

### 2.5 Platform-Specific Challenges

- Contribution races
- Engagement events
- Community competitions

## 3. Challenge Structure

A challenge contains:

| Field | Description |
|-------|-------------|
| id | Unique challenge ID |
| title | Name of the challenge |
| category | Challenge category |
| description | Extended instructions |
| status | active / closed |
| start_at | Start date |
| end_at | End date |
| reward_points | Contribution or token reward |
| badge_awarded | Badge (optional) |
| created_at | Creation time |
| updated_at | Modification time |

## 4. User Flow (End-to-End)

### 4.1 Explore → Join → Submit Flow

```
User navigates to /challenge →
User selects challenge →
User reads instructions →
User prepares submission →
User uploads submission →
System validates →
Submission saved →
Contribution points awarded →
Badge progress updated →
User views results or ranking (future)
```

### 4.2 Submission File Types

Accepted types:

- Image
- Text
- URL
- File upload
- Amy Agent generated content

(Depends on challenge category.)

## 5. Submission Rules

### 5.1 Submission Fields

| Field | Description |
|-------|-------------|
| id | Unique submission ID |
| challenge_id | FK → CHALLENGES |
| user_id | FK → USERS |
| content_url | Link to uploaded content |
| notes | Optional description |
| status | approved / pending / rejected |
| votes | (Phase 2) user votes |
| created_at | Timestamp |

### 5.2 Validation Rules

- One submission per user (default)
- File must meet category rules
- Auto-flag inappropriate content
- All submissions go into pending state for Admin review

## 6. Admin Flow

Admins perform:

### 6.1 Challenge Control

- Create new challenges
- Edit challenges
- Close or archive challenges
- Reopen challenges

### 6.2 Submission Moderation

- `submission.status = approved`  
- `submission.status = rejected`  
- `submission.status = flagged`

Admins can:

- Add notes
- Remove content
- Contact user (future)

### 6.3 Awarding Rewards

Admin can award:

- Contribution points
- Badges
- Token bonuses (Phase 2)

All admin actions are logged in:

- `activity_log`

## 7. Contribution Integration

Each approved submission awards Contribution:

**Default Scores:**

| Action | Points |
|--------|--------|
| Submit to a challenge | +15 |
| Approved submission | +10 |
| Bonus for winning | +30 (Phase 2) |

Contribution updates:

- Contribution score
- Leaderboard rank (future)

## 8. Badge Integration

Challenge-related badges include:

- Challenge Participant
- Challenge Veteran
- Challenge Winner
- Community Achievement

Badge logic:

- Based on submission count
- Based on wins (future)
- Based on participation streak

## 9. Rewards System (Phase Roadmap)

**Phase 1 (Current)**

- Contribution rewards only
- Badge progress only
- Manual admin awards

**Phase 2**

- Automated challenge rewards
- Winning bonuses
- Token rewards
- Voting-based rankings

**Phase 3**

- Challenge staking (entry staking)
- Governance involvement
- Community-funded prizes

## 10. Data Flow

**High-Level Flow:**

```
Challenge → Submission → Admin Moderation → Contribution → Rewards → Badges → History
```

**Submission Flow:**

```
User → Upload → Validate → Store → Pending → Admin Action → Finalize
```

**Reward Flow:**

```
Admin/API → Reward Calculation → Wallet → Transaction → Contribution event
```

## 11. Challenge Page Routes

**Public Pages:**

- `/challenge`
- `/challenge/:id`

**Dashboard:**

- `/dashboard/challenges` (future)

**Admin:**

- `/admin/challenges`
- `/admin/challenges/:id/submissions`

## 12. API Integration (Internal Summary)

**Endpoints:**

**Challenges**

- `GET /challenges`
- `GET /challenges/:id`
- `POST /admin/challenges/create`
- `POST /admin/challenges/update`

**Submissions**

- `POST /challenges/:id/submit`
- `GET /challenges/:id/submissions`
- `POST /admin/challenges/submission/approve`
- `POST /admin/challenges/submission/reject`

**Future:**

- `POST /challenges/:id/vote`
- `GET /challenges/:id/ranking`

## 13. Security & Permissions

**Users:**

- Must be authenticated
- Must have active status

**Admin:**

- Full control over all challenges
- Can modify any submission
- Can adjust rewards

**File Security:**

- Virus scan (future)
- Size limit rules

## 14. Versioning & Maintenance

Update this document when:

- New challenge categories are added
- Voting is implemented
- Rewards change
- Challenge flow evolves
- Admin tools expand

Log changes in `/docs/changelog.md`.

## 15. Linked Documents

- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/admin/admin-tools-overview.md`
- `/docs/database/schema-overview.md`


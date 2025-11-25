# OGC NewFinity Platform — Badges & Levels Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

The Badge System is a core progression mechanic in the OGC NewFinity Platform.

Badges reward users for:

- Contribution milestones
- Challenge participation
- Amy Agent usage
- Platform engagement
- Special events
- Admin recognition

Badges also enhance user motivation and introduce reward multipliers (Phase 2).

## 2. Badge Categories

OGC NewFinity supports multiple badge categories:

### 2.1 Contribution Badges

Awarded for hitting contribution milestones:

- 100 Contribution
- 500 Contribution
- 1,000 Contribution
- 5,000 Contribution
- 10,000 Contribution
- 25,000 Contribution

### 2.2 Amy Usage Badges

Awarded for cumulative AI interactions:

- 10 Amy tools used
- 50 Amy tools used
- 150 Amy tools used
- 500 Amy tools used

### 2.3 Challenge Badges

Awarded for participating or placing in challenges:

- 1 challenge submission
- 5 submissions
- Winner badges (future)

### 2.4 Engagement Badges

Awarded for activity streaks:

- 3 days
- 7 days
- 14 days
- 30 days

### 2.5 Admin Awarded Badges

Given manually for special contributions.

## 3. Badge Levels

Each badge category contains 4 core levels:

- **BRONZE**   → early achievements
- **SILVER**   → intermediate achievements
- **GOLD**     → advanced achievements
- **DIAMOND**  → exceptional achievements

Badges increase in difficulty and reward:

- Bronze → easiest
- Diamond → hardest

Levels may influence:

- Contribution multipliers
- Earnings boosts (Phase 2+)
- Governance rank (Phase 3)

## 4. Badge Requirements (Milestones)

**Contribution Badges Example:**

| Level | Requirement | Reward Effect (Phase 2+) |
|-------|-------------|--------------------------|
| Bronze | 100 contribution | +1% bonus |
| Silver | 1,000 contribution | +2% bonus |
| Gold | 5,000 contribution | +5% bonus |
| Diamond | 10,000 contribution | +10% bonus |

**Amy Usage Badges Example:**

| Level | Requirement |
|-------|-------------|
| Bronze | 10 uses |
| Silver | 50 uses |
| Gold | 150 uses |
| Diamond | 500 uses |

## 5. Progression Logic

Users progress through badges automatically:

```
User performs action →
Action logs milestone progress →
If milestone achieved → Award badge →
Badge displayed in Wallet →
Badge influences Contribution / Rewards (Phase 2)
```

Progress resets per badge category but not per level.

## 6. Badge UI Specification

### 6.1 Badge Grid Layout

```
[ Badge     ] [ Badge     ] [ Badge     ] [ Badge     ]
[ Badge     ] [ Badge     ] [ Badge     ] [ Badge     ]
```

**Characteristics:**

- 3–4 columns depending on screen width
- Earned badges → colored + glowing border
- Locked badges → grayscale + low opacity
- Hover/press → opens modal

### 6.2 Badge Modal (Details View)

Modal must show:

- Badge icon
- Badge name
- Badge description
- Current level (Bronze / Silver / Gold / Diamond)
- Progress bar toward next level
- Related contribution category
- Reward effect (future: multipliers)

## 7. Admin Tools Integration

Admin Tools may:

- Award a badge
- Adjust badge progress
- Remove a badge (manual moderation)
- View badge logs

Badges are logged in:

- `activity_log`

Admins may award special recognition badges.

## 8. API Integration

**GET /badges**

Returns:

- `earned badges`
- `locked badges`
- `progress`

**GET /badges/:id**

Returns badge details.

**POST /admin/badges/award**

Admin-only.

**POST /admin/badges/update-progress**

Admin-only.

## 9. Component Structure for Implementation

```
src/components/wallet/BadgeGrid.jsx
src/components/wallet/BadgeModal.jsx
src/components/wallet/BadgeCard.jsx
```

Wallet Badge page:

```
src/pages/wallet/badges.jsx
```

## 10. Versioning & Maintenance

Update this document when:

- New badge categories are added
- Badge levels change
- Multipliers go live
- Challenge Program expands
- Admin tools gain new badge actions

Record changes in `/docs/changelog.md`.

## 11. Linked Documents

- `/docs/wallet/wallet-product-spec.md`
- `/docs/wallet/wallet-ui-wireframes.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/api/badges-api-blueprint.md` (future)


# OGC NewFinity Platform — Wallet UI Wireframes

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

This document defines the UX and wireframe structure for all Wallet pages inside the OGC NewFinity Platform.

It provides consistent layout guidance for designers and developers, ensuring all wallet screens follow the same visual hierarchy, spacing rules, and component layout.

## 2. General Wallet UI Structure

Each Wallet page follows the same 3-region structure:

```
+------------------------------------------------------+
| Wallet Header (Balance + Sync Status)                |
+------------------------------------------------------+
| Wallet Summary Cards (optional per page)             |
+------------------------------------------------------+
| Main Content Area (Tables, Lists, Graphs, Badges)    |
+------------------------------------------------------+
```

### 2.1 Wallet Header (Shared Across All Wallet Pages)

Contains:

- OGC Token Balance
- Pending Rewards Indicator
- "Last Sync" timestamp
- Sync status icon (✔ synced | ● pending | ! error)
- Quick links to Contribution & Badges

### 2.2 Summary Cards (Used on Overview & Earnings)

Typically includes:

- Total Earnings
- Weekly Earnings
- Contribution Score
- Number of Badges
- Bonus multiplier (future)

### 2.3 Main Content Region

Displays the page-specific content:

- tables
- charts
- badge grids
- contribution breakdown

## 3. Wireframe – Overview Page

**Route:**

`/wallet`

**Structure:**

```
[Header: Balance + Sync Status]

[Summary Cards Row]
   - Balance Card
   - Earnings Card
   - Contribution Card
   - Badges Card

[Recent Activity Section]
   - Vertical list of recent reward events
   - "View All History" button
```

**UX Notes:**

- This is the homepage of the wallet.
- Must feel light, fast, welcoming.
- Cards must use equal heights and consistent padding.

## 4. Wireframe – Earnings & Rewards Page

**Route:**

`/wallet/earnings`

**Structure:**

```
[Header]

[Earnings Summary Cards]
   - This Week
   - This Month
   - Total Earnings

[Earnings Chart Area]
   - Line graph or bar chart

[Rewards List]
   - Individual reward items
   - Date, source, amount
   - "Load More" pagination
```

**UX Notes:**

- Chart must scale for mobile
- Rewards list uses consistent spacing between items

## 5. Wireframe – Transaction History

**Route:**

`/wallet/history`

**Structure:**

```
[Header]

[Filters Row]
   - Date Range
   - Event Type
   - Source

[Table]
   - Date
   - Type
   - Amount
   - Notes

[Pagination]
```

**UX Notes:**

- Table must allow sorting
- Types should use colored badges (Earned, Adjusted, Challenge, etc.)

## 6. Wireframe – Contribution Mining

**Route:**

`/wallet/contribution`

**Structure:**

```
[Header]

[Contribution Score Card]
   - Large contribution number
   - "Next Level" progress bar

[Actions Breakdown]
   - Text generation
   - Challenge participation
   - Daily activity
   - Amy usage
   - And more...

[Leaderboard Link] (Future)
```

**UX Notes:**

- Score card must be visually bold
- Breakdown uses horizontal cards or a vertical list

## 7. Wireframe – Badges & Achievements

**Route:**

`/wallet/badges`

**Structure:**

```
[Header]

[Badge Grid]
   - 3 or 4 columns
   - Earned badges: colored + glowing border
   - Locked badges: grayscale

[Badge Details Modal]
   - Name
   - Description
   - Requirements
   - Progress toward achievement
```

**UX Notes:**

- Grid layout must adjust responsively
- Modal must display detailed badge progress

## 8. Shared UI Rules for All Wallet Pages

### 8.1 Spacing

- Outer margin: 24px
- Card padding: 16–20px
- Section spacing: 32px

### 8.2 Typography

- Headings: semi-bold
- Body text: medium
- Numeric data: bold

### 8.3 Colors

- Token numbers use accent teal (#00FFC6)
- Warning states use sunburst yellow (#FFBC25)
- Error states use electric pink (#FF3CAC)

### 8.4 Empty States

Every page must have a proper empty-state design:

- illustration
- headline
- short message
- CTA (optional)

## 9. Component Structure for Implementation

Recommended React structure:

```
src/components/wallet/
    WalletHeader.jsx
    SummaryCards.jsx
    EarningsChart.jsx
    RewardsList.jsx
    TransactionTable.jsx
    ContributionCard.jsx
    BadgeGrid.jsx
    BadgeModal.jsx
```

## 10. Versioning & Maintenance

Update this document when:

- Wallet UI changes
- New wireframe pages are added
- Staking or governance screens appear
- Contribution or badge UI expands

Record changes in `/docs/changelog.md`.

## 11. Linked Documents

- `/docs/wallet/wallet-product-spec.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/api/wallet-api-blueprint.md`


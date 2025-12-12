# Phase W2.4 Implementation Report: Mock Staking & Rewards Layer

## Overview
This phase adds a mock staking and rewards layer to the wallet system, providing a preview-only interface for staking functionality. All data is static/deterministic and ready to be replaced by a real staking engine in future phases.

## Implementation Date
Phase W2.4

## Status
✅ Complete - Mock staking layer implemented

---

## Backend Changes

### 1. Service Layer (`backend/src/services/walletService.js`)

Added two new functions:

#### `getStakingSummaryForUser(userId)`
- **Purpose**: Returns mock staking summary for a user
- **Returns**: Static object with:
  - `stakedAmount`: 200.0 OGC
  - `claimableRewards`: 34.56 OGC
  - `lifetimeRewards`: 120.0 OGC
  - `apy`: 12.5%
  - `lockDurationDays`: 30 days
  - `lastClaimedAt`: ISO timestamp (5 days ago)
  - `nextPayoutAt`: ISO timestamp (2 days from now)

#### `previewStakingRewards(userId, { amount })`
- **Purpose**: Calculates estimated rewards for a potential stake amount
- **Formula**: Uses 12.5% APY, 30-day lock period
- **Returns**: Object with:
  - `inputAmount`: The stake amount
  - `apy`: 12.5
  - `lockDurationDays`: 30
  - `estimatedRewardForPeriod`: Calculated reward for 30 days

### 2. Controller Layer (`backend/src/controllers/wallet.controller.js`)

Added two new controller functions:

#### `getStakingSummary(req, res)`
- **Route**: `GET /api/v1/wallet/staking/summary`
- **Auth**: Required (requireAuth middleware)
- **Response**: `{ status: "OK", data: { staking: {...} } }`
- **Error Handling**: Returns 401 if unauthorized, 500 on service errors

#### `getStakingPreview(req, res)`
- **Route**: `POST /api/v1/wallet/staking/preview`
- **Auth**: Required (requireAuth middleware)
- **Body**: `{ amount: number }`
- **Response**: `{ status: "OK", data: { preview: {...} } }`
- **Error Handling**: Returns 401 if unauthorized, 500 on service errors

### 3. Routes (`backend/src/routes/wallet.routes.js`)

Added two new routes:
- `GET /api/v1/wallet/staking/summary` → `getStakingSummary`
- `POST /api/v1/wallet/staking/preview` → `getStakingPreview`

Both routes are protected with `requireAuth` middleware.

---

## Frontend Changes

### 1. API Client (`frontend/src/utils/apiClient.js`)

#### Whitelist Updates
Added to `ALLOWED_ROUTES`:
- `'GET /api/v1/wallet/staking/summary': true`
- `'POST /api/v1/wallet/staking/preview': true`

#### Helper Functions

##### `getStakingSummary()`
- Makes GET request to `/wallet/staking/summary`
- Returns `data.staking` or `null`

##### `getStakingPreview(amount)`
- Makes POST request to `/wallet/staking/preview` with `{ amount }`
- Returns `data.preview` or `null`

### 2. Wallet Page (`frontend/src/pages/dashboard/WalletPage.jsx`)

#### New State Variables
- `staking`: Staking summary data
- `stakingLoading`: Loading state for staking data
- `stakingError`: Error state for staking data
- `stakePanelOpen`: Controls preview panel visibility
- `stakeAmount`: Input value for stake amount
- `stakePreview`: Preview calculation result
- `stakePreviewLoading`: Loading state for preview
- `stakePreviewError`: Error state for preview

#### New UI Components

##### Staking Overview Card
- Displays 6 metrics in a grid:
  - Staked OGC
  - Claimable rewards
  - Lifetime rewards
  - APY
  - Lock duration
  - Next payout date
- Shows loading/error states
- Includes footnote: "Staking engine is in preview mode. Values are mock and for design/testing only."

##### Staking Preview Panel
- Opens from "Stake OGC (preview)" button in Quick Actions
- Input field for stake amount
- "Preview rewards" button triggers calculation
- Displays preview results:
  - APY
  - Lock duration
  - Estimated rewards for period
- "Close" button to dismiss panel
- Includes footnote: "Staking transactions are not live yet. This preview is for planning and UX only."

### 3. Styling (`frontend/src/pages/dashboard/dashboard-pages.css`)

Added CSS classes:
- `.wallet-staking-grid`: Grid layout for staking metrics
- `.wallet-staking-item`: Individual metric container
- `.wallet-staking-label`: Label styling
- `.wallet-staking-value`: Value styling
- `.wallet-card-footnote`: Footnote text styling
- `.wallet-stake-panel`: Preview panel container
- `.wallet-stake-description`: Description text
- `.wallet-form-label`: Form label styling
- `.wallet-input`: Input field styling
- `.wallet-stake-preview`: Preview results grid
- `.wallet-stake-actions`: Action buttons container
- `.wallet-actions-row`: Quick actions button row
- `.wallet-btn`: Base button styling
- `.wallet-btn.secondary`: Secondary button variant
- `.wallet-btn.disabled`: Disabled button state

---

## API Endpoints Summary

### GET `/api/v1/wallet/staking/summary`
**Authentication**: Required

**Response**:
```json
{
  "status": "OK",
  "data": {
    "staking": {
      "stakedAmount": 200.0,
      "claimableRewards": 34.56,
      "lifetimeRewards": 120.0,
      "apy": 12.5,
      "lockDurationDays": 30,
      "lastClaimedAt": "2024-01-15T10:00:00.000Z",
      "nextPayoutAt": "2024-01-22T10:00:00.000Z"
    }
  }
}
```

### POST `/api/v1/wallet/staking/preview`
**Authentication**: Required

**Request Body**:
```json
{
  "amount": 100
}
```

**Response**:
```json
{
  "status": "OK",
  "data": {
    "preview": {
      "inputAmount": 100,
      "apy": 12.5,
      "lockDurationDays": 30,
      "estimatedRewardForPeriod": 1.0273972602739726
    }
  }
}
```

---

## Important Notes

### Mock Data Only
⚠️ **This implementation is mock/preview only.**
- No real balance mutations
- No on-chain logic
- No database writes for staking
- Static, deterministic responses
- Ready to be replaced by real staking engine in Phase W2.5+

### No "Stake Now" Endpoint
- This phase is read-only / preview-only
- No actual staking transaction endpoint
- Preview functionality only

### Future Integration Points
When implementing real staking:
1. Replace `getStakingSummaryForUser` with database queries to staking tables
2. Replace `previewStakingRewards` with real reward engine calculations
3. Add `POST /api/v1/wallet/staking/stake` endpoint for actual staking
4. Add `POST /api/v1/wallet/staking/claim` endpoint for claiming rewards
5. Integrate with on-chain staking contracts

---

## Testing Checklist

- [x] Backend service functions return expected mock data
- [x] Controller functions handle auth and errors correctly
- [x] Routes are properly protected
- [x] Frontend API client functions work correctly
- [x] Staking overview card displays mock data
- [x] Preview panel opens and closes correctly
- [x] Preview calculation works with various amounts
- [x] Error states display properly
- [x] Loading states display properly
- [x] CSS styling matches design system

---

## Files Modified

### Backend
- `backend/src/services/walletService.js` - Added staking functions
- `backend/src/controllers/wallet.controller.js` - Added controller functions
- `backend/src/routes/wallet.routes.js` - Added routes

### Frontend
- `frontend/src/utils/apiClient.js` - Added routes and helpers
- `frontend/src/pages/dashboard/WalletPage.jsx` - Added staking UI
- `frontend/src/pages/dashboard/dashboard-pages.css` - Added styling

### Documentation
- `backend/PHASE-W2.4-IMPLEMENTATION-REPORT.md` - This file

---

## Next Steps (Phase W2.5+)

1. Design staking database schema
2. Implement real staking engine
3. Add reward calculation logic
4. Integrate with blockchain staking contracts
5. Add actual stake/unstake endpoints
6. Add claim rewards endpoint
7. Replace mock data with real database queries

# Wallet Overview API Implementation

## Overview
This document describes the Wallet Overview API endpoint implementation that provides wallet snapshot and balances data. The endpoint returns mock data that replaces hard-coded values on the `/dashboard/wallet` page, allowing the UI to display wallet information from the backend API.

## Status
Complete - Wallet Overview API and UI wiring implemented

---

## Backend Changes

### 1. Service Layer (`backend/src/services/walletService.js`)

Added new function `getWalletOverviewForUser(userId)`:
- **Purpose**: Returns mock wallet overview data including snapshot and balances
- **Phase**: W2.6 (mock implementation)
- **Future**: Phase W3+ will replace with real DB / chain data

#### Mock Data Structure
Returns an object with two main sections:

**Snapshot**:
- `ogcBalance`: Total OGC balance across wallet (1234.56)
- `usdEstimate`: Estimated USD value (1234.56, placeholder)
- `lastUpdatedAt`: ISO timestamp of last update

**Balances**:
- `main`: Main wallet balance
  - `label`: "Main Wallet (OGC)"
  - `amount`: 1000.0
  - `status`: "AVAILABLE"
- `locked`: Locked/staked balance
  - `label`: "Locked / Staked"
  - `amount`: 200.0
  - `status`: "LOCKED"
- `pendingRewards`: Pending rewards balance
  - `label`: "Pending Rewards"
  - `amount`: 34.56
  - `status`: "PENDING"

### 2. Controller Layer (`backend/src/controllers/wallet.controller.js`)

Added new controller function `getWalletOverview(req, res, next)`:
- **Route**: `GET /api/v1/wallet/overview`
- **Auth**: Required (requireAuth middleware)
- **Response**: `{ status: "OK", data: { snapshot: {...}, balances: {...} } }`
- **Error Handling**: 
  - Returns 401 if unauthorized
  - Returns 500 on service errors with error message

### 3. Routes (`backend/src/routes/wallet.routes.js`)

Added new route:
- `GET /api/v1/wallet/overview` → `getWalletOverview`
- Protected with `requireAuth` middleware (applied via `router.use(requireAuth)` at line 19)
- Comment indicates Phase W2.6 implementation

**Route Chain**:
```
GET /api/v1/wallet/overview
  ├─ /api/v1 (from index.js)
  ├─ /wallet (from routes/index.js)
  └─ /overview (from wallet.routes.js)
```

---

## Frontend Changes

### 1. API Client (`frontend/src/utils/apiClient.js`)

#### Route Whitelist
Added route to `ALLOWED_ROUTES`:
- `'GET /api/v1/wallet/overview': true` (line 107)

#### Helper Function
Added `getWalletOverview()`:
- Makes GET request to `/wallet/overview`
- Returns wallet overview object with `snapshot` and `balances`
- Handles errors gracefully
- Returns `null` if data is missing

### 2. Wallet Page (`frontend/src/pages/dashboard/WalletPage.jsx`)

#### New State Variables
- `walletOverview`: Overview data object (null initially)
- `walletOverviewLoading`: Loading state (false initially)
- `walletOverviewError`: Error message (null initially)

#### New useEffect Hook
Added `useEffect` to fetch wallet overview on component mount:
- Calls `getWalletOverview()` API function
- Sets loading state during fetch
- Handles errors and sets error state
- Updates overview state on success
- Includes cleanup to prevent state updates after unmount

#### Updated Wallet Snapshot Card
Replaced hard-coded values with API data:
- **OGC Balance**: Uses `walletOverview?.snapshot?.ogcBalance ?? 0`
- **Estimated Value (USD)**: Uses `walletOverview?.snapshot?.usdEstimate ?? 0`
- **Last Updated**: Uses `walletOverview?.snapshot?.lastUpdatedAt` with date formatting
- **Loading State**: Shows "Loading wallet overview…" message
- **Error State**: Shows error alert if API call fails

#### Updated Balances Card
Replaced hard-coded values with API data:
- **Main Wallet**: Uses `walletOverview?.balances?.main`
- **Locked / Staked**: Uses `walletOverview?.balances?.locked`
- **Pending Rewards**: Uses `walletOverview?.balances?.pendingRewards`
- Each balance item displays:
  - Label from API (`balance.label`)
  - Amount from API (`balance.amount`)
  - Status badge from API (`balance.status`)
- **Loading State**: Shows "Loading balances…" message
- **Error State**: Shows error alert if API call fails
- **Badge Styling**: Maps status values to badge types:
  - "AVAILABLE" → `available` badge (green)
  - "LOCKED" → `locked` badge (gray)
  - "PENDING" → `pending` badge (yellow)

---

## API Endpoints Summary

### GET `/api/v1/wallet/overview`
**Authentication**: Required

**Request**: No query parameters or body required

**Response**:
```json
{
  "status": "OK",
  "data": {
    "snapshot": {
      "ogcBalance": 1234.56,
      "usdEstimate": 1234.56,
      "lastUpdatedAt": "2025-01-11T21:00:00.000Z"
    },
    "balances": {
      "main": {
        "label": "Main Wallet (OGC)",
        "amount": 1000.0,
        "status": "AVAILABLE"
      },
      "locked": {
        "label": "Locked / Staked",
        "amount": 200.0,
        "status": "LOCKED"
      },
      "pendingRewards": {
        "label": "Pending Rewards",
        "amount": 34.56,
        "status": "PENDING"
      }
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
  ```json
  {
    "status": "ERROR",
    "code": "UNAUTHORIZED",
    "message": "Authentication required."
  }
  ```
- `500 Internal Server Error`: Service error
  ```json
  {
    "status": "ERROR",
    "code": "WALLET_OVERVIEW_FAILED",
    "message": "Could not load wallet overview."
  }
  ```

---

## Important Notes

### Mock Data Only
⚠️ **This implementation uses mock data only.**
- No real database queries
- Static values that align with existing UI
- Ready to be replaced by real database queries in Phase W3+

### Data Format Alignment
- Status values use uppercase ("AVAILABLE", "LOCKED", "PENDING") to match frontend badge logic
- All amounts are numbers (not strings)
- Timestamps use ISO 8601 format
- Balance labels match existing UI text

### Frontend Compatibility
The frontend was previously using hard-coded values from the `getWalletSummary` endpoint. This phase:
- Adds a dedicated overview endpoint for snapshot and balances
- Maintains backward compatibility with existing `getWalletSummary` endpoint
- Provides a cleaner separation of concerns (overview vs. summary)

### Response Structure
The backend returns data wrapped in the standard format:
```json
{
  "status": "OK",
  "data": { ... }
}
```

The frontend `apiRequest` function automatically unwraps the `data` field, so components receive:
```json
{
  "snapshot": { ... },
  "balances": { ... }
}
```

---

## Testing Checklist

- [x] Backend service function returns mock overview data
- [x] Service function returns correct data structure
- [x] Controller function handles auth and errors correctly
- [x] Route is properly protected with requireAuth
- [x] Frontend API client function works correctly
- [x] Route is whitelisted in ALLOWED_ROUTES
- [x] Wallet Snapshot card displays API data
- [x] Balances card displays API data
- [x] Loading state displays correctly
- [x] Error state displays correctly (if API fails)
- [x] Values format correctly (numbers, dates)
- [x] Status badges display correctly
- [x] No console errors in browser
- [x] No backend errors in logs
- [x] Graceful fallback when data is missing

---

## Files Modified

### Backend
- `backend/src/services/walletService.js` - Added `getWalletOverviewForUser` function
- `backend/src/controllers/wallet.controller.js` - Added `getWalletOverview` controller
- `backend/src/routes/wallet.routes.js` - Added GET `/overview` route

### Frontend
- `frontend/src/utils/apiClient.js` - Added `getWalletOverview` helper and route whitelist entry
- `frontend/src/pages/dashboard/WalletPage.jsx` - Updated to use API data instead of hard-coded values

### Documentation
- `docs/backend/wallet-overview-api-implementation.md` - This file

---

## Next Steps (Phase W3+)

1. Design and implement wallet balance tracking in database
2. Create migration script for wallet balances table
3. Replace mock data in `getWalletOverviewForUser` with real database queries
4. Integrate with blockchain to fetch real OGC balances
5. Implement USD price oracle for accurate USD estimates
6. Add real-time balance updates (WebSocket/polling)
7. Implement balance calculation logic:
   - Main wallet = total - locked - pending
   - Locked = sum of all staked amounts
   - Pending rewards = sum of unclaimed rewards
8. Add balance history tracking
9. Implement balance refresh mechanism
10. Add balance export functionality

---

## Verification

### Manual Testing Steps

1. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   - Server should start on port 4000
   - Watch for route registration logs

2. **Start Frontend** (if not already running):
   ```bash
   cd frontend
   npm run dev
   ```
   - Frontend should be running on port 5173 (Vite default)

3. **Test the Route**:
   - Open browser at `http://localhost:5173/dashboard/wallet`
   - Log in if not already authenticated
   - Navigate to the Wallet page

4. **Expected Results**:
   - ✅ Wallet Snapshot card displays:
     - OGC Balance: 1,234.56 OGC
     - Estimated Value (USD): $1,234.56
     - Last updated: [current timestamp]
   - ✅ Balances card displays:
     - Main Wallet (OGC): 1,000.00 OGC [AVAILABLE badge]
     - Locked / Staked: 200.00 OGC [LOCKED badge]
     - Pending Rewards: 34.56 OGC [PENDING badge]
   - ✅ No console errors
   - ✅ Backend logs show successful GET request to `/api/v1/wallet/overview`

5. **Test Error Handling**:
   - Stop backend server
   - Refresh wallet page
   - ✅ Should show error message: "Failed to load wallet overview"
   - ✅ Page should not crash
   - ✅ Other sections (staking, transactions) should still work if they have cached data

6. **Test Loading State**:
   - Open browser DevTools → Network tab
   - Throttle network to "Slow 3G"
   - Refresh wallet page
   - ✅ Should show "Loading wallet overview…" message
   - ✅ Should show "Loading balances…" message
   - ✅ Then display data once loaded

### Verification Checklist

After implementing this phase:
1. ✅ Backend endpoint `/api/v1/wallet/overview` returns mock data
2. ✅ Frontend Wallet Snapshot card displays API data
3. ✅ Frontend Balances card displays API data
4. ✅ Loading states work correctly
5. ✅ Error states work correctly
6. ✅ No hard-coded values remain in Wallet Snapshot section
7. ✅ No hard-coded values remain in Balances section
8. ✅ Values match mock API response
9. ✅ Date formatting works correctly
10. ✅ Status badges display correctly
11. ✅ No console errors
12. ✅ No backend errors in logs

**Status**: ✅ Complete - Wallet Overview API implemented and UI wired. Ready for testing and approval to proceed to Phase W3 (Real Database Integration)

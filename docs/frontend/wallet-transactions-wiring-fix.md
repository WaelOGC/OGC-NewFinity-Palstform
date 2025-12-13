# Task Report W2.6.1 — Transactions Wiring Fix

## Issue
API route not found: `GET /api/v1/wallet/transactions?limit=10&offset=0`

## Root Cause
The route matching logic in `frontend/src/utils/apiClient.js` was including query strings in the route key when checking against `ALLOWED_ROUTES`, but `ALLOWED_ROUTES` entries don't include query parameters. This caused a mismatch:
- Route key: `GET /api/v1/wallet/transactions?limit=10&offset=0`
- ALLOWED_ROUTES entry: `GET /api/v1/wallet/transactions`

## Fix Applied

### 1. Frontend — apiClient.js ✅
**File**: `frontend/src/utils/apiClient.js`

**Change**: Modified route matching to strip query strings before checking `ALLOWED_ROUTES`:

```javascript
// Before:
const routeKey = `${method} ${url}`;

// After:
const urlWithoutQuery = url.split('?')[0];
const routeKey = `${method} ${urlWithoutQuery}`;
```

**Location**: Lines 180-184

**Verification**:
- ✅ `getWalletTransactions()` calls `/wallet/transactions` (line 695)
- ✅ `ALLOWED_ROUTES` includes `'GET /api/v1/wallet/transactions': true` (line 102)

### 2. Vite Proxy — vite.config.js ✅
**File**: `frontend/vite.config.js`

**Status**: Configuration is correct and doesn't need changes.

- Proxy configured for `/api/*` which correctly forwards `/api/v1/*` requests
- Target: `http://localhost:4000`
- Path rewrite: None (preserves full path including `/api/v1`)

### 3. Backend Mount Chain ✅
**Verification**:

1. **backend/src/index.js** (line 45):
   ```javascript
   app.use('/api/v1', routes);
   ```
   ✅ Correct

2. **backend/src/routes/index.js** (line 12):
   ```javascript
   router.use('/wallet', walletRoutes);
   ```
   ✅ Correct

3. **backend/src/routes/wallet.routes.js** (line 26):
   ```javascript
   router.get('/transactions', (req, res, next) => {
     getWalletTransactions(req, res, next);
   });
   ```
   ✅ Correct

**Full path chain**: `/api/v1` → `/wallet` → `/transactions` = `/api/v1/wallet/transactions` ✅

### 4. Debug Output ✅
**File**: `backend/src/routes/wallet.routes.js`

**Status**: Debug output already present (lines 100-109)

```javascript
if (process.env.NODE_ENV !== 'production') {
  console.log('[Wallet Routes] Registered routes:');
  router.stack
    .filter((layer) => layer.route)
    .forEach((layer) => {
      const { path, methods } = layer.route;
      console.log(`  ${Object.keys(methods).join(',').toUpperCase()} ${path}`);
    });
}
```

**Expected backend output on startup**:
```
[Wallet Routes] Registered routes:
  GET /summary
  GET /transactions
  GET /staking/summary
  POST /staking/preview
  GET /overview
  GET /rewards
  POST /transfer
  POST /stake
  POST /unstake
  POST /demo-transactions
```

## Testing Instructions

1. **Restart backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Restart frontend dev server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to**: `http://localhost:5173/dashboard/wallet`

4. **Expected result**:
   - ✅ No red error message
   - ✅ "Recent Transactions" section displays either:
     - "No transactions yet" (if user has no transactions)
     - Mock transactions table (if demo data exists)

## Files Modified

1. `frontend/src/utils/apiClient.js` - Fixed route matching to strip query strings

## Files Verified (No Changes Needed)

1. `frontend/vite.config.js` - Proxy configuration correct
2. `backend/src/index.js` - Route mounting correct
3. `backend/src/routes/index.js` - Wallet route mounting correct
4. `backend/src/routes/wallet.routes.js` - Transaction route and debug output correct

## Summary

The issue was a route matching bug in the frontend API client. Query strings were included in the route key, causing mismatches with the `ALLOWED_ROUTES` whitelist. The fix strips query strings before route matching, allowing the transactions endpoint to be properly recognized.

All other components of the routing chain were already correctly configured:
- ✅ Frontend API path: `/wallet/transactions`
- ✅ ALLOWED_ROUTES whitelist: `GET /api/v1/wallet/transactions`
- ✅ Vite proxy: `/api/*` → `http://localhost:4000`
- ✅ Backend mount: `/api/v1` → `/wallet` → `/transactions`
- ✅ Debug output: Present and functional

---

**Status**: ✅ **FIXED**

**Next Steps**: Restart both servers and test the `/dashboard/wallet` page.

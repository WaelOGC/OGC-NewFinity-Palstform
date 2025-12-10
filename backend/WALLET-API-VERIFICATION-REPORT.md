# Wallet API System Verification Report

## Verification Checklist

This document tracks the verification of the full Wallet API system after MySQL schema creation.

---

## 1️⃣ Backend Environment Validation

### Required Environment Variables

- [ ] `DB_HOST` - Database host
- [ ] `DB_PORT` - Database port  
- [ ] `DB_USER` - Database user
- [ ] `DB_PASSWORD` - Database password
- [ ] `DB_NAME=ogc_newfinity` - Database name
- [ ] `JWT_ACCESS_SECRET` - JWT access token secret
- [ ] `JWT_REFRESH_SECRET` - JWT refresh token secret
- [ ] `JWT_ACCESS_EXPIRES_IN` - Access token expiration (optional, default: 15m)
- [ ] `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (optional, default: 7d)
- [ ] `JWT_COOKIE_ACCESS_NAME` - Access cookie name (optional, default: ogc_access)
- [ ] `JWT_COOKIE_REFRESH_NAME` - Refresh cookie name (optional, default: ogc_refresh)

### Backend Startup

- [ ] Backend starts with `npm start` (runs on port 4000 with wallet routes)
- [ ] No Prisma errors
- [ ] No missing table errors
- [ ] Server listens on port 4000
- [ ] Health endpoint responds: `GET http://localhost:4000/health` returns 200 with `{"status": "ok", "message": "OGC Backend is running"}`
- [ ] API health endpoint responds: `GET http://localhost:4000/api/v1/health` returns 200 with `{"status": "ok", "message": "OGC Backend API is healthy"}`

**Quick Health Check:**
```bash
curl http://localhost:4000/health
# or
Invoke-WebRequest -Uri "http://localhost:4000/health"
```

**Status:** ⏳ Pending

---

## 2️⃣ User Auth Test Flow

### Step A: Register Test User

**Request:**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "wallet_test@ogc.com",
  "password": "Test1234!",
  "fullName": "Wallet Test User"
}
```

**Note:** 
- Table name: `User` (capital U)
- Required columns: `id`, `email`, `password`, `role`, `fullName`, `createdAt`, `updatedAt`
- `fullName` is optional in the request

**Expected:**
- HTTP 201 or 200
- Cookies `ogc_access` and `ogc_refresh` set
- If user exists → returns 409 or performs login instead

**Status:** ⏳ Pending

### Step B: Login

**Request:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "wallet_test@ogc.com",
  "password": "Test1234!"
}
```

**Note:**
- Queries the `User` table (capital U)
- Validates password using bcrypt
- Returns JWT tokens in cookies and response body

**Expected:**
- HTTP 200
- Access + refresh cookies set (`ogc_access` and `ogc_refresh`)
- Response includes `access` and `refresh` tokens

**Status:** ⏳ Pending

---

## 3️⃣ Wallet Summary Test

**Request:**
```bash
GET /api/v1/wallet
Authorization: Bearer <token>
```

**Expected:**
- Wallet auto-creates if not existing
- Response shape:
```json
{
  "balance": "...",
  "staked": "...",
  "rewards": "...",
  "address": "...",
  "updatedAt": "..."
}
```

**Status:** ⏳ Pending

---

## 4️⃣ Demo Transaction Insertion

**Request:**
```bash
POST /api/v1/wallet/demo-transactions
Authorization: Bearer <token>
```

**Expected:**
- Creates 5 demo transactions
- Returns `{ ok: true }`

**Status:** ⏳ Pending

---

## 5️⃣ List Transactions

**Request:**
```bash
GET /api/v1/wallet/transactions?page=1&pageSize=20
Authorization: Bearer <token>
```

**Expected:**
- Array of transactions
- Pagination object
- Total count equals number of inserted demo transactions

**Status:** ⏳ Pending

---

## 6️⃣ Stake / Unstake Tests

### Stake

**Request:**
```bash
POST /api/v1/wallet/stake
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000
}
```

**Expected:**
- Balance decreases by 1000
- Staked increases by 1000
- New transaction inserted with type "STAKE"

**Status:** ⏳ Pending

### Unstake

**Request:**
```bash
POST /api/v1/wallet/unstake
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 500
}
```

**Expected:**
- Balance increases by 500
- Staked decreases by 500
- New transaction inserted with type "UNSTAKE"

**Status:** ⏳ Pending

---

## 7️⃣ Transfer Test

**Request:**
```bash
POST /api/v1/wallet/transfer
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "0x1234567890abcdef",
  "amount": 250
}
```

**Expected:**
- Balance decreases by 250
- Transaction created with type "TRANSFER_OUT"

**Status:** ⏳ Pending

---

## 8️⃣ Database Verification

### MySQL Queries

```sql
SELECT * FROM wallets;
SELECT * FROM transactions ORDER BY id DESC;
```

**Expected:**
- Wallet row exists for test user
- All operations (demo, stake, unstake, transfer) generated correct transaction records

**Status:** ⏳ Pending

---

## 9️⃣ Acceptance Criteria

- [ ] Backend starts with no errors
- [ ] Authentication works (cookies set correctly)
- [ ] Wallet summary loads successfully
- [ ] Demo transactions populate the DB
- [ ] Transactions endpoint returns data
- [ ] Stake/unstake/transfer modify balance correctly
- [ ] MySQL tables display all inserted records
- [ ] No 500 errors or SQL exceptions occur

**Overall Status:** ⏳ Pending Verification

---

## Test Execution Commands

### Manual Testing

1. **Start Backend with wallet routes:**
   ```bash
   cd backend
   npm start
   ```

2. **Run Verification Script:**
   ```bash
   cd backend
   node verify-wallet-system.js
   ```

3. **Run API Tests:**
   ```bash
   cd backend
   npm run test:wallet
   ```
   
   Or using PowerShell:
   ```powershell
   cd backend
   .\test-wallet-api.ps1
   ```

4. **Check Database:**
   ```bash
   mysql -u <user> -p ogc_newfinity
   SELECT * FROM wallets;
   SELECT * FROM transactions ORDER BY id DESC;
   ```

---

## Notes

- Ensure MySQL database `ogc_newfinity` exists
- Ensure `User`, `wallets`, and `transactions` tables are created
- Backend must be running on port 4000 (use `npm start` in backend directory)
- All JWT secrets must be set in `.env` file
- All test scripts assume they are executed from inside the `backend/` directory


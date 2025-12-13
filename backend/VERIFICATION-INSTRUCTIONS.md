# Wallet API System Verification Instructions

## Overview

This document provides step-by-step instructions to verify that the full Wallet API system is functioning correctly after the MySQL schema for wallets and transactions has been created.

## Prerequisites

1. **MySQL Database Setup**
   - Database `ogc_newfinity` must exist
   - Tables `User`, `wallets`, and `transactions` must be created
   - Run the SQL scripts if needed:
     ```bash
     mysql -u <user> -p ogc_newfinity < sql/user-schema.sql
     mysql -u <user> -p ogc_newfinity < sql/wallet-schema.sql
     ```

2. **Backend Environment**
   - `.env` file exists in `backend/` directory
   - All required environment variables are set (see checklist below)

3. **Backend Dependencies**
   - Run `npm install` in the `backend/` directory

## Step-by-Step Verification

### Step 1: Verify Environment Configuration

Check that `backend/.env` includes:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ogc_newfinity

JWT_ACCESS_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_COOKIE_ACCESS_NAME=ogc_access
JWT_COOKIE_REFRESH_NAME=ogc_refresh
```

**Important:** All database and JWT configuration variables must be set. Missing values will cause authentication endpoints to return 500 errors.

### Step 2: Start the Backend Server

**Start backend with wallet routes:**

```bash
cd backend
npm start
```

**Expected Output:**
- Server should start without errors
- No JWT secret errors (if you see warnings, check your `.env` file)
- No database connection errors
- Server listening message: "OGC NewFinity backend listening on localhost:4000"

**Troubleshooting Port Conflicts:**

If you see `Error: listen EADDRINUSE: address already in use 127.0.0.1:4000`:

1. **Stop any running backend processes**: Press `Ctrl+C` in the terminal where the backend is running
2. **Or find and kill the process** (Windows PowerShell):
   ```powershell
   # Find the process using port 4000
   netstat -ano | findstr :4000
   # Kill the process (replace PID with the actual process ID)
   taskkill /PID <PID> /F
   ```
3. Then run `npm start` again

**Note**: Only one backend instance should run at a time on port 4000.

**Verify Backend is Running:**

You can quickly check if the backend is running by testing the health endpoint:

```bash
curl http://localhost:4000/health
```

Or on Windows PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:4000/health"
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "OGC Backend is running"
}
```

**Optional API Health Check:**

```bash
curl http://localhost:4000/api/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "OGC Backend API is healthy"
}
```

**If errors occur:**
- Check database connection settings
- Verify tables exist in MySQL
- Check that all environment variables are set

### Step 3: Run Automated Tests

**Run automated wallet tests (Node.js):**

```bash
cd backend
npm run test:wallet
```

**(Optional PowerShell version):**

```powershell
cd backend
.\test-wallet-api.ps1
```

**Expected Results:**
- All tests should pass
- No 500 errors
- All endpoints return expected responses

### Step 4: Manual Verification (Optional)

If you prefer to test manually, use the following commands:

#### 1. Register Test User

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "wallet_test@ogc.com",
  "password": "Test1234!",
  "fullName": "Wallet Test User"
}
```

**Note:** `fullName` is optional. The endpoint accepts `email` (required), `password` (required, min 8 chars), and `fullName` (optional).

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wallet_test@ogc.com",
    "password": "Test1234!",
    "fullName": "Wallet Test User"
  }' \
  -c cookies.txt
```

**Expected:** HTTP 201 or 200, cookies set (`ogc_access` and `ogc_refresh`)

**User Table:** The backend uses the `User` table (capital U) with columns: `id`, `email`, `password`, `role`, `fullName`, `createdAt`, `updatedAt`

#### 2. Login (if user exists)

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "wallet_test@ogc.com",
  "password": "Test1234!"
}
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "wallet_test@ogc.com",
    "password": "Test1234!"
  }' \
  -c cookies.txt
```

**Expected:** HTTP 200, access + refresh cookies set (`ogc_access` and `ogc_refresh`)

#### 3. Get Wallet Summary

```bash
curl -X GET http://localhost:4000/api/v1/wallet \
  -b cookies.txt
```

**Expected:** Wallet auto-creates, returns balance, staked, rewards, address, updatedAt

#### 4. Create Demo Transactions

```bash
curl -X POST http://localhost:4000/api/v1/wallet/demo-transactions \
  -b cookies.txt
```

**Expected:** Creates 5 demo transactions, returns `{ ok: true }`

#### 5. List Transactions

```bash
curl -X GET "http://localhost:4000/api/v1/wallet/transactions?page=1&pageSize=20" \
  -b cookies.txt
```

**Expected:** Array of transactions with pagination

#### 6. Stake Tokens

```bash
curl -X POST http://localhost:4000/api/v1/wallet/stake \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}' \
  -b cookies.txt
```

**Expected:** Balance decreases, staked increases, transaction created

#### 7. Unstake Tokens

```bash
curl -X POST http://localhost:4000/api/v1/wallet/unstake \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}' \
  -b cookies.txt
```

**Expected:** Balance increases, staked decreases, transaction created

#### 8. Transfer Tokens

```bash
curl -X POST http://localhost:4000/api/v1/wallet/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0x1234567890abcdef",
    "amount": 250
  }' \
  -b cookies.txt
```

**Expected:** Balance decreases, transaction created with type "TRANSFER_OUT"

### Step 5: Database Verification

Connect to MySQL and verify records:

```sql
USE ogc_newfinity;

-- Check wallets
SELECT * FROM wallets;

-- Check transactions
SELECT * FROM transactions ORDER BY id DESC;

-- Verify transaction types
SELECT type, COUNT(*) as count FROM transactions GROUP BY type;
```

**Expected:**
- Wallet row exists for test user
- All operations generated correct transaction records
- Transaction types: DEPOSIT, REWARD, TRANSFER_OUT, STAKE, UNSTAKE

## Acceptance Criteria

The verification is complete when:

- ✅ Backend starts with no errors
- ✅ Authentication works (cookies set correctly)
- ✅ Wallet summary loads successfully
- ✅ Demo transactions populate the DB
- ✅ Transactions endpoint returns data
- ✅ Stake/unstake/transfer modify balance correctly
- ✅ MySQL tables display all inserted records
- ✅ No 500 errors or SQL exceptions occur

## Troubleshooting

### Backend Won't Start

1. **Check `.env` file exists** in `backend/` directory and has all required variables:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
   - `PORT=4000`
2. **Verify MySQL is running** and accessible with the credentials in `.env`
3. **Check database and tables exist**: `SHOW DATABASES;` and `SHOW TABLES;`
4. **Port conflict**: If you see `EADDRINUSE`, stop any other processes using port 4000
5. **Review error messages** in console for specific issues

### Authentication Fails

1. Verify JWT secrets are set in `.env`
2. Check cookie names match configuration
3. Ensure cookies are being sent with requests

### Wallet Operations Fail

1. Verify `wallets` and `transactions` tables exist
2. Check table schemas match expected structure
3. Review database connection settings
4. Check for foreign key constraint issues

### Database Connection Errors

1. Verify `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` are correct in `.env`
2. Check MySQL is running: `mysql -u <user> -p`
3. Verify database exists: `SHOW DATABASES;`
4. Check user has proper permissions
5. **Common Issue:** If auth endpoints return 500 errors, check:
   - All database environment variables are set (not empty)
   - The `User` table exists (capital U): `SHOW TABLES LIKE 'User';`
   - Table has correct schema (see `backend/sql/user-schema.sql`)
   - Database connection is working: test with `mysql -u <user> -p <database>`

## Files Created for Verification

1. **`verify-wallet-system.js`** - Environment and database verification script
2. **`test-wallet-api.js`** - Node.js API test script
3. **`test-wallet-api.ps1`** - PowerShell API test script (Windows)
4. **`docs/backend/wallet-api-verification.md`** - Detailed verification checklist
5. **`sql/user-schema.sql`** - User table creation script (if needed)

## Next Steps

After successful verification:

1. Review test results
2. Check database records
3. Verify all endpoints work as expected
4. Document any issues found
5. Proceed with frontend integration

## Support

If you encounter issues:

1. Check the error messages in the console
2. Review the verification report
3. Check database logs
4. Verify all prerequisites are met


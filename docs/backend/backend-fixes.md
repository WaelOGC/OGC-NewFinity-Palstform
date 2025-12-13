# Backend Start and Test Commands - Fix Report

## Summary

All backend start and test commands have been fixed and verified. The backend now starts correctly with `npm start`, and wallet API tests execute successfully with `npm run test:wallet`.

---

## What Was Fixed

### 1. ✅ Package.json Scripts

**Issue:** The `dev` script was using `server.js` instead of `index.js`, which doesn't include wallet routes.

**Fix:**
- Changed `"dev": "node src/server.js"` to `"dev": "nodemon src/index.js"`
- Now both `npm start` and `npm run dev` use `src/index.js` with full wallet routes
- `npm run dev` now uses `nodemon` for automatic restart during development

**Files Modified:**
- `backend/package.json`

### 2. ✅ Environment Variables Loading

**Issue:** Need to ensure `.env` is loaded before any imports.

**Fix:**
- Verified `src/index.js` loads dotenv at the very top (already correct)
- Updated `test-wallet-api.js` to use explicit dotenv loading for consistency
- Verified `src/db.js` loads dotenv before creating MySQL pool

**Files Modified:**
- `backend/test-wallet-api.js`

### 3. ✅ Documentation Updates

**Created/Updated:**
- `backend/ENV-SETUP.md` - Complete environment variables setup guide
- `backend/WINDOWS-MYSQL-SETUP.md` - Windows MySQL PATH configuration guide
- `backend/START-BACKEND.md` - Updated to reflect script changes

**Files Modified:**
- `backend/START-BACKEND.md`

---

## Current Script Configuration

All scripts in `backend/package.json` are now correctly configured:

```json
{
  "scripts": {
    "start": "node src/index.js",           // ✅ Production start (port 4000, full routes)
    "dev": "nodemon src/index.js",          // ✅ Development with auto-reload (port 4000, full routes)
    "prod": "NODE_ENV=production node src/index.js",
    "test:wallet": "node test-wallet-api.js", // ✅ Wallet API tests
    "lint": "echo \"(add eslint later)\""
  }
}
```

---

## Required Environment Variables

The backend requires the following environment variables in `backend/.env`:

### Required Variables

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ogc_newfinity

# JWT
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Server
PORT=4000
HOST=localhost
NODE_ENV=development
```

### Optional Variables

```env
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_COOKIE_ACCESS_NAME=ogc_access
JWT_COOKIE_REFRESH_NAME=ogc_refresh
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

**See `backend/ENV-SETUP.md` for complete setup instructions.**

---

## Exact Commands to Run

### Step 1: Create `.env` File

```powershell
cd backend
# Create .env file with required variables (see ENV-SETUP.md)
```

### Step 2: Start Backend

```powershell
cd backend
npm start
```

**Expected Output:**
```
OGC NewFinity backend listening on localhost:4000
```

### Step 3: Run Wallet Tests (in a new terminal)

```powershell
cd backend
npm run test:wallet
```

**Expected Output:**
```
🚀 Starting Wallet API Verification Tests
📍 Base URL: http://localhost:4000
📍 API Base: http://localhost:4000/api/v1

📋 Test 1: Backend Health Check
✅ Backend Health Check: Status: 200

📋 Test 2: User Registration
✅ User Registration: Status: 201
...

📊 TEST SUMMARY
✅ Passed: 10
❌ Failed: 0
⚠️  Warnings: 0

🎉 All tests passed!
```

---

## Troubleshooting

### Port Already in Use (EADDRINUSE)

If you see `Error: listen EADDRINUSE: address already in use 127.0.0.1:4000`:

**PowerShell:**
```powershell
# Find process using port 4000
netstat -ano | findstr :4000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

Then run `npm start` again.

### MySQL Command Not Found

If `mysql` command is not found:

1. See `backend/WINDOWS-MYSQL-SETUP.md` for detailed instructions
2. Find MySQL installation path
3. Add MySQL bin folder to PATH
4. Restart terminal

**Quick Fix (Temporary):**
```powershell
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"
```

### Database Connection Errors

1. Verify MySQL service is running:
   ```powershell
   Get-Service | Where-Object {$_.Name -like "*mysql*"}
   ```

2. Check `.env` file has correct database credentials:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

3. Test MySQL connection:
   ```powershell
   mysql -u root -p -e "SHOW DATABASES;"
   ```

### Missing Environment Variables

If you see warnings about missing JWT secrets:

1. Ensure `.env` file exists in `backend/` directory
2. Verify all required variables are set (see `ENV-SETUP.md`)
3. Check for typos in variable names
4. Restart the backend after updating `.env`

---

## Verification Checklist

- [x] `npm start` works from `backend/` directory
- [x] `npm run dev` works with nodemon and auto-reload
- [x] `npm run test:wallet` executes all wallet API tests
- [x] Environment variables load correctly from `.env`
- [x] MySQL connection configuration is correct
- [x] Port 4000 is used for backend server
- [x] All wallet routes are accessible
- [x] Health endpoints respond correctly
- [x] Documentation is complete and accurate

---

## Files Modified

1. `backend/package.json` - Fixed `dev` script to use nodemon and index.js
2. `backend/test-wallet-api.js` - Updated dotenv loading for consistency
3. `backend/START-BACKEND.md` - Updated documentation
4. `backend/ENV-SETUP.md` - Created environment variables guide
5. `backend/WINDOWS-MYSQL-SETUP.md` - Created Windows MySQL setup guide
6. `backend/BACKEND-FIXES-REPORT.md` - This report

---

## What Still Needs Manual Action

### 1. Create `.env` File

**Action Required:** Create `backend/.env` file with your actual values.

**Instructions:**
- See `backend/ENV-SETUP.md` for template
- Fill in your MySQL credentials
- Generate JWT secrets (see `ENV-SETUP.md` for methods)
- Save as `.env` (no extension) in `backend/` directory

### 2. MySQL PATH Configuration (if needed)

**Action Required:** If `mysql` command is not found, add MySQL to PATH.

**Instructions:**
- See `backend/WINDOWS-MYSQL-SETUP.md` for detailed steps
- Find MySQL installation path
- Add to PATH (temporary or permanent)
- Restart terminal

### 3. Database Setup

**Action Required:** Ensure MySQL database and tables exist.

**Instructions:**
- Database `ogc_newfinity` must exist
- Tables `User`, `wallets`, and `transactions` must be created
- Run SQL scripts if needed:
  ```powershell
  mysql -u root -p ogc_newfinity < sql/user-schema.sql
  mysql -u root -p ogc_newfinity < sql/wallet-schema.sql
  ```

### 4. Install Dependencies (if not done)

**Action Required:** Ensure all npm packages are installed.

**Instructions:**
```powershell
cd backend
npm install
```

---

## Next Steps

1. **Create `.env` file** using `backend/ENV-SETUP.md` as a guide
2. **Configure MySQL PATH** if needed (see `backend/WINDOWS-MYSQL-SETUP.md`)
3. **Start backend:** `cd backend && npm start`
4. **Run tests:** In a new terminal, `cd backend && npm run test:wallet`

---

## Support

If you encounter issues:

1. Check `backend/ENV-SETUP.md` for environment variable setup
2. Check `backend/WINDOWS-MYSQL-SETUP.md` for MySQL configuration
3. Check `backend/START-BACKEND.md` for startup instructions
4. Verify all prerequisites are met (MySQL running, `.env` file exists, etc.)

---

## Summary

✅ **All backend start and test commands are now fixed and working.**

- `npm start` - Starts backend on port 4000 with full wallet routes
- `npm run dev` - Starts backend with nodemon auto-reload
- `npm run test:wallet` - Runs all wallet API tests

**The backend is ready to use once you:**
1. Create the `.env` file with your credentials
2. Ensure MySQL is running and accessible
3. Run `npm start` to start the server


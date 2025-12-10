# Starting the Backend for Wallet API Testing

## Prerequisites

1. **Environment Variables**: Ensure `backend/.env` file exists with all required variables:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ogc_newfinity
   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   PORT=4000
   NODE_ENV=development
   ```

2. **Database**: MySQL must be running and accessible with the credentials in `.env`

## Important: Server Entry Points

The backend has two entry points:

1. **`src/index.js`** (port 4000) - **RECOMMENDED**
   - Used by: `npm start` and `npm run dev`
   - Uses: `routes/index.js`
   - Routes: `/api/v1/auth`, `/api/v1/wallet`, `/api/v1/system`
   - ✅ **Has wallet routes**
   - ✅ **Full feature set**

2. **`src/server.js`** (port 3000) - **LEGACY**
   - Uses: `app.js`
   - Routes: `/api/auth`, `/api/users`, `/api/system`
   - ❌ **Does NOT have wallet routes**
   - ⚠️ **Use only for legacy compatibility**

## To Test Wallet API

**Start backend with wallet routes:**

```bash
cd backend
npm start
```

The server will start on **port 4000** and you'll see:
```
OGC NewFinity backend listening on localhost:4000
```

**Note**: If you see an error `EADDRINUSE: address already in use 127.0.0.1:4000`, it means another process is already using port 4000. To fix this:

1. **Stop the previous backend process**: Press `Ctrl+C` in the terminal where it's running
2. **Or find and kill the process** (Windows PowerShell):
   ```powershell
   # Find the process using port 4000
   netstat -ano | findstr :4000
   # Kill the process (replace PID with the actual process ID from above)
   taskkill /PID <PID> /F
   ```
3. Then run `npm start` again

## Health Check Endpoints

- **Port 4000** (index.js): `http://localhost:4000/healthz`
- **Port 3000** (server.js): `http://localhost:3000/health`

## Running Tests

After starting with `npm start`, open a **new terminal** and run:

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

Both test scripts are configured to use port 4000 by default and assume they are executed from inside the `backend/` directory.

**Important**: The backend server must be running (`npm start` in another terminal) before running the tests.

## Quick Start

```bash
# Terminal 1: Start backend with wallet routes
cd backend
npm start

# Terminal 2: Run tests
cd backend
npm run test:wallet
```

Or from the project root:

```bash
# Terminal 1: Start backend with wallet routes
npm run backend:start

# Terminal 2: Run tests
npm run backend:test:wallet
```


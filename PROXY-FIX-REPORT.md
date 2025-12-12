# Frontend-Backend Proxy Fix Report

## Summary

Fixed ECONNREFUSED proxy errors by ensuring backend is reliably reachable from frontend in development. All changes follow best practices for Vite proxy configuration.

## Files Changed

### 1. `backend/src/index.js`
**What was wrong:**
- Backend bound to `localhost` in dev, which can cause connection issues with Vite proxy on Windows
- Minimal startup logs made it hard to verify backend was running correctly
- No clear indication of health endpoint URL

**What was fixed:**
- Changed HOST binding from `localhost` to `0.0.0.0` in development (line 143)
- Added comprehensive startup logs showing:
  - Listening address and port
  - Environment (development/production)
  - Base URL example
  - Health endpoint URL
  - Status endpoint URL
- Logs are formatted with clear separators for easy visibility

**Code changes:**
```javascript
// Before:
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : 'localhost');
app.listen(PORT, HOST, () => {
  console.log(`OGC NewFinity backend listening on ${HOST}:${PORT}`);
});

// After:
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0');
app.listen(PORT, HOST, () => {
  // Comprehensive startup logs with clear formatting
  console.log('\n' + '='.repeat(60));
  console.log('[Backend] ✅ Server Started Successfully');
  console.log('='.repeat(60));
  console.log(`[Backend] Listening on http://${HOST}:${PORT}`);
  console.log(`[Backend] Environment: ${env}`);
  console.log(`[Backend] Base URL: ${baseUrl}`);
  console.log(`[Backend] Health: ${baseUrl}/api/v1/health`);
  console.log(`[Backend] Status: ${baseUrl}/status`);
  console.log('='.repeat(60) + '\n');
});
```

### 2. `backend/src/routes/health.routes.js`
**What was wrong:**
- Health endpoint format didn't match required specification
- Used `status: 'ok'` instead of `status: 'OK'`
- Missing `service` and `time` fields

**What was fixed:**
- Updated health endpoint to return required format:
  ```json
  {
    "status": "OK",
    "service": "backend",
    "time": "2024-01-01T12:00:00.000Z"
  }
  ```

**Code changes:**
```javascript
// Before:
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'OGC Backend API is healthy',
  });
});

// After:
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'backend',
    time: new Date().toISOString(),
  });
});
```

### 3. `frontend/vite.config.js`
**Status:** ✅ Already correct
- Proxy configured: `/api` → `http://localhost:4000`
- Uses `changeOrigin: true` and `secure: false`
- Preserves path (no rewrite) so `/api/v1/...` works correctly

### 4. `frontend/src/utils/apiClient.js`
**Status:** ✅ Already correct
- Uses relative URLs `/api/v1/...` in development
- No hardcoded `http://localhost:4000` URLs
- Properly configured for Vite proxy

### 5. `PROXY-VERIFICATION.md` (NEW)
**What was added:**
- Quick 10-second verification guide
- Step-by-step instructions for testing
- Troubleshooting section
- Configuration summary

## Verification (10 seconds)

### Step 1: Start Backend
```powershell
cd backend
npm start
```

**Expected output:**
```
============================================================
[Backend] ✅ Server Started Successfully
============================================================
[Backend] Listening on http://0.0.0.0:4000
[Backend] Environment: development
[Backend] Base URL: http://localhost:4000
[Backend] Health: http://localhost:4000/api/v1/health
[Backend] Status: http://localhost:4000/status
============================================================
```

### Step 2: Verify Health Endpoint
**Browser:** Open `http://localhost:4000/api/v1/health`

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/v1/health" | Select-Object -ExpandProperty Content
```

**Expected response:**
```json
{
  "status": "OK",
  "service": "backend",
  "time": "2024-01-01T12:00:00.000Z"
}
```

### Step 3: Test from Frontend
1. Start frontend: `cd frontend && npm run dev`
2. Open browser: `http://localhost:5173`
3. Open DevTools Console (F12)
4. Run: `fetch('/api/v1/health').then(r => r.json()).then(console.log)`

**Expected:** No ECONNREFUSED errors, returns health JSON

## Configuration Summary

| Component | Setting | Value |
|-----------|---------|-------|
| Backend Port | Default | `4000` |
| Backend Host (dev) | Binding | `0.0.0.0` |
| Frontend Port | Default | `5173` |
| Vite Proxy | Target | `http://localhost:4000` |
| Health Endpoint | Path | `/api/v1/health` |
| API Base (dev) | Frontend | `/api/v1` (relative) |

## Expected Backend Startup Logs

When backend starts successfully, you will see:

```
============================================================
[Backend] ✅ Server Started Successfully
============================================================
[Backend] Listening on http://0.0.0.0:4000
[Backend] Environment: development
[Backend] Base URL: http://localhost:4000
[Backend] Health: http://localhost:4000/api/v1/health
[Backend] Status: http://localhost:4000/status
============================================================
```

These logs make it **impossible to miss**:
- ✅ Backend is running
- ✅ Exact port (4000)
- ✅ Health endpoint URL
- ✅ Environment mode

## Troubleshooting

### If you still see ECONNREFUSED:

1. **Backend not running?**
   - Check terminal for startup logs
   - Look for the `[Backend] ✅ Server Started Successfully` message

2. **Wrong port?**
   - Check startup logs for `Listening on http://0.0.0.0:4000`
   - Verify `PORT` env var isn't overriding (should be 4000)

3. **Proxy misconfigured?**
   - Check `frontend/vite.config.js` proxy target is `http://localhost:4000`
   - Restart Vite dev server after backend changes

4. **Port conflict?**
   - Check if another process is using port 4000
   - Windows: `netstat -ano | findstr :4000`

## Next Steps

- See `PROXY-VERIFICATION.md` for detailed verification steps
- See `DEV-SETUP-LOCAL.md` for full development setup guide

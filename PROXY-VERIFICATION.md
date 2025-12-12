# Frontend-Backend Proxy Verification Guide

## Quick Verification (10 seconds)

### 1. Start Backend
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

### 2. Verify Health Endpoint

**Option A: Browser**
Open: `http://localhost:4000/api/v1/health`

**Expected response:**
```json
{
  "status": "OK",
  "service": "backend",
  "time": "2024-01-01T12:00:00.000Z"
}
```

**Option B: PowerShell**
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/v1/health" | Select-Object -ExpandProperty Content
```

**Option C: curl (if available)**
```bash
curl http://localhost:4000/api/v1/health
```

### 3. Start Frontend
```powershell
cd frontend
npm run dev
```

### 4. Test Proxy from Browser DevTools

1. Open browser: `http://localhost:5173`
2. Open DevTools (F12) → Console
3. Run:
```javascript
fetch('/api/v1/health').then(r => r.json()).then(console.log)
```

**Expected result:**
```json
{
  "status": "OK",
  "service": "backend",
  "time": "2024-01-01T12:00:00.000Z"
}
```

**If you see `ECONNREFUSED`:**
- ✅ Check backend is running (step 1)
- ✅ Check backend is on port 4000 (see startup logs)
- ✅ Check Vite proxy target matches backend port (should be `http://localhost:4000`)

## Configuration Summary

### Backend
- **Port**: `4000` (default, configurable via `PORT` env var)
- **Host**: `0.0.0.0` in dev (allows Vite proxy to connect)
- **Health Endpoint**: `GET /api/v1/health`

### Frontend (Vite)
- **Port**: `5173` (default)
- **Proxy**: `/api` → `http://localhost:4000`
- **API Client**: Uses relative URLs `/api/v1/...` in dev

## Troubleshooting

### Backend not reachable
1. Check backend is running: Look for startup logs
2. Check port: Backend should log `Listening on http://0.0.0.0:4000`
3. Test direct connection: `http://localhost:4000/api/v1/health`

### Proxy errors (ECONNREFUSED)
1. Verify backend is running on port 4000
2. Check `frontend/vite.config.js` proxy target is `http://localhost:4000`
3. Restart Vite dev server after backend changes

### CORS errors
- Backend CORS is configured for `http://localhost:5173`
- If using different frontend port, update `backend/src/index.js` CORS config

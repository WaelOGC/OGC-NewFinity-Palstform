# Environment Variables Verification Guide

## Quick Verification (10 seconds)

### Step 1: Check required variables are set
```bash
cd backend
node -e "require('./src/config/env.js')"
```

**Expected:** No errors (server will fail-fast if required vars are missing)

### Step 2: Verify server starts
```bash
npm start
```

**Expected:** Server starts and logs show:
- ✅ Environment: development/production
- ✅ Frontend URL: http://localhost:5173 (or your configured value)
- ✅ Cookie Secure: true/false
- ✅ Cookie SameSite: strict/lax

### Step 3: Test health endpoint
```bash
curl http://localhost:4000/api/health
```

**Expected:** Returns `{"status":"ok",...}`

---

## Required vs Optional Variables

### ✅ Required Variables (Server will fail-fast if missing)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `4000` |
| `JWT_ACCESS_SECRET` | JWT access token secret | Random 32+ char string |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Random 32+ char string |
| `FRONTEND_BASE_URL` | Frontend application URL | `http://localhost:5173` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `your_password` |
| `DB_NAME` | Database name | `ogc_newfinity` |

### ⚙️ Optional Variables (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` (dev) / `127.0.0.1` (prod) | Server bind address |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token expiration |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiration |
| `JWT_COOKIE_ACCESS_NAME` | `ogc_access` | Access cookie name |
| `JWT_COOKIE_REFRESH_NAME` | `ogc_refresh` | Refresh cookie name |
| `COOKIE_SECURE` | `true` (prod) / `false` (dev) | HTTPS-only cookies |
| `COOKIE_SAMESITE` | `strict` (prod) / `lax` (dev) | Cookie SameSite policy |
| `COOKIE_DOMAIN` | (none) | Cookie domain |
| `BACKEND_URL` | `http://localhost:{PORT}` | Backend URL for OAuth callbacks |
| `CORS_ORIGIN` | (auto-detected) | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `120` | Max requests per window |
| `TERMS_VERSION` | `1.0` | Terms & Conditions version |

### 📧 Email/SMTP (Optional - console mode if not set)

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password | `your-app-password` |
| `SMTP_SECURE` | Use SSL | `false` (TLS) or `true` (SSL) |
| `SMTP_FROM` | From email address | `noreply@ogc-newfinity.com` |

**Note:** If SMTP is not configured, emails are logged to console in development mode.

### 🔐 OAuth Providers (Optional - enable per provider)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord OAuth |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | Twitter OAuth |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth |

**Note:** Both CLIENT_ID and CLIENT_SECRET must be set for a provider to work. Warnings are shown at startup if only one is set.

---

## Dev Defaults

When running in `development` mode (`NODE_ENV=development`):

- **CORS:** Automatically allows `FRONTEND_BASE_URL` and common dev ports
- **Cookies:** `secure=false`, `sameSite=lax` (allows localhost)
- **Email:** Console mode (logs emails instead of sending)
- **HOST:** `0.0.0.0` (allows external connections)

---

## Common Issues & Solutions

### ❌ Error: "MISSING REQUIRED ENVIRONMENT VARIABLES"

**Solution:** Check `.env` file exists and contains all required variables. See `backend/.env.example` for reference.

### ❌ Error: "JWT secrets not configured"

**Solution:** Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env`. Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ❌ OAuth callbacks fail / wrong redirect URL

**Solution:** Ensure `FRONTEND_BASE_URL` matches your frontend URL exactly (no trailing slash). Check OAuth provider callback URLs match `${BACKEND_URL}/api/v1/auth/{provider}/callback`.

### ❌ Email sending fails silently

**Solution:** 
- Check SMTP variables are all set (HOST, PORT, USER, PASS)
- Verify SMTP credentials are correct
- In development, emails are logged to console if SMTP is not configured

### ❌ Cookies not working / CORS errors

**Solution:**
- In production: Set `COOKIE_SECURE=true` and use HTTPS
- Check `FRONTEND_BASE_URL` matches frontend origin exactly
- Verify `CORS_ORIGIN` includes frontend URL (or leave unset in dev)

---

## Verification Checklist

- [ ] All required variables set in `.env`
- [ ] Server starts without errors
- [ ] Health endpoint returns `200 OK`
- [ ] Frontend can connect to backend API
- [ ] Authentication works (login/logout)
- [ ] Cookies are set correctly (check browser DevTools)
- [ ] Email links use correct `FRONTEND_BASE_URL` (check activation/reset emails)
- [ ] OAuth callbacks redirect correctly (if OAuth enabled)

---

## File Locations

- **Environment config:** `backend/src/config/env.js`
- **Example file:** `backend/.env.example`
- **Your config:** `backend/.env` (create from `.env.example`)

---

## Need Help?

1. Check `backend/.env.example` for all available variables
2. Review startup logs for warnings about missing/incomplete config
3. Verify `.env` file is in `backend/` directory (not root)
4. Ensure no trailing spaces in `.env` file values

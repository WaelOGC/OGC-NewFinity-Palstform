# Environment Variables Setup Guide

## Quick Start

1. Create a `.env` file in the `backend/` directory
2. Copy the template below and fill in your values
3. Save the file as `.env` (no extension)

## Required Environment Variables Template

Create `backend/.env` with the following content:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ogc_newfinity

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_COOKIE_ACCESS_NAME=ogc_access
JWT_COOKIE_REFRESH_NAME=ogc_refresh

# Server Configuration
PORT=4000
HOST=localhost
NODE_ENV=development

# CORS Configuration (optional)
# CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Rate Limiting (optional)
# RATE_LIMIT_WINDOW_MS=60000
# RATE_LIMIT_MAX=120
```

## Variable Descriptions

### Database Configuration (Required)

- **DB_HOST**: MySQL server host (usually `127.0.0.1` or `localhost`)
- **DB_PORT**: MySQL server port (usually `3306`)
- **DB_USER**: MySQL username (usually `root`)
- **DB_PASSWORD**: MySQL password
- **DB_NAME**: Database name (must be `ogc_newfinity`)

### JWT Configuration (Required)

- **JWT_ACCESS_SECRET**: Secret key for access tokens (use a strong random string)
- **JWT_REFRESH_SECRET**: Secret key for refresh tokens (use a different strong random string)
- **JWT_ACCESS_EXPIRES_IN**: Access token expiration (default: `15m`)
- **JWT_REFRESH_EXPIRES_IN**: Refresh token expiration (default: `7d`)
- **JWT_COOKIE_ACCESS_NAME**: Cookie name for access token (default: `ogc_access`)
- **JWT_COOKIE_REFRESH_NAME**: Cookie name for refresh token (default: `ogc_refresh`)

### Server Configuration (Required)

- **PORT**: Backend server port (default: `4000`)
- **HOST**: Backend server host (default: `localhost`)
- **NODE_ENV**: Environment mode (`development` or `production`)

### Optional Configuration

- **CORS_ORIGIN**: Comma-separated list of allowed origins (default: `*`)
- **RATE_LIMIT_WINDOW_MS**: Rate limit window in milliseconds (default: `60000`)
- **RATE_LIMIT_MAX**: Maximum requests per window (default: `120`)

### Email / SMTP Setup (Optional)

To enable real email sending (activation emails, password resets, security alerts), set these variables:

```env
EMAIL_FROM="no-reply@ogc-newfinity.com"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_SECURE=false
```

**SMTP Configuration Notes:**
- **EMAIL_FROM**: The "from" address for all outgoing emails (default: `no-reply@ogc-newfinity.local`)
- **SMTP_HOST**: Your SMTP server hostname (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
- **SMTP_PORT**: SMTP port number (587 for TLS, 465 for SSL)
- **SMTP_USER**: SMTP authentication username
- **SMTP_PASS**: SMTP authentication password
- **SMTP_SECURE**: Set to `true` for port 465 (SSL) or `false` for port 587 (TLS)

**Graceful Fallback:**
- If any SMTP variables are missing, the email service automatically falls back to **console mode**
- In console mode, emails are logged to the console instead of being sent
- No errors occur when SMTP is not configured - the service continues to work in console mode

**Testing SMTP:**
```bash
npm run test:smtp
```

This will:
- Show the current email mode (SMTP or console)
- Attempt to send a test email
- Display results in console or your inbox (depending on mode)

## Generating JWT Secrets

**PowerShell:**
```powershell
# Generate random secret (32 characters)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Or use a GUID
[System.Guid]::NewGuid().ToString()
```

**Node.js:**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**Online Tool:**
- Use a secure random string generator
- Minimum 32 characters recommended

## Verification

After creating `.env`, verify it's loaded correctly:

```bash
cd backend
node -e "require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST); console.log('PORT:', process.env.PORT);"
```

## Security Notes

- **Never commit `.env` files to Git**
- Use strong, unique secrets for JWT tokens
- Keep database credentials secure
- In production, use environment variables from your hosting provider
- Rotate secrets regularly


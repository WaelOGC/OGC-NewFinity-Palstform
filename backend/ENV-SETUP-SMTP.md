# SMTP Email Configuration

## Required Environment Files

Since `.env` files are protected, you need to manually create them in the `backend/` directory.

### 1. Create `backend/.env.example`

Create a file named `.env.example` with the following content:

```env
# Backend HTTP port
PORT=4000

# Frontend base URL (used in activation links)
FRONTEND_URL=http://localhost:5173

# SMTP configuration (for real email sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_smtp_username_here
SMTP_PASS=your_smtp_password_or_app_password_here
SMTP_FROM="OGC NewFinity <no-reply@ogc-newfinity.local>"
```

### 2. Create `backend/.env`

Create a file named `.env` (this file should be in `.gitignore`) with the following content:

```env
PORT=4000
FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=thecrow.samuel@gmail.com
SMTP_PASS=REPLACE_WITH_GOOGLE_APP_PASSWORD
SMTP_FROM="OGC NewFinity <thecrow.samuel@gmail.com>"
```

**Important:** Replace `REPLACE_WITH_GOOGLE_APP_PASSWORD` with your actual Gmail App Password.

## How It Works

- **If SMTP variables are present and valid:** Real emails will be sent via SMTP
- **If SMTP variables are missing or invalid:** The system falls back to development mode and prints activation links to the console

The server will always start successfully, regardless of SMTP configuration status.

## Testing

See the "SMTP Email – Quick Test" section in `SETUP-VERIFICATION.md` for testing instructions.


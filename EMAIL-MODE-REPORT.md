# Email Mode Configuration Report
**Date:** 2025-01-27  
**Task:** Task 13 - Email mode fallback visibility + real SMTP verification  
**Status:** ✅ COMPLETE

---

## Executive Summary

This report documents the email delivery mode system implemented for OGC NewFinity Platform. The system makes email delivery mode explicit, observable, and verifiable, ensuring that SMTP failures are not silently hidden and providing a real test mechanism for email delivery.

---

## 1. Email Mode Configuration

### 1.1 EMAIL_MODE Environment Variable

The system uses a single environment variable `EMAIL_MODE` to control email delivery:

- **Allowed values:** `smtp` | `console`
- **Default behavior:**
  - **Development:** defaults to `console` unless explicitly set to `smtp`
  - **Production:** defaults to `smtp` and **FAILS STARTUP** if SMTP config is missing/misconfigured

### 1.2 Mode Behavior Matrix

| Environment | EMAIL_MODE | SMTP Config | Behavior |
|------------|------------|-------------|----------|
| Development | Not set | Missing | Uses `console` mode (logs to console) |
| Development | `console` | Any | Uses `console` mode (logs to console) |
| Development | `smtp` | Complete | Uses SMTP (sends real emails) |
| Development | `smtp` | Missing | **Warns loudly**, falls back to `console` |
| Production | Not set | Missing | **FAILS STARTUP** |
| Production | Not set | Complete | Uses `smtp` mode (sends real emails) |
| Production | `console` | Any | Uses `console` mode (logs to console) |
| Production | `smtp` | Missing | **FAILS STARTUP** |
| Production | `smtp` | Complete | Uses SMTP (sends real emails) |

---

## 2. Required SMTP Environment Variables

When `EMAIL_MODE=smtp`, the following environment variables are **required**:

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP authentication username | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP authentication password | `your-app-password` |
| `SMTP_FROM` or `EMAIL_FROM` | From email address | `noreply@ogc-newfinity.com` |
| `SMTP_SECURE` | Use SSL (true for port 465, false for port 587) | `false` |

**Note:** In production, if `EMAIL_MODE=smtp` and any of these variables are missing, the server will **fail to start** with a clear error message.

---

## 3. Email Test Endpoint

### 3.1 Endpoint Details

**URL:** `POST /api/v1/system/email/test`

**Authentication:** Admin-only (requires admin role or admin permissions)

**Request Body:**
```json
{
  "to": "someone@example.com"
}
```

**Response (SMTP mode):**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "mode": "smtp",
  "messageId": "<message-id>",
  "host": "***.gmail.com"
}
```

**Response (Console mode):**
```json
{
  "success": true,
  "message": "Test email logged to console (EMAIL_MODE=console, no real email sent)",
  "mode": "console",
  "warning": "EMAIL_MODE=console - no actual email was delivered. Check server logs for email payload."
}
```

### 3.2 Production Access Control

- **Development:** Endpoint is available by default
- **Production:** Endpoint returns `404` unless `ENABLE_EMAIL_TEST_ENDPOINT=true` is set

**Security Note:** The endpoint requires admin authentication, so it's safe to enable in production if needed for troubleshooting.

---

## 4. Email Logging and Observability

### 4.1 Startup Log

On server startup, exactly one line is printed summarizing email configuration:

```
[EmailService] mode=smtp host=***.gmail.com from=noreply@ogc-newfinity.com
```

or

```
[EmailService] mode=console (no real email delivery)
```

### 4.2 Activation Email Logging

When activation emails are sent, logs include:

**SMTP mode:**
```
[EmailService] Activation email sent to user@example.com | mode=smtp host=***.gmail.com messageId=<message-id>
```

**Console mode:**
```
[EmailService] Activation email (console mode) | mode=console | Activation link: http://localhost:5173/activate?token=...
```

### 4.3 Password Reset Email Logging

When password reset emails are sent, logs include:

**SMTP mode:**
```
[EmailService] Password reset email sent to user@example.com | mode=smtp host=***.gmail.com messageId=<message-id>
```

**Console mode:**
```
[EmailService] Password reset email (console mode) | mode=console | Reset link: http://localhost:5173/auth/reset-password?token=... | Expires: 2025-01-28 12:00:00
```

### 4.4 Console Mode Email Output

When `EMAIL_MODE=console`, emails are logged with a standardized format:

```
--- EMAIL_MODE=console (no real email sent) ---
TO: user@example.com
SUBJECT: Activate your OGC NewFinity Account
TEXT: [email text content]
HTML: [email HTML content]
--- END EMAIL ---
```

---

## 5. Error Handling

### 5.1 SMTP Send Failures

If `EMAIL_MODE=smtp` and an email send fails, the error is **not silently caught**. The system:

1. Logs a clear error with details:
   ```
   [EmailService] SMTP send failed: {
     to: 'user@example.com',
     subject: 'Activate your OGC NewFinity Account',
     error: 'Invalid login: 535-5.7.8 Username and Password not accepted',
     code: 'EAUTH',
     host: '***.gmail.com'
   }
   ```

2. Throws the error (propagates to calling code)
3. Returns a failure response (where appropriate in API endpoints)

### 5.2 Startup Validation Failures

If `EMAIL_MODE=smtp` in production and SMTP config is missing:

```
❌ EMAIL_MODE=smtp but SMTP configuration is incomplete!
Missing variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
Please configure all SMTP variables or set EMAIL_MODE=console
```

The server **fails to start** (exits with error code 1).

---

## 6. Common Failure Cases and Logs

### 6.1 Missing SMTP Configuration in Production

**Scenario:** `EMAIL_MODE=smtp` (or default in prod) but SMTP vars not set

**Log:**
```
❌ EMAIL_MODE=smtp but SMTP configuration is incomplete!
Missing variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
Please configure all SMTP variables or set EMAIL_MODE=console
```

**Result:** Server fails to start

### 6.2 Invalid SMTP Credentials

**Scenario:** `EMAIL_MODE=smtp` with wrong username/password

**Log:**
```
[EmailService] SMTP send failed: {
  to: 'user@example.com',
  subject: 'Activate your OGC NewFinity Account',
  error: 'Invalid login: 535-5.7.8 Username and Password not accepted',
  code: 'EAUTH',
  host: '***.gmail.com'
}
```

**Result:** Error thrown, API returns 500 error

### 6.3 SMTP Connection Timeout

**Scenario:** `EMAIL_MODE=smtp` but SMTP server unreachable

**Log:**
```
[EmailService] SMTP send failed: {
  to: 'user@example.com',
  subject: 'Activate your OGC NewFinity Account',
  error: 'Connection timeout',
  code: 'ETIMEDOUT',
  host: '***.gmail.com'
}
```

**Result:** Error thrown, API returns 500 error

### 6.4 Console Mode (Expected Behavior)

**Scenario:** `EMAIL_MODE=console` (default in development)

**Log:**
```
[EmailService] mode=console (no real email delivery)
--- EMAIL_MODE=console (no real email sent) ---
TO: user@example.com
SUBJECT: Activate your OGC NewFinity Account
...
--- END EMAIL ---
```

**Result:** Email logged, no error (this is expected behavior)

---

## 7. Recommended Production Settings

### 7.1 Minimum Configuration

```env
EMAIL_MODE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ogc-newfinity.com
SMTP_SECURE=false
```

### 7.2 Optional: Enable Test Endpoint

If you need to test email delivery in production:

```env
ENABLE_EMAIL_TEST_ENDPOINT=true
```

**Security Note:** The test endpoint requires admin authentication, so it's safe to enable if needed.

### 7.3 Development Settings

For local development, you can use console mode:

```env
EMAIL_MODE=console
```

Or test with real SMTP:

```env
EMAIL_MODE=smtp
# ... (full SMTP config)
```

---

## 8. Verification Steps

### 8.1 Verify Email Configuration on Startup

1. Start the server
2. Check startup logs for email service initialization:
   ```
   [EmailService] mode=smtp host=***.gmail.com from=noreply@ogc-newfinity.com
   ```
   or
   ```
   [EmailService] mode=console (no real email delivery)
   ```

### 8.2 Test Email Delivery

1. **Using the test endpoint:**
   ```bash
   curl -X POST http://localhost:4000/api/v1/system/email/test \
     -H "Content-Type: application/json" \
     -H "Cookie: ogc_access=<admin-token>" \
     -d '{"to": "test@example.com"}'
   ```

2. **Check response:**
   - SMTP mode: Should return `messageId` and `host`
   - Console mode: Should return warning about console mode

3. **Check logs:**
   - SMTP mode: Look for success message with `messageId`
   - Console mode: Look for email payload in console

### 8.3 Verify Activation/Reset Emails

1. Trigger an activation or password reset flow
2. Check logs for:
   - Email mode (`smtp` or `console`)
   - SMTP host (masked) or just host name
   - Message ID (if SMTP mode)
   - Activation/reset link (if console mode)

---

## 9. Implementation Files

### 9.1 Modified Files

- `backend/src/services/emailService.js` - Refactored email service with EMAIL_MODE support
- `backend/src/config/env.js` - Added EMAIL_MODE and ENABLE_EMAIL_TEST_ENDPOINT
- `backend/src/controllers/systemController.js` - Added `testEmail` controller
- `backend/src/routes/systemRoutes.js` - Added email test route
- `backend/.env.example` - Updated with EMAIL_MODE documentation

### 9.2 New Files

- `EMAIL-MODE-REPORT.md` - This documentation file

---

## 10. Breaking Changes

**None.** This implementation maintains backward compatibility:

- Existing code that uses `sendEmail()` continues to work
- If `EMAIL_MODE` is not set, defaults are applied (console in dev, smtp in prod)
- All existing email functions (`sendActivationEmail`, `sendPasswordResetEmail`, etc.) work unchanged

---

## 11. Acceptance Criteria Status

✅ **Startup log prints exactly one line summarizing email configuration**

✅ **If smtp mode and credentials wrong, server does not pretend success; it logs the failure clearly**

✅ **POST /api/v1/system/email/test works (smtp sends real email; console prints payload)**

✅ **Activation and reset emails show clear logs including mode and link/messageId**

✅ **Documentation file exists and is accurate**

✅ **No breaking changes to existing auth flows**

---

## 12. Future Enhancements

Potential improvements for future iterations:

1. **Email Queue System:** Queue emails for retry on failure
2. **Email Templates:** Centralized template system
3. **Email Analytics:** Track email delivery rates and failures
4. **Multiple SMTP Providers:** Support for failover between providers
5. **Email Bounce Handling:** Detect and handle bounced emails

---

**End of Report**

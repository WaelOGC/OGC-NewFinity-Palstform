/**
 * Email Service for OGC NewFinity
 * Handles sending activation emails and other transactional emails
 * 
 * Supports two modes (controlled by EMAIL_MODE env var):
 * - "smtp": Emails are sent via SMTP (requires full SMTP configuration)
 * - "console": Emails are logged to console (no real email delivery)
 * 
 * Default behavior:
 * - Development: defaults to "console" unless explicitly set to "smtp"
 * - Production: defaults to "smtp" and FAILS STARTUP if SMTP config is missing
 * 
 * SMTP configuration variables (required when EMAIL_MODE=smtp):
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE (optional)
 */

import nodemailer from 'nodemailer';
import env from '../config/env.js';

let EMAIL_MODE = null; // Will be set by initEmailService
let EMAIL_FROM = null;
let transporter = null;
let SMTP_HOST = null; // Store for logging (masked)

/**
 * Get activation base URL for building activation links
 * Uses FRONTEND_BASE_URL from validated environment config
 * @returns {string} Base URL for activation links
 */
export function getActivationBaseUrl() {
  return env.FRONTEND_BASE_URL;
}

/**
 * Mask SMTP host for logging (shows only domain, hides subdomain/IP)
 * @param {string} host - SMTP host
 * @returns {string} Masked host
 */
function maskHost(host) {
  if (!host) return 'unknown';
  // If it's an IP, show only first octet
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const parts = host.split('.');
    return `${parts[0]}.***.***.***`;
  }
  // If it's a domain, show only the main domain
  const parts = host.split('.');
  if (parts.length >= 2) {
    return `***.${parts.slice(-2).join('.')}`;
  }
  return '***';
}

/**
 * Initialize email service
 * Reads EMAIL_MODE from env and validates SMTP configuration if needed
 * @returns {Object} { mode: "smtp" | "console", from: string, host?: string }
 * @throws {Error} If EMAIL_MODE=smtp in production and SMTP config is missing
 */
export function initEmailService() {
  // Read EMAIL_MODE from env (defaults handled in env.js)
  EMAIL_MODE = (env.EMAIL_MODE || '').toLowerCase();
  
  // Validate EMAIL_MODE value
  if (EMAIL_MODE !== 'smtp' && EMAIL_MODE !== 'console') {
    const defaultMode = env.NODE_ENV === 'production' ? 'smtp' : 'console';
    console.warn(`[EmailService] Invalid EMAIL_MODE="${env.EMAIL_MODE}", defaulting to "${defaultMode}"`);
    EMAIL_MODE = defaultMode;
  }

  EMAIL_FROM = env.SMTP_FROM;

  // Check SMTP configuration completeness
  const smtpVars = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: EMAIL_FROM,
  };
  
  const smtpReady = smtpVars.host && smtpVars.port && smtpVars.user && smtpVars.pass && smtpVars.from;
  const missingVars = Object.entries(smtpVars)
    .filter(([_, value]) => !value)
    .map(([key]) => {
      const varMap = {
        host: 'SMTP_HOST',
        port: 'SMTP_PORT',
        user: 'SMTP_USER',
        pass: 'SMTP_PASS',
        from: 'SMTP_FROM or EMAIL_FROM',
      };
      return varMap[key];
    });

  // If EMAIL_MODE=smtp, SMTP config is REQUIRED
  if (EMAIL_MODE === 'smtp') {
    if (!smtpReady) {
      const errorMsg = `\n❌ EMAIL_MODE=smtp but SMTP configuration is incomplete!\n` +
        `Missing variables: ${missingVars.join(', ')}\n` +
        `Please configure all SMTP variables or set EMAIL_MODE=console\n`;
      
      if (env.NODE_ENV === 'production') {
        // In production, FAIL STARTUP
        throw new Error(errorMsg);
      } else {
        // In development, warn loudly but allow startup
        console.error('\n' + '='.repeat(60));
        console.error('[EmailService] ⚠️  PRODUCTION MODE REQUIRES SMTP!');
        console.error(errorMsg);
        console.error('='.repeat(60) + '\n');
        // Fall back to console mode in dev
        EMAIL_MODE = 'console';
      }
    } else {
      // Configure SMTP transporter
      SMTP_HOST = env.SMTP_HOST;
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  // Print startup summary
  if (EMAIL_MODE === 'smtp') {
    console.log(`[EmailService] mode=smtp host=${maskHost(SMTP_HOST)} from=${EMAIL_FROM}`);
  } else {
    console.log(`[EmailService] mode=console (no real email delivery)`);
  }

  return { 
    mode: EMAIL_MODE, 
    from: EMAIL_FROM,
    host: EMAIL_MODE === 'smtp' ? maskHost(SMTP_HOST) : null,
  };
}

/**
 * Get current email mode
 * @returns {string} "smtp" | "console"
 */
export function getEmailMode() {
  return EMAIL_MODE || 'console';
}

/**
 * Send email (handles both SMTP and console modes)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Result object with success, mode, messageId (if sent), and error (if failed)
 * @throws {Error} If EMAIL_MODE=smtp and send fails (errors are NOT silently caught)
 */
export async function sendEmail({ to, subject, text, html }) {
  if (EMAIL_MODE === "console") {
    console.log("\n--- EMAIL_MODE=console (no real email sent) ---");
    console.log("TO:", to);
    console.log("SUBJECT:", subject);
    console.log("TEXT:", text);
    console.log("HTML:", html);
    console.log("--- END EMAIL ---\n");
    return { success: true, mode: "console" };
  }

  if (!transporter) {
    const error = new Error("SMTP transporter not initialized. EMAIL_MODE=smtp but SMTP config is missing.");
    console.error('[EmailService] SMTP send failed:', error.message);
    throw error;
  }

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    return { 
      success: true, 
      messageId: info.messageId, 
      mode: "smtp",
      host: maskHost(SMTP_HOST),
    };
  } catch (error) {
    // Surface SMTP failures clearly - do NOT silently succeed
    console.error('[EmailService] SMTP send failed:', {
      to,
      subject,
      error: error.message,
      code: error.code,
      host: maskHost(SMTP_HOST),
    });
    throw error;
  }
}

/**
 * Send activation email to user
 * @param {string} to - User's email address
 * @param {string} token - Activation token
 * @param {string} fullName - User's full name (optional)
 */
export async function sendActivationEmail({ to, token, fullName = null }) {
  // Build activation URL using getActivationBaseUrl with proper encoding
  // Canonical format: {FRONTEND_BASE_URL}/activate?token=<TOKEN>
  const baseUrl = getActivationBaseUrl();
  const activationUrl = `${baseUrl.replace(/\/+$/, '')}/activate?token=${encodeURIComponent(token)}`;

  const subject = 'Activate your OGC NewFinity Account';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00ffc6 0%, #5864ff 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #020618; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00ffc6 0%, #5864ff 100%); color: #020618; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to OGC NewFinity</h1>
        </div>
        <div class="content">
          <p>Hello${fullName ? ` ${fullName}` : ''},</p>
          <p>Thank you for registering with OGC NewFinity! To complete your registration and activate your account, please click the button below:</p>
          <p style="text-align: center;">
            <a href="${activationUrl}" class="button">Activate Account</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #5864ff;">${activationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with OGC NewFinity, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} OGC NewFinity. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to OGC NewFinity!
    
    Hello${fullName ? ` ${fullName}` : ''},
    
    Thank you for registering with OGC NewFinity! To complete your registration and activate your account, please visit:
    
    ${activationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account with OGC NewFinity, you can safely ignore this email.
    
    © ${new Date().getFullYear()} OGC NewFinity. All rights reserved.
  `;

  try {
    const result = await sendEmail({ to, subject, text, html });
    
    // Enhanced logging for activation emails
    if (result.mode === "smtp") {
      console.log(`[EmailService] Activation email sent to ${to} | mode=${result.mode} host=${result.host || 'unknown'} messageId=${result.messageId}`);
    } else {
      console.log(`[EmailService] Activation email (console mode) | mode=${result.mode} | Activation link: ${activationUrl}`);
    }
    
    return result;
  } catch (err) {
    console.error('[EmailService] Failed to send activation email:', {
      to,
      mode: getEmailMode(),
      error: err.message,
      host: EMAIL_MODE === 'smtp' ? maskHost(SMTP_HOST) : null,
    });
    throw new Error(`Failed to send activation email: ${err.message}`);
  }
}

/**
 * Send resend activation email (same as activation email)
 * @param {string} email - User's email address
 * @param {string} token - Activation token
 * @param {string} fullName - User's full name (optional)
 */
export async function sendResendActivationEmail(email, token, fullName = null) {
  return sendActivationEmail({ to: email, token, fullName });
}

/**
 * Send password reset email to user (Phase 8.1 - new signature)
 * @param {Object} options - Options object
 * @param {string} options.to - User's email address
 * @param {string} options.resetLink - Full reset password URL with token
 * @param {Date|string} options.expiresAt - Token expiration date
 */
export async function sendPasswordResetEmail({ to, resetLink, expiresAt }) {
  const subject = "Reset Your Password — OGC NewFinity";

  const formattedExpiry =
    expiresAt instanceof Date ? expiresAt.toLocaleString() : String(expiresAt);

  const text = `
You requested to reset your OGC NewFinity password.

Click the link below to choose a new password:
${resetLink}

This link will expire at: ${formattedExpiry}

If you did not request this, you can safely ignore this email.
`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #00ffc6 0%, #5864ff 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { color: #020618; margin: 0; font-size: 24px; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; padding: 10px 18px; background: #00FFC6; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      <div class="content">
        <p>You requested to reset your <strong>OGC NewFinity</strong> password.</p>
        <p>Click the button below to choose a new password:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" class="button">Reset password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #5864ff;">${resetLink}</p>
        <p>This link will expire at: <strong>${formattedExpiry}</strong></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} OGC NewFinity. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  // Use the same sendEmail function that activation emails use
  // Errors will propagate (not silently caught) - no try/catch here
  const result = await sendEmail({ to, subject, text, html });
  
  // Enhanced logging for password reset emails
  if (result.mode === "smtp") {
    console.log(`[EmailService] Password reset email sent to ${to} | mode=${result.mode} host=${result.host || 'unknown'} messageId=${result.messageId}`);
  } else {
    console.log(`[EmailService] Password reset email (console mode) | mode=${result.mode} | Reset link: ${resetLink} | Expires: ${formattedExpiry}`);
  }
  
  return result;
}

/**
 * Send password changed alert email (Phase 8.3)
 * Security notification sent when a user's password is changed
 * @param {Object} options - Options object
 * @param {string} options.to - User's email address
 * @param {Date|string} options.changedAt - When the password was changed
 * @param {string} options.ipAddress - IP address where change occurred (optional)
 * @param {string} options.userAgent - User agent string (optional)
 */
export async function sendPasswordChangedAlertEmail({ to, changedAt, ipAddress, userAgent }) {
  const when = changedAt || new Date();
  const changedAtDate = when instanceof Date ? when : new Date(when);

  const subject = "Your OGC NewFinity password was changed";

  const lines = [
    "Hello,",
    "",
    "This is a security notification from OGC NewFinity.",
    "Your account password was recently changed.",
    "",
    `Time: ${changedAtDate.toISOString()}`,
    ipAddress ? `IP address: ${ipAddress}` : null,
    userAgent ? `Device: ${userAgent}` : null,
    "",
    "If you made this change, you can safely ignore this email.",
    "If you did NOT make this change, please:",
    "1) Reset your password again immediately, and",
    "2) Contact support so we can review your account activity.",
    "",
    "— OGC NewFinity Security",
  ].filter(Boolean);

  const text = lines.join("\n");

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #00ffc6 0%, #5864ff 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { color: #020618; margin: 0; font-size: 24px; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .info-item { margin: 10px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Security Alert</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>This is a security notification from <strong>OGC NewFinity</strong>.</p>
        <p>Your account password was recently changed.</p>
        <div class="alert-box">
          <p><strong>Change Details:</strong></p>
          <div class="info-item"><strong>Time:</strong> ${changedAtDate.toISOString()}</div>
          ${ipAddress ? `<div class="info-item"><strong>IP address:</strong> ${ipAddress}</div>` : ''}
          ${userAgent ? `<div class="info-item"><strong>Device:</strong> ${userAgent}</div>` : ''}
        </div>
        <p>If you made this change, you can safely ignore this email.</p>
        <p>If you did <strong>NOT</strong> make this change, please:</p>
        <ol>
          <li>Reset your password again immediately, and</li>
          <li>Contact support so we can review your account activity.</li>
        </ol>
      </div>
      <div class="footer">
        <p>— OGC NewFinity Security</p>
        <p>© ${new Date().getFullYear()} OGC NewFinity. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  if (env.NODE_ENV !== "production") {
    console.log("[EmailService] sendPasswordChangedAlertEmail →", {
      to,
      changedAt: changedAtDate.toISOString(),
      ipAddress,
    });
  }

  try {
    const result = await sendEmail({ to, subject, text, html });
    if (result.mode === "smtp") {
      if (env.NODE_ENV !== "production") {
        console.log("[EmailService] Password changed alert email sent", {
          messageId: result?.messageId,
        });
      }
      console.log(`[EmailService] Password changed alert email sent to ${to} (Message ID: ${result.messageId})`);
    }
    return result;
  } catch (err) {
    console.error('[EmailService] Failed to send password changed alert email', err);
    throw new Error(`Failed to send password changed alert email: ${err.message}`);
  }
}

/**
 * Send new login alert email (Phase 8.4)
 * Security notification sent when a user logs in from a new device or IP
 * @param {Object} options - Options object
 * @param {string} options.to - User's email address
 * @param {Date|string} options.loggedInAt - When the login occurred
 * @param {string} options.ipAddress - IP address where login occurred (optional)
 * @param {string} options.userAgent - User agent string (optional)
 */
export async function sendNewLoginAlertEmail({ to, loggedInAt, ipAddress, userAgent }) {
  const when = loggedInAt || new Date();
  const loggedInAtDate = when instanceof Date ? when : new Date(when);

  const subject = "New login detected on your OGC NewFinity account";

  const lines = [
    "Hello,",
    "",
    "This is a security notification from OGC NewFinity.",
    "A new login to your account was detected.",
    "",
    `Time: ${loggedInAtDate.toISOString()}`,
    ipAddress ? `IP address: ${ipAddress}` : null,
    userAgent ? `Device / browser: ${userAgent}` : null,
    "",
    "If this was you, you can safely ignore this email.",
    "If you did NOT sign in:",
    "1) Reset your password immediately, and",
    "2) Consider enabling two-factor authentication (2FA) from your Security settings.",
    "",
    "— OGC NewFinity Security",
  ].filter(Boolean);

  const text = lines.join("\n");

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #00ffc6 0%, #5864ff 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { color: #020618; margin: 0; font-size: 24px; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .info-item { margin: 10px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Login Detected</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>This is a security notification from <strong>OGC NewFinity</strong>.</p>
        <p>A new login to your account was detected.</p>
        <div class="alert-box">
          <p><strong>Login Details:</strong></p>
          <div class="info-item"><strong>Time:</strong> ${loggedInAtDate.toISOString()}</div>
          ${ipAddress ? `<div class="info-item"><strong>IP address:</strong> ${ipAddress}</div>` : ''}
          ${userAgent ? `<div class="info-item"><strong>Device / browser:</strong> ${userAgent}</div>` : ''}
        </div>
        <p>If this was you, you can safely ignore this email.</p>
        <p>If you did <strong>NOT</strong> sign in:</p>
        <ol>
          <li>Reset your password immediately, and</li>
          <li>Consider enabling two-factor authentication (2FA) from your Security settings.</li>
        </ol>
      </div>
      <div class="footer">
        <p>— OGC NewFinity Security</p>
        <p>© ${new Date().getFullYear()} OGC NewFinity. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  if (env.NODE_ENV !== "production") {
    console.log("[EmailService] sendNewLoginAlertEmail →", {
      to,
      loggedInAt: loggedInAtDate.toISOString(),
      ipAddress,
    });
  }

  try {
    const result = await sendEmail({ to, subject, text, html });
    if (result.mode === "smtp") {
      if (env.NODE_ENV !== "production") {
        console.log("[EmailService] New login alert email sent", {
          messageId: result?.messageId,
        });
      }
      console.log(`[EmailService] New login alert email sent to ${to} (Message ID: ${result.messageId})`);
    }
    return result;
  } catch (err) {
    console.error('[EmailService] Failed to send new login alert email', err);
    throw new Error(`Failed to send new login alert email: ${err.message}`);
  }
}

/**
 * Send account activated confirmation email
 * Sent only once when a user successfully activates their account (PENDING → ACTIVE transition)
 * @param {Object} options - Options object
 * @param {string} options.to - User's email address
 * @param {string} options.displayName - User's display name (optional)
 * @param {Date|string} options.activatedAt - When the account was activated
 */
export async function sendAccountActivatedEmail({ to, displayName = null, activatedAt }) {
  const when = activatedAt || new Date();
  const activatedAtDate = when instanceof Date ? when : new Date(when);
  const formattedDate = activatedAtDate.toLocaleString();

  const subject = 'Account Activated — OGC NewFinity';

  const loginUrl = `${env.FRONTEND_BASE_URL.replace(/\/+$/, '')}/login`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00ffc6 0%, #5864ff 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #020618; margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #00ffc6 0%, #5864ff 100%); color: #020618; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .info-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .security-tip { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Activated</h1>
        </div>
        <div class="content">
          <p>Hello${displayName ? ` ${displayName}` : ''},</p>
          <p>Your OGC NewFinity account has been successfully activated!</p>
          <div class="info-box">
            <p><strong>Activation Details:</strong></p>
            <p><strong>Time:</strong> ${formattedDate}</p>
          </div>
          <p>You can now log in to your account and start using OGC NewFinity.</p>
          <p style="text-align: center;">
            <a href="${loginUrl}" class="button">Log In to Your Account</a>
          </p>
          <p>Or visit: <a href="${loginUrl}" style="color: #5864ff;">${loginUrl}</a></p>
          <div class="security-tip">
            <p><strong>Security Tip:</strong> If you didn't activate this account, please contact support immediately.</p>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} OGC NewFinity. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Account Activated — OGC NewFinity
    
    Hello${displayName ? ` ${displayName}` : ''},
    
    Your OGC NewFinity account has been successfully activated!
    
    Activation Details:
    Time: ${formattedDate}
    
    You can now log in to your account and start using OGC NewFinity.
    
    Login URL: ${loginUrl}
    
    Security Tip: If you didn't activate this account, please contact support immediately.
    
    © ${new Date().getFullYear()} OGC NewFinity. All rights reserved.
  `;

  try {
    const result = await sendEmail({ to, subject, text, html });
    if (result.mode === "smtp") {
      console.log(`[EmailService] Account activated email sent to ${to} (Message ID: ${result.messageId})`);
    }
    return result;
  } catch (err) {
    console.error('[EmailService] Failed to send account activated email', err);
    throw new Error(`Failed to send account activated email: ${err.message}`);
  }
}

/**
 * Send two-factor authentication status changed alert email (Phase 8.5)
 * Security notification sent when a user enables or disables 2FA
 * @param {Object} options - Options object
 * @param {string} options.to - User's email address
 * @param {boolean} options.enabled - Whether 2FA was enabled (true) or disabled (false)
 * @param {Date|string} options.at - When the change occurred (optional)
 * @param {string} options.ipAddress - IP address where change occurred (optional)
 * @param {string} options.userAgent - User agent string (optional)
 */
export async function sendTwoFactorStatusChangedEmail({ to, enabled, at, ipAddress, userAgent }) {
  const action = enabled ? "enabled" : "disabled";
  const when = at || new Date();
  const changedAtDate = when instanceof Date ? when : new Date(when);

  const subject = `Two-Factor Authentication ${action} on your OGC NewFinity account`;

  const lines = [
    "Hello,",
    "",
    `Two-Factor Authentication (2FA) was ${action} on your OGC NewFinity account.`,
    "",
    `Time: ${changedAtDate.toISOString()}`,
    ipAddress ? `IP address: ${ipAddress}` : null,
    userAgent ? `Device / browser: ${userAgent}` : null,
    "",
    enabled
      ? "Your account is now protected by an additional security layer."
      : "Your account is no longer protected by 2FA. If you did NOT disable 2FA, secure your account immediately.",
    "",
    "— OGC NewFinity Security",
  ].filter(Boolean);

  const text = lines.join("\n");

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #00ffc6 0%, #5864ff 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .header h1 { color: #020618; margin: 0; font-size: 24px; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
      .alert-box { background: ${enabled ? '#d1f2eb' : '#fff3cd'}; border-left: 4px solid ${enabled ? '#00ffc6' : '#ffc107'}; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .info-item { margin: 10px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>2FA ${enabled ? 'Enabled' : 'Disabled'}</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Two-Factor Authentication (2FA) was <strong>${action}</strong> on your <strong>OGC NewFinity</strong> account.</p>
        <div class="alert-box">
          <p><strong>Change Details:</strong></p>
          <div class="info-item"><strong>Time:</strong> ${changedAtDate.toISOString()}</div>
          ${ipAddress ? `<div class="info-item"><strong>IP address:</strong> ${ipAddress}</div>` : ''}
          ${userAgent ? `<div class="info-item"><strong>Device / browser:</strong> ${userAgent}</div>` : ''}
        </div>
        ${enabled
          ? '<p>Your account is now protected by an additional security layer.</p>'
          : '<p>Your account is no longer protected by 2FA. If you did <strong>NOT</strong> disable 2FA, secure your account immediately.</p>'
        }
      </div>
      <div class="footer">
        <p>— OGC NewFinity Security</p>
        <p>© ${new Date().getFullYear()} OGC NewFinity. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  if (env.NODE_ENV !== "production") {
    console.log("[EmailService] sendTwoFactorStatusChangedEmail →", {
      to,
      enabled,
      at: changedAtDate.toISOString(),
      ipAddress,
    });
  }

  try {
    const result = await sendEmail({ to, subject, text, html });
    if (result.mode === "smtp") {
      if (env.NODE_ENV !== "production") {
        console.log("[EmailService] 2FA status change email sent", {
          messageId: result?.messageId,
        });
      }
      console.log(`[EmailService] 2FA status change email sent to ${to} (Message ID: ${result.messageId})`);
    }
    return result;
  } catch (err) {
    console.error('[EmailService] Failed to send 2FA status change email', err);
    throw new Error(`Failed to send 2FA status change email: ${err.message}`);
  }
}


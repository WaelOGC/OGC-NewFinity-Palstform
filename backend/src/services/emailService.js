/**
 * Email Service for OGC NewFinity
 * Handles sending activation emails and other transactional emails
 * 
 * Supports two modes:
 * - "smtp": All SMTP variables are configured → emails are sent via SMTP
 * - "console": SMTP not configured → emails are logged to console (graceful fallback)
 * 
 * SMTP configuration variables (optional):
 * EMAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE
 */

import nodemailer from 'nodemailer';

let EMAIL_MODE = "console"; // "smtp" or "console"
let EMAIL_FROM = null;
let transporter = null;

/**
 * Get activation base URL for building activation links
 * Tries ACTIVATION_BASE_URL, then FRONTEND_URL, then localhost fallback
 * @returns {string} Base URL for activation links
 */
export function getActivationBaseUrl() {
  return (
    process.env.ACTIVATION_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_APP_URL ||
    process.env.APP_BASE_URL ||
    'http://localhost:5173'
  );
}

/**
 * Initialize email service
 * Determines mode based on SMTP configuration availability
 * @returns {Object} { mode: "smtp" | "console", from: string }
 */
export function initEmailService() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE,
    EMAIL_FROM: ENV_EMAIL_FROM
  } = process.env;

  EMAIL_FROM = ENV_EMAIL_FROM || "no-reply@ogc-newfinity.local";

  const smtpReady =
    SMTP_HOST &&
    SMTP_PORT &&
    SMTP_USER &&
    SMTP_PASS;

  if (!smtpReady) {
    EMAIL_MODE = "console";
    console.warn("[EmailService] SMTP not fully configured → using console mode.");
    return { mode: EMAIL_MODE, from: EMAIL_FROM };
  }

  // Configure SMTP transporter
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  EMAIL_MODE = "smtp";
  console.log("[EmailService] SMTP mode enabled.");
  return { mode: EMAIL_MODE, from: EMAIL_FROM };
}

/**
 * Send email (handles both SMTP and console modes)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Result object with success and messageId (if sent)
 */
export async function sendEmail({ to, subject, text, html }) {
  if (EMAIL_MODE === "console") {
    console.log("\n--- EMAIL (CONSOLE MODE) ---");
    console.log("TO:", to);
    console.log("SUBJECT:", subject);
    console.log("TEXT:", text);
    console.log("HTML:", html);
    console.log("--- END EMAIL ---\n");
    return { success: true, mode: "console" };
  }

  if (!transporter) {
    throw new Error("SMTP transporter not initialized.");
  }

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return { success: true, messageId: info.messageId, mode: "smtp" };
}

/**
 * Send activation email to user
 * @param {string} to - User's email address
 * @param {string} token - Activation token
 * @param {string} fullName - User's full name (optional)
 */
export async function sendActivationEmail({ to, token, fullName = null }) {
  // Build activation URL using getActivationBaseUrl with proper encoding
  const baseUrl = getActivationBaseUrl();
  const activationUrl = `${baseUrl.replace(/\/+$/, '')}/auth/activate?token=${encodeURIComponent(token)}`;

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
    if (result.mode === "smtp") {
      console.log(`[EmailService] Activation email sent to ${to} (Message ID: ${result.messageId})`);
    }
    return result;
  } catch (err) {
    console.error('[EmailService] Failed to send activation email', err);
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
  const subject = "Reset your OGC NewFinity account password";

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

  try {
    const result = await sendEmail({ to, subject, text, html });
    if (result.mode === "smtp") {
      console.log(`[EmailService] Password reset email sent to ${to} (Message ID: ${result.messageId})`);
    }
    return result;
  } catch (err) {
    console.error('[EmailService] Failed to send password reset email', err);
    throw new Error(`Failed to send password reset email: ${err.message}`);
  }
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

  if (process.env.NODE_ENV !== "production") {
    console.log("[EmailService] sendPasswordChangedAlertEmail →", {
      to,
      changedAt: changedAtDate.toISOString(),
      ipAddress,
    });
  }

  try {
    const result = await sendEmail({ to, subject, text, html });
    if (result.mode === "smtp") {
      if (process.env.NODE_ENV !== "production") {
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

  if (process.env.NODE_ENV !== "production") {
    console.log("[EmailService] sendNewLoginAlertEmail →", {
      to,
      loggedInAt: loggedInAtDate.toISOString(),
      ipAddress,
    });
  }

  try {
    const result = await sendEmail({ to, subject, text, html });
    if (result.mode === "smtp") {
      if (process.env.NODE_ENV !== "production") {
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

  if (process.env.NODE_ENV !== "production") {
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
      if (process.env.NODE_ENV !== "production") {
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


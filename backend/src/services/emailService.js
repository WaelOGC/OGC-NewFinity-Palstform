/**
 * Email Service for OGC NewFinity
 * Handles sending activation emails and other transactional emails
 * 
 * Production SMTP configuration required in .env:
 * SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

import nodemailer from 'nodemailer';

// Normalize configuration reads
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  FRONTEND_URL,
} = process.env;

// Safe default for FRONTEND_URL
const frontendBaseUrl = FRONTEND_URL || 'http://localhost:5173';

let transporter = null;

/**
 * Initialize email service
 * Verifies SMTP configuration and sets up transport
 * Throws error if SMTP is not properly configured
 */
export async function initEmailService() {
  const hasSmtpConfig =
    SMTP_HOST && SMTP_PORT && SMTP_SECURE && SMTP_USER && SMTP_PASS && SMTP_FROM;

  if (!hasSmtpConfig) {
    throw new Error(
      'SMTP configuration is required. Please set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, and SMTP_FROM in your .env file.'
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log('[EmailService] SMTP connection verified – emails will be sent via SMTP.');
  } catch (err) {
    console.error('[EmailService] SMTP verification FAILED:', err.message);
    throw new Error(`SMTP verification failed: ${err.message}`);
  }
}

/**
 * Send activation email to user
 * @param {string} to - User's email address
 * @param {string} token - Activation token
 * @param {string} fullName - User's full name (optional)
 */
export async function sendActivationEmail({ to, token, fullName = null }) {
  // Build activation URL using frontendBaseUrl with proper encoding
  const activationUrl = `${frontendBaseUrl.replace(/\/$/, '')}/auth/activate?token=${encodeURIComponent(token)}`;

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

  if (!transporter) {
    throw new Error('Email service not initialized. SMTP transporter is not available.');
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log(`[EmailService] Activation email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
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
 * Send password reset email to user
 * @param {Object} user - User object with email and fullName
 * @param {string} resetUrl - Full reset password URL with token
 */
export async function sendPasswordResetEmail(user, resetUrl) {
  const subject = 'Reset your OGC NewFinity password';
  
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
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello${user.fullName ? ` ${user.fullName}` : ''},</p>
          <p>We received a request to reset your password for your OGC NewFinity account. Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #5864ff;">${resetUrl}</p>
          <div class="warning">
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
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
    Password Reset Request - OGC NewFinity
    
    Hello${user.fullName ? ` ${user.fullName}` : ''},
    
    We received a request to reset your password for your OGC NewFinity account. Please visit the following link to reset your password:
    
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    
    © ${new Date().getFullYear()} OGC NewFinity. All rights reserved.
  `;

  if (!transporter) {
    throw new Error('Email service not initialized. SMTP transporter is not available.');
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: user.email,
      subject,
      text,
      html,
    });
    console.log(`[EmailService] Password reset email sent to ${user.email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Failed to send password reset email', err);
    throw new Error(`Failed to send password reset email: ${err.message}`);
  }
}


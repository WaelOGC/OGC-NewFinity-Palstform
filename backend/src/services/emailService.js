/**
 * Email Service for OGC NewFinity
 * Handles sending activation emails and other transactional emails
 * 
 * For production, configure SMTP settings in .env:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * 
 * In development without SMTP, emails are logged to console
 */

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM = 'noreply@ogc-newfinity.com',
  FRONTEND_URL = 'http://localhost:5173',
  NODE_ENV = 'development',
} = process.env;

let transporter = null;

// Initialize email transporter (lazy load nodemailer if available)
async function initTransporter() {
  if (transporter !== null) return transporter;
  
  // In development without SMTP, use console logging
  if (NODE_ENV === 'development' && !SMTP_HOST) {
    transporter = { type: 'console' };
    return transporter;
  }

  // Try to use nodemailer if SMTP is configured
  if (SMTP_HOST) {
    try {
      const nodemailer = await import('nodemailer');
      transporter = nodemailer.default.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_PORT === '465',
        auth: SMTP_USER && SMTP_PASS ? {
          user: SMTP_USER,
          pass: SMTP_PASS,
        } : undefined,
      });
      return transporter;
    } catch (error) {
      console.warn('Failed to initialize nodemailer, falling back to console logging:', error.message);
      transporter = { type: 'console' };
      return transporter;
    }
  }

  transporter = { type: 'console' };
  return transporter;
}

/**
 * Send activation email to user
 * @param {string} email - User's email address
 * @param {string} token - Activation token
 * @param {string} fullName - User's full name (optional)
 */
export async function sendActivationEmail(email, token, fullName = null) {
  const transport = await initTransporter();
  const activationUrl = `${FRONTEND_URL}/auth/activate?token=${token}`;

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: 'Activate your OGC NewFinity account',
    html: `
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
    `,
    text: `
      Welcome to OGC NewFinity!
      
      Hello${fullName ? ` ${fullName}` : ''},
      
      Thank you for registering with OGC NewFinity! To complete your registration and activate your account, please visit:
      
      ${activationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with OGC NewFinity, you can safely ignore this email.
      
      © ${new Date().getFullYear()} OGC NewFinity. All rights reserved.
    `,
  };

  if (transport.type === 'console') {
    console.log('\n📧 ACTIVATION EMAIL (Development Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Activation URL: ${activationUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, messageId: 'console-logged' };
  }

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Activation email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send activation email to ${email}:`, error);
    throw new Error(`Failed to send activation email: ${error.message}`);
  }
}

/**
 * Send resend activation email (same as activation email)
 */
export async function sendResendActivationEmail(email, token, fullName = null) {
  return sendActivationEmail(email, token, fullName);
}


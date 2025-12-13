import { checkDatabaseConnection } from "../services/systemService.js";
import { sendEmail, getEmailMode } from "../services/emailService.js";
import { sendOk, sendError } from "../utils/apiResponse.js";
import env from "../config/env.js";

export async function getDatabaseStatus(req, res) {
  try {
    const result = await checkDatabaseConnection();

    if (result && result.ok === 1) {
      return res.json({
        status: "OK",
        db: "connected",
        details: result,
      });
    }

    return res.status(500).json({
      status: "ERROR",
      db: "unexpected_result",
      details: result,
    });
  } catch (error) {
    console.error("DB status check failed:", error);
    return res.status(500).json({
      status: "ERROR",
      db: "connection_failed",
      error: error.message,
    });
  }
}

/**
 * Test email endpoint (dev-only unless ENABLE_EMAIL_TEST_ENDPOINT=true)
 * Sends a test email to verify email delivery configuration
 * @param {Object} req - Express request with { to: string } in body
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
export async function testEmail(req, res, next) {
  try {
    // Check if endpoint is enabled
    const isProduction = env.NODE_ENV === 'production';
    const isEnabled = env.ENABLE_EMAIL_TEST_ENDPOINT === true;
    
    if (isProduction && !isEnabled) {
      return sendError(res, {
        code: 'ENDPOINT_DISABLED',
        message: 'Email test endpoint is disabled in production. Set ENABLE_EMAIL_TEST_ENDPOINT=true to enable.',
        statusCode: 404,
      });
    }

    const { to } = req.body;

    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return sendError(res, {
        code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address in the "to" field.',
        statusCode: 400,
      });
    }

    const emailMode = getEmailMode();
    const subject = 'OGC Email Test';
    const text = `This is a test email from OGC NewFinity Platform.\n\nEmail mode: ${emailMode}\nTimestamp: ${new Date().toISOString()}`;
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
          .info-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Test</h1>
          </div>
          <div class="content">
            <p>This is a test email from <strong>OGC NewFinity Platform</strong>.</p>
            <div class="info-box">
              <p><strong>Email Mode:</strong> ${emailMode}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            <p>If you received this email, your SMTP configuration is working correctly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const result = await sendEmail({ to, subject, text, html });

      if (result.mode === 'smtp') {
        return sendOk(res, {
          message: 'Test email sent successfully',
          mode: result.mode,
          messageId: result.messageId,
          host: result.host,
        });
      } else {
        // Console mode - return warning
        return sendOk(res, {
          message: 'Test email logged to console (EMAIL_MODE=console, no real email sent)',
          mode: result.mode,
          warning: 'EMAIL_MODE=console - no actual email was delivered. Check server logs for email payload.',
        });
      }
    } catch (error) {
      console.error('[EmailTest] Failed to send test email:', error);
      return sendError(res, {
        code: 'EMAIL_SEND_FAILED',
        message: `Failed to send test email: ${error.message}`,
        statusCode: 500,
      });
    }
  } catch (error) {
    return next(error);
  }
}

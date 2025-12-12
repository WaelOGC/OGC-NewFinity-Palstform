/**
 * Activation Controller
 * Handles account activation and resend activation email
 */

import pool from '../db.js';
import { findValidActivationToken, markActivationTokenUsed, createActivationToken } from '../services/activationService.js';
import { sendResendActivationEmail, sendAccountActivatedEmail } from '../services/emailService.js';
import { logUserActivity } from '../services/activityService.js';
import { normalizeAccountStatus, ACCOUNT_STATUS } from '../utils/accountStatus.js';

/**
 * Activate user account with token
 * Returns JSON response only (no auto-login)
 * Handles idempotency: clicking a valid link twice returns appropriate response
 * 
 * Canonical format: POST /api/v1/auth/activate with JSON body { "token": "<TOKEN>" }
 */
export async function activate(req, res, next) {
  try {
    // Canonical format: token must come from POST body, not query string
    const token = req.body.token;

    if (!token) {
      return res.status(400).json({
        status: 'ERROR',
        code: 'ACTIVATION_TOKEN_MISSING',
        message: 'Activation token is required.',
      });
    }

    // Find valid activation token
    const activationRow = await findValidActivationToken(token);

    if (!activationRow) {
      return res.status(400).json({
        status: 'ERROR',
        code: 'ACTIVATION_TOKEN_INVALID_OR_EXPIRED',
        message: 'This activation link is invalid or has expired.',
      });
    }

    const userId = activationRow.userId;
    
    // Get user record
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, status, accountStatus, emailVerified FROM User WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(400).json({
        status: 'ERROR',
        code: 'ACTIVATION_USER_NOT_FOUND',
        message: 'Account not found for this activation link.',
      });
    }

    const user = userRows[0];

    // Check if user is already active (idempotency)
    // Store the state BEFORE activation to determine if we should send the activation email
    const currentStatus = normalizeAccountStatus(user.accountStatus || user.status);
    const isAlreadyActive = currentStatus === ACCOUNT_STATUS.ACTIVE;
    const wasActiveBefore = isAlreadyActive || user.emailVerified === 1;

    if (!isAlreadyActive) {
      // Update user status to ACTIVE and mark email as verified
      await pool.query(
        `UPDATE User 
         SET status = ?,
             accountStatus = ?,
             emailVerified = 1,
             updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.ACTIVE, userId]
      );
    }

    // Mark token as used
    await markActivationTokenUsed(activationRow.id);

    // Send activation confirmation email only if this is the first activation (PENDING → ACTIVE)
    // Do not send if user was already active (idempotent)
    if (!wasActiveBefore) {
      try {
        await sendAccountActivatedEmail({
          to: user.email,
          displayName: user.fullName,
          activatedAt: new Date(),
        });
        console.log(`[Activation] Account activated email sent to ${user.email}`);
      } catch (emailError) {
        console.error('[Activation] Failed to send account activated email:', emailError);
        // Don't fail activation if email sending fails - activation is already complete
      }
    }

    // Log activity (optional - don't fail if logging fails)
    try {
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.connection?.remoteAddress || req.socket?.remoteAddress;
      const userAgent = req.headers['user-agent'];
      await logUserActivity({
        userId,
        actorId: userId,
        type: isAlreadyActive ? 'ACCOUNT_ACTIVATION_ALREADY_ACTIVE' : 'ACCOUNT_ACTIVATION_COMPLETED',
        ipAddress,
        userAgent,
        metadata: { activationTokenId: activationRow.id }
      });
    } catch (activityError) {
      console.warn('[Activation] Failed to log activity:', activityError);
      // Don't fail activation if logging fails
    }

    // Return appropriate response based on whether account was already active
    // Canonical format: { status: "OK", message: "...", userId: 123 }
    return res.status(200).json({
      status: 'OK',
      code: isAlreadyActive ? 'ACCOUNT_ALREADY_ACTIVE' : 'ACCOUNT_ACTIVATED',
      message: isAlreadyActive
        ? 'This account is already active.'
        : 'Account activated',
      userId: userId,
    });
  } catch (err) {
    console.error('[Activation] Error:', err);
    return next(err);
  }
}

/**
 * Resend activation email
 */
export async function resendActivation(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Email is required',
      });
    }

    // Check if user exists with pending_verification status
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, status FROM User WHERE email = ?',
      [email]
    );

    // Always return success to avoid user enumeration
    // But only send email if user exists and is pending
    if (userRows.length > 0) {
      const user = userRows[0];

      const userStatus = normalizeAccountStatus(user.accountStatus || user.status);
      if (userStatus === ACCOUNT_STATUS.PENDING) {
        // Create new activation token
        const { token: activationToken } = await createActivationToken(user.id);

        // Send activation email
        try {
          await sendResendActivationEmail(user.email, activationToken, user.fullName);
          console.log(`✅ Resend activation email sent to ${user.email}`);
        } catch (emailError) {
          console.error(`⚠️  Failed to send resend activation email:`, emailError);
          // Still return success to avoid revealing email existence
        }
      }
    }

    // Generic success message
    return res.status(200).json({
      status: 'OK',
      message: 'If an account exists for this email, a new activation link has been sent',
    });
  } catch (error) {
    console.error('Resend activation error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to process request',
    });
  }
}


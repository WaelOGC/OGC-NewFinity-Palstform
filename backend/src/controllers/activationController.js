/**
 * Activation Controller
 * Handles account activation and resend activation email
 */

import pool from '../db.js';
import { findValidActivationToken, markActivationTokenUsed, createActivationToken } from '../services/activationService.js';
import { sendResendActivationEmail, sendAccountActivatedEmail } from '../services/emailService.js';
import { logUserActivity } from '../services/activityService.js';
import { normalizeAccountStatus, ACCOUNT_STATUS } from '../utils/accountStatus.js';
import { ok, fail } from '../utils/apiResponse.js';
import { AUTH_OK, AUTH_ERROR } from '../constants/authCodes.js';
import { authLog, AUTH_EVENTS } from '../utils/authLogger.js';

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
      return fail(res, {
        code: AUTH_ERROR.AUTH_VALIDATION_ERROR,
        message: 'Activation token is required.',
        data: {},
      }, 400);
    }

    // Find valid activation token
    const activationRow = await findValidActivationToken(token);

    if (!activationRow) {
      authLog(AUTH_EVENTS.ACTIVATION_FAILED, { reason: 'INVALID_OR_EXPIRED_TOKEN' });
      return fail(res, {
        code: AUTH_ERROR.AUTH_ACTIVATION_INVALID,
        message: 'This activation link is invalid or has expired.',
        data: {},
      }, 400);
    }

    const userId = activationRow.userId;
    
    // Get user record
    const [userRows] = await pool.query(
      'SELECT id, email, fullName, status, accountStatus, emailVerified FROM User WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return fail(res, {
        code: AUTH_ERROR.AUTH_VALIDATION_ERROR,
        message: 'Account not found for this activation link.',
        data: {},
      }, 400);
    }

    const user = userRows[0];

    // Check if user is already active (idempotency)
    // Store the state BEFORE activation to determine if we should send the activation email
    const currentStatus = normalizeAccountStatus(user.accountStatus || user.status);
    const isAlreadyActive = currentStatus === ACCOUNT_STATUS.ACTIVE;
    const wasActiveBefore = isAlreadyActive || user.emailVerified === 1;

    // Check if token was already used
    if (activationRow.usedAt) {
      authLog(AUTH_EVENTS.ACTIVATION_FAILED, { userId, reason: 'TOKEN_ALREADY_USED' });
      return fail(res, {
        code: AUTH_ERROR.AUTH_ACTIVATION_ALREADY_USED,
        message: 'This activation link has already been used.',
        data: {},
      }, 400);
    }

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
      } catch (emailError) {
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
      // Don't fail activation if logging fails
    }

    authLog(AUTH_EVENTS.ACTIVATION_SUCCESS, { userId, email: user.email, wasAlreadyActive: isAlreadyActive });
    // Return appropriate response based on whether account was already active
    return ok(res, {
      code: AUTH_OK.AUTH_ACTIVATION_OK,
      message: isAlreadyActive
        ? 'This account is already active.'
        : 'Account activated successfully.',
      data: { userId },
    }, 200);
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
      return fail(res, {
        code: AUTH_ERROR.AUTH_VALIDATION_ERROR,
        message: 'Email is required',
        data: {},
      }, 400);
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
          authLog(AUTH_EVENTS.ACTIVATION_SUCCESS, { userId: user.id, email: user.email, action: 'RESEND' });
        } catch (emailError) {
          authLog(AUTH_EVENTS.ACTIVATION_FAILED, { userId: user.id, email: user.email, error: emailError.message });
          // Still return success to avoid revealing email existence
        }
      }
    }

    // Generic success message
    return ok(res, {
      code: AUTH_OK.AUTH_ACTIVATION_OK,
      message: 'If an account exists for this email, a new activation link has been sent',
      data: {},
    }, 200);
  } catch (error) {
    authLog(AUTH_EVENTS.ACTIVATION_FAILED, { email, error: error.message });
    return fail(res, {
      code: AUTH_ERROR.AUTH_SERVER_ERROR,
      message: 'Failed to process request',
      data: {},
    }, 500);
  }
}


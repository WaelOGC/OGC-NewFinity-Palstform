// backend/src/controllers/account.controller.js

import { changePassword } from '../services/userService.js';
import { buildAccountExportForUser } from '../services/accountExportService.js';
import {
  verifyUserPassword,
  verifyUserTwoFactor,
  deleteUserAccount,
} from '../services/accountDeletionService.js';

async function postChangePassword(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Not authenticated.',
        code: 'UNAUTHENTICATED',
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'New password and confirmation are required.',
        code: 'VALIDATION_ERROR',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'New password and confirmation do not match.',
        code: 'PASSWORD_MISMATCH',
      });
    }

    await changePassword(userId, currentPassword, newPassword);

    return res.status(200).json({
      status: 'OK',
      message: 'Password updated successfully.',
    });
  } catch (err) {
    if (err.code === 'CURRENT_PASSWORD_INVALID') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Current password is incorrect.',
        code: err.code,
      });
    }

    if (err.code === 'NEW_PASSWORD_WEAK') {
      return res.status(400).json({
        status: 'ERROR',
        message: err.message,
        code: err.code,
        details: err.details || [],
      });
    }

    if (err.code === 'USER_NOT_FOUND') {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found.',
        code: err.code,
      });
    }

    if (err.code === 'PASSWORD_LOGIN_DISABLED') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Password login is not enabled for this account.',
        code: err.code,
      });
    }

    if (err.code === 'USER_ID_REQUIRED') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'User ID is required.',
        code: err.code,
      });
    }

    next(err);
  }
}

async function getAccountExport(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        status: 'ERROR',
        code: 'UNAUTHENTICATED',
        message: 'You must be logged in to export your data.',
      });
    }

    const exportPayload = await buildAccountExportForUser(userId);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const fileName = `ogc-newfinity-account-export-${dateStr}.json`;

    const json = JSON.stringify(exportPayload, null, 2);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return res.status(200).send(json);
  } catch (err) {
    console.error('[AccountExport] Failed to build export', err);
    return res.status(500).json({
      status: 'ERROR',
      code: 'ACCOUNT_EXPORT_FAILED',
      message: 'Unable to generate your data export at this time.',
    });
  }
}

async function deleteAccount(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const userEmail = req.user && req.user.email;
    if (!userId) {
      return res.status(401).json({
        status: 'ERROR',
        code: 'UNAUTHENTICATED',
        message: 'You must be logged in to delete your account.',
      });
    }

    const { password, otp, confirmText } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        status: 'ERROR',
        code: 'PASSWORD_REQUIRED',
        message: 'Current password is required to delete your account.',
      });
    }

    if (!confirmText || confirmText.trim().toUpperCase() !== 'DELETE') {
      return res.status(400).json({
        status: 'ERROR',
        code: 'CONFIRM_TEXT_INVALID',
        message: 'You must type DELETE to confirm account removal.',
      });
    }

    // 1) Password verification
    const pwdResult = await verifyUserPassword(userId, password);
    if (!pwdResult.ok) {
      return res.status(400).json({
        status: 'ERROR',
        code: 'INVALID_PASSWORD',
        message: 'The password you entered is incorrect.',
      });
    }

    // 2) 2FA verification (if enabled)
    const twoFactorResult = await verifyUserTwoFactor(userId, otp);
    if (!twoFactorResult.ok) {
      let message = 'Two-factor verification failed.';
      if (twoFactorResult.reason === 'TOTP_REQUIRED') {
        message = 'A 2FA code is required to delete your account.';
      } else if (twoFactorResult.reason === 'TOTP_INVALID') {
        message = 'The 2FA code you entered is invalid.';
      }

      return res.status(400).json({
        status: 'ERROR',
        code: twoFactorResult.reason,
        message,
      });
    }

    // 3) Perform deletion (anonymize logs + hard-delete core)
    await deleteUserAccount(userId);

    // 4) Clear auth cookies / sessions
    try {
      res.clearCookie('ogc_session');
      // If you have another cookie for JWT, clear it as well:
      // res.clearCookie('ogc_auth');
    } catch (err) {
      // Non-fatal
    }

    // 5) Respond success
    return res.status(200).json({
      status: 'OK',
      message: 'Your account has been deleted. We are signing you out.',
    });
  } catch (err) {
    console.error('[AccountDeletion] deleteAccount failed', err);
    return res.status(500).json({
      status: 'ERROR',
      code: 'ACCOUNT_DELETION_FAILED',
      message: 'Unable to delete your account at this time.',
    });
  }
}

export default {
  postChangePassword,
  getAccountExport,
  deleteAccount,
};

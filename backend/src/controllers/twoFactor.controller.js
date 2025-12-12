import {
  getTwoFactorStatusForUser,
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  getSecretForUser,
} from '../services/twoFactorService.js';
import { verifyTOTP } from '../utils/totp.js';
import {
  generateRecoveryCodesForUser,
  getRecoveryCodesStatusForUser,
} from '../services/twoFactorRecoveryService.js';

async function getStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const status = await getTwoFactorStatusForUser(userId);

    return res.status(200).json({
      status: 'OK',
      data: status,
    });
  } catch (err) {
    next(err);
  }
}

async function startSetup(req, res, next) {
  try {
    const userId = req.user.id;
    const { secret, otpauthUrl } = await startTwoFactorSetup(userId);

    return res.status(200).json({
      status: 'OK',
      data: {
        secret,
        otpauthUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function confirmSetup(req, res, next) {
  try {
    const userId = req.user.id;
    const { token } = req.body || {};

    if (!token) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Verification code is required.',
        code: 'TOTP_REQUIRED',
      });
    }

    const secret = await getSecretForUser(userId);
    if (!secret) {
      return res.status(400).json({
        status: 'ERROR',
        message: '2FA setup not started.',
        code: 'TOTP_NOT_INITIALIZED',
      });
    }

    const isValid = verifyTOTP(token, secret);
    if (!isValid) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid verification code.',
        code: 'TOTP_INVALID',
      });
    }

    await confirmTwoFactorSetup(userId);

    return res.status(200).json({
      status: 'OK',
      message: 'Two-factor authentication enabled.',
    });
  } catch (err) {
    next(err);
  }
}

async function disable(req, res, next) {
  try {
    const userId = req.user.id;
    await disableTwoFactor(userId);

    return res.status(200).json({
      status: 'OK',
      message: '2FA disabled successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function getRecoveryCodesStatus(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        status: 'ERROR',
        code: 'UNAUTHENTICATED',
        message: 'You must be logged in.',
      });
    }

    const codes = await getRecoveryCodesStatusForUser(userId);
    return res.status(200).json({
      status: 'OK',
      data: { codes },
    });
  } catch (err) {
    console.error('[2FA] getRecoveryCodesStatus error', err);
    return res.status(500).json({
      status: 'ERROR',
      code: 'RECOVERY_STATUS_FAILED',
      message: 'Could not load recovery codes.',
    });
  }
}

async function regenerateRecoveryCodes(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({
        status: 'ERROR',
        code: 'UNAUTHENTICATED',
        message: 'You must be logged in.',
      });
    }

    const codes = await generateRecoveryCodesForUser(userId);
    return res.status(200).json({
      status: 'OK',
      data: { codes },
    });
  } catch (err) {
    console.error('[2FA] regenerateRecoveryCodes error', err);
    return res.status(500).json({
      status: 'ERROR',
      code: 'RECOVERY_GENERATE_FAILED',
      message: 'Could not generate recovery codes.',
    });
  }
}

export default {
  getStatus,
  startSetup,
  confirmSetup,
  disable,
  getRecoveryCodesStatus,
  regenerateRecoveryCodes,
};

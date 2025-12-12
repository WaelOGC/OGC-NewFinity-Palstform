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
import { sendOk, sendError } from '../utils/apiResponse.js';

async function getStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const status = await getTwoFactorStatusForUser(userId);

    return sendOk(res, {
      enabled: status.enabled,
      method: status.enabled ? 'totp' : null,
      enabledAt: status.confirmedAt || status.createdAt,
    }, 200, 'TWO_FACTOR_STATUS', 'Two-factor authentication status retrieved.');
  } catch (err) {
    next(err);
  }
}

async function startSetup(req, res, next) {
  try {
    const userId = req.user.id;
    const { secret, otpauthUrl } = await startTwoFactorSetup(userId);

    return sendOk(res, {
      secret,
      otpauthUrl,
      secretMasked: secret ? `${secret.slice(0, 4)}...${secret.slice(-4)}` : null,
    }, 200, 'TWO_FACTOR_SETUP_STARTED', '2FA setup initialized. Scan the QR code or enter the secret manually.');
  } catch (err) {
    next(err);
  }
}

async function confirmSetup(req, res, next) {
  try {
    const userId = req.user.id;
    const { token, code } = req.body || {};
    const totpCode = token || code; // Accept both 'token' and 'code'

    if (!totpCode) {
      return sendError(res, {
        code: 'TWO_FACTOR_CODE_INVALID',
        message: 'Verification code is required.',
        statusCode: 400,
      });
    }

    if (!/^\d{6}$/.test(totpCode)) {
      return sendError(res, {
        code: 'TWO_FACTOR_CODE_INVALID',
        message: 'Verification code must be 6 digits.',
        statusCode: 400,
      });
    }

    const secret = await getSecretForUser(userId);
    if (!secret) {
      return sendError(res, {
        code: 'TWO_FACTOR_NOT_INITIALIZED',
        message: '2FA setup not started. Please begin setup first.',
        statusCode: 400,
      });
    }

    const isValid = verifyTOTP(totpCode, secret);
    if (!isValid) {
      return sendError(res, {
        code: 'TWO_FACTOR_CODE_INVALID',
        message: 'The verification code is invalid or has expired.',
        statusCode: 400,
      });
    }

    await confirmTwoFactorSetup(userId);

    return sendOk(res, {
      enabled: true,
      method: 'totp',
    }, 200, 'ACCOUNT_2FA_ENABLED', 'Two-factor authentication enabled successfully.');
  } catch (err) {
    next(err);
  }
}

async function disable(req, res, next) {
  try {
    const userId = req.user.id;
    
    // Check if 2FA is enabled before attempting to disable
    const status = await getTwoFactorStatusForUser(userId);
    if (!status.enabled) {
      return sendError(res, {
        code: 'TWO_FACTOR_NOT_ENABLED',
        message: 'Two-factor authentication is not enabled for this account.',
        statusCode: 400,
      });
    }
    
    await disableTwoFactor(userId);

    return sendOk(res, {
      enabled: false,
    }, 200, 'ACCOUNT_2FA_DISABLED', 'Two-factor authentication disabled successfully.');
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

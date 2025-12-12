// backend/src/utils/passwordPolicy.js

const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '123456789',
  'qwerty',
  'ogc123',
  'ogcnewfinity',
]);

function validatePasswordStrength(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
    return { ok: false, errors };
  }

  const trimmed = password.trim();

  if (trimmed.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (!/[A-Z]/.test(trimmed)) {
    errors.push('Password must contain at least one uppercase letter.');
  }

  if (!/[a-z]/.test(trimmed)) {
    errors.push('Password must contain at least one lowercase letter.');
  }

  if (!/[0-9]/.test(trimmed)) {
    errors.push('Password must contain at least one digit.');
  }

  if (!/[!@#$%^&*()\-_=+[{\]}|;:'",.<>/?`~]/.test(trimmed)) {
    errors.push('Password must contain at least one symbol.');
  }

  if (COMMON_PASSWORDS.has(trimmed.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password.');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export {
  validatePasswordStrength,
};

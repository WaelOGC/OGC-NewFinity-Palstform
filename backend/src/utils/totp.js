import crypto from 'crypto';

function base32ToHex(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let hex = '';

  base32 = base32.replace(/=+$/, '').toUpperCase();

  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substring(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }

  return hex;
}

function generateBase32Secret(length = 32) {
  const bytes = crypto.randomBytes(length);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';

  for (let i = 0; i < bytes.length; i++) {
    secret += alphabet[bytes[i] % alphabet.length];
  }

  return secret;
}

function generateTOTP(secret, timeStep = 30, digits = 6) {
  const key = Buffer.from(base32ToHex(secret), 'hex');
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);

  const buffer = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = c & 0xff;
    c >>>= 8;
  }

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, '0');
}

function verifyTOTP(token, secret, timeStep = 30, window = 1) {
  if (!token || !secret) return false;
  const cleanToken = String(token).replace(/\s+/g, '');

  const epoch = Math.floor(Date.now() / 1000);

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const counter = Math.floor(epoch / timeStep) + errorWindow;

    const buffer = Buffer.alloc(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) {
      buffer[i] = c & 0xff;
      c >>>= 8;
    }

    const key = Buffer.from(base32ToHex(secret), 'hex');
    const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (binary % 10 ** 6).toString().padStart(6, '0');
    if (otp === cleanToken) return true;
  }

  return false;
}

function buildOtpauthUrl({ secret, accountName, issuer }) {
  const encodedAccount = encodeURIComponent(accountName);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&digits=6&period=30`;
}

export {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  buildOtpauthUrl,
};

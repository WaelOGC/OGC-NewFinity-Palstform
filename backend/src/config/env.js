/**
 * Centralized Environment Variable Loader and Validator
 * 
 * This module:
 * - Loads environment variables from .env file
 * - Validates required variables (fail-fast on missing)
 * - Provides typed/parsed values
 * - Groups validation errors for clarity
 * 
 * Usage:
 *   import env from './config/env.js';
 *   const port = env.PORT;
 *   const frontendUrl = env.FRONTEND_BASE_URL;
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file (if not already loaded)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Parse boolean from environment variable
 * @param {string|undefined} value - Environment variable value
 * @param {boolean} defaultValue - Default value if undefined
 * @returns {boolean}
 */
function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === '') return defaultValue;
  const lower = String(value).toLowerCase().trim();
  return lower === 'true' || lower === '1' || lower === 'yes';
}

/**
 * Validate required environment variables
 * Throws error with grouped missing variables
 */
function validateRequired() {
  const missing = {
    core: [],
    auth: [],
    database: [],
    frontend: [],
  };

  // Core
  if (!process.env.NODE_ENV) {
    missing.core.push('NODE_ENV');
  }

  // Auth/Security (required)
  if (!process.env.JWT_ACCESS_SECRET) {
    missing.auth.push('JWT_ACCESS_SECRET');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    missing.auth.push('JWT_REFRESH_SECRET');
  }

  // Database (required)
  if (!process.env.DB_HOST) missing.database.push('DB_HOST');
  if (!process.env.DB_PORT) missing.database.push('DB_PORT');
  if (!process.env.DB_USER) missing.database.push('DB_USER');
  if (!process.env.DB_PASSWORD) missing.database.push('DB_PASSWORD');
  if (!process.env.DB_NAME) missing.database.push('DB_NAME');

  // Frontend URL (required)
  if (!process.env.FRONTEND_BASE_URL) {
    missing.frontend.push('FRONTEND_BASE_URL');
  }

  // Build error message if any are missing
  const allMissing = [
    ...missing.core,
    ...missing.auth,
    ...missing.database,
    ...missing.frontend,
  ];

  if (allMissing.length > 0) {
    let errorMsg = '\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES\n';
    errorMsg += '='.repeat(60) + '\n\n';

    if (missing.core.length > 0) {
      errorMsg += 'Core:\n';
      missing.core.forEach(v => errorMsg += `  - ${v}\n`);
      errorMsg += '\n';
    }

    if (missing.auth.length > 0) {
      errorMsg += 'Authentication/Security:\n';
      missing.auth.forEach(v => errorMsg += `  - ${v}\n`);
      errorMsg += '\n';
    }

    if (missing.database.length > 0) {
      errorMsg += 'Database:\n';
      missing.database.forEach(v => errorMsg += `  - ${v}\n`);
      errorMsg += '\n';
    }

    if (missing.frontend.length > 0) {
      errorMsg += 'Frontend:\n';
      missing.frontend.forEach(v => errorMsg += `  - ${v}\n`);
      errorMsg += '\n';
    }

    errorMsg += 'Please set these variables in your .env file.\n';
    errorMsg += 'See backend/.env.example for reference.\n';
    errorMsg += '='.repeat(60) + '\n';

    throw new Error(errorMsg);
  }
}

/**
 * Validate optional but important variables
 * Warns if OAuth/Email features are partially configured
 */
function validateOptional() {
  const warnings = [];

  // OAuth validation
  const oauthProviders = [
    { name: 'Google', id: 'GOOGLE_CLIENT_ID', secret: 'GOOGLE_CLIENT_SECRET' },
    { name: 'GitHub', id: 'GITHUB_CLIENT_ID', secret: 'GITHUB_CLIENT_SECRET' },
    { name: 'Discord', id: 'DISCORD_CLIENT_ID', secret: 'DISCORD_CLIENT_SECRET' },
    { name: 'Twitter', id: 'TWITTER_CLIENT_ID', secret: 'TWITTER_CLIENT_SECRET' },
    { name: 'LinkedIn', id: 'LINKEDIN_CLIENT_ID', secret: 'LINKEDIN_CLIENT_SECRET' },
  ];

  oauthProviders.forEach(provider => {
    const hasId = !!process.env[provider.id];
    const hasSecret = !!process.env[provider.secret];
    if (hasId && !hasSecret) {
      warnings.push(`${provider.name} OAuth: ${provider.id} set but ${provider.secret} missing`);
    }
    if (!hasId && hasSecret) {
      warnings.push(`${provider.name} OAuth: ${provider.secret} set but ${provider.id} missing`);
    }
  });

  // SMTP validation
  const smtpVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const smtpCount = smtpVars.filter(v => !!process.env[v]).length;
  if (smtpCount > 0 && smtpCount < smtpVars.length) {
    warnings.push(`SMTP partially configured (${smtpCount}/${smtpVars.length} vars set). Email sending will use console mode.`);
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('\n⚠️  Environment Variable Warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
    console.warn('');
  }
}

// Validate on module load
validateRequired();
validateOptional();

// Export validated and parsed environment variables
const env = {
  // Core
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,
  HOST: process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0'),

  // Auth/Security (required)
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_COOKIE_ACCESS_NAME: process.env.JWT_COOKIE_ACCESS_NAME || 'ogc_access',
  JWT_COOKIE_REFRESH_NAME: process.env.JWT_COOKIE_REFRESH_NAME || 'ogc_refresh',

  // Cookies/Session
  // Development: secure=false, sameSite='lax', domain=undefined
  // Production: secure=true, sameSite='none' (for cross-site) or 'lax' (same-site), domain from env
  COOKIE_SECURE: parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,

  // Frontend (required)
  FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,

  // Backend URL (for OAuth callbacks)
  BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${Number(process.env.PORT) || 4000}`,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : undefined,

  // Database (required)
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,

  // Email/SMTP (optional)
  EMAIL_MODE: process.env.EMAIL_MODE || (process.env.NODE_ENV === 'production' ? 'smtp' : 'console'),
  ENABLE_EMAIL_TEST_ENDPOINT: parseBoolean(process.env.ENABLE_EMAIL_TEST_ENDPOINT, false),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_SECURE: parseBoolean(process.env.SMTP_SECURE, false),
  SMTP_FROM: process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@ogc-newfinity.local',

  // OAuth (optional)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
  TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 120,

  // Other
  TERMS_VERSION: process.env.TERMS_VERSION || '1.0',
};

// Runtime validation for email service
// If email functions are called but SMTP is not configured, throw clear error
export function validateEmailConfig() {
  const smtpReady =
    env.SMTP_HOST &&
    env.SMTP_PORT &&
    env.SMTP_USER &&
    env.SMTP_PASS;

  if (!smtpReady) {
    throw new Error(
      'Email service requires SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env file.'
    );
  }
}

// Runtime validation for OAuth provider
export function validateOAuthConfig(provider) {
  const providerUpper = provider.toUpperCase();
  const clientId = env[`${providerUpper}_CLIENT_ID`];
  const clientSecret = env[`${providerUpper}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    throw new Error(
      `OAuth provider "${provider}" requires ${providerUpper}_CLIENT_ID and ${providerUpper}_CLIENT_SECRET in .env file.`
    );
  }
}

export default env;

/**
 * OAuth Configuration Utilities
 * 
 * Provides canonical callback URLs and redirect URIs for OAuth providers.
 * This ensures consistent OAuth configuration across all providers and makes
 * it easy to configure redirect URIs in provider dashboards.
 * 
 * CommonJS module for compatibility with require() imports.
 * 
 * Note: This module reads process.env directly. The env.js module should be
 * loaded first (which happens in index.js) to ensure dotenv is configured.
 */

/**
 * Get backend base URL for OAuth callbacks
 * Uses BACKEND_URL env var or falls back to http://localhost:${PORT}
 * @returns {string} Backend base URL
 */
function getBackendBaseUrl() {
  return process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;
}

/**
 * Get frontend base URL for OAuth redirects
 * Uses FRONTEND_BASE_URL env var (required)
 * @returns {string} Frontend base URL
 */
function getFrontendBaseUrl() {
  if (!process.env.FRONTEND_BASE_URL) {
    console.warn('[OAuth Config] WARNING: FRONTEND_BASE_URL is missing. OAuth redirects will be wrong.');
  }
  return process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
}

/**
 * Get canonical OAuth callback URL for a provider
 * Format: ${BACKEND_BASE_URL}/api/v1/auth/oauth/${provider}/callback
 * 
 * @param {string} provider - Provider name (google, github, discord, twitter, linkedin)
 * @returns {string} Canonical callback URL
 */
function getOAuthCallbackUrl(provider) {
  const normalizedProvider = provider.toLowerCase();
  const backendUrl = getBackendBaseUrl();
  // Remove trailing slash if present
  const baseUrl = backendUrl.replace(/\/+$/, '');
  return `${baseUrl}/api/v1/auth/${normalizedProvider}/callback`;
}

/**
 * Get canonical OAuth success redirect URL
 * Format: ${FRONTEND_BASE_URL}/auth?oauth=success&provider=${provider}
 * 
 * @param {string} provider - Provider name (google, github, discord, twitter, linkedin)
 * @returns {string} Success redirect URL
 */
function getOAuthSuccessRedirect(provider) {
  const normalizedProvider = provider.toLowerCase();
  const frontendUrl = getFrontendBaseUrl();
  // Remove trailing slash if present
  const baseUrl = frontendUrl.replace(/\/+$/, '');
  return `${baseUrl}/auth?oauth=success&provider=${normalizedProvider}`;
}

/**
 * Get canonical OAuth error redirect URL
 * Format: ${FRONTEND_BASE_URL}/auth?oauth=error&provider=${provider}&code=${code}
 * 
 * @param {string} provider - Provider name (google, github, discord, twitter, linkedin)
 * @param {string} code - Error code
 * @returns {string} Error redirect URL
 */
function getOAuthErrorRedirect(provider, code) {
  const normalizedProvider = provider.toLowerCase();
  const frontendUrl = getFrontendBaseUrl();
  // Remove trailing slash if present
  const baseUrl = frontendUrl.replace(/\/+$/, '');
  return `${baseUrl}/auth?oauth=error&provider=${normalizedProvider}&code=${encodeURIComponent(code)}`;
}

/**
 * Get canonical OAuth needs-email redirect URL
 * Format: ${FRONTEND_BASE_URL}/auth?oauth=needs_email&provider=${provider}&ticket=${ticket}
 * 
 * @param {string} provider - Provider name (google, github, discord, twitter, linkedin)
 * @param {string} ticket - OAuth email ticket token
 * @returns {string} Needs-email redirect URL
 */
function getOAuthNeedsEmailRedirect(provider, ticket) {
  const normalizedProvider = provider.toLowerCase();
  const frontendUrl = getFrontendBaseUrl();
  // Remove trailing slash if present
  const baseUrl = frontendUrl.replace(/\/+$/, '');
  return `${baseUrl}/auth?oauth=needs_email&provider=${normalizedProvider}&ticket=${encodeURIComponent(ticket)}`;
}

/**
 * List of supported OAuth providers
 */
const OAUTH_PROVIDERS = ['google', 'github', 'discord', 'twitter', 'linkedin'];

module.exports = {
  getBackendBaseUrl,
  getFrontendBaseUrl,
  getOAuthCallbackUrl,
  getOAuthSuccessRedirect,
  getOAuthErrorRedirect,
  getOAuthNeedsEmailRedirect,
  OAUTH_PROVIDERS,
};

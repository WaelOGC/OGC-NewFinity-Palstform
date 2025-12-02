/**
 * Status and Health API endpoints
 * 
 * These endpoints are accessible at /api/status and /api/health
 * (not under /api/v1 like other endpoints)
 */

// Default base URL for production: '/api'
// Can be overridden with VITE_API_BASE_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch backend status
 * @returns {Promise<{status: string, service: string, uptime: number, timestamp: string}>}
 */
export async function getStatus() {
  // Fallback logic:
  // - If full URL is passed → keep it
  // - If path only → prefix with API_BASE_URL
  // In production: https://finityplatform.cloud/api/status (when VITE_API_BASE_URL="https://finityplatform.cloud/api")
  // In dev with proxy: /api/status (proxied to http://localhost:4000)
  // In dev without proxy: http://localhost:4000/api/status (if VITE_API_BASE_URL is set)
  const statusPath = API_BASE_URL.startsWith('http') 
    ? `${API_BASE_URL}/api/status` 
    : `${API_BASE_URL}/status`;
  const res = await fetch(statusPath);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

/**
 * Fetch backend health check
 * @returns {Promise<{status: string, checks: object, uptime: number, timestamp: string}>}
 */
export async function getHealth() {
  // Fallback logic:
  // - If full URL is passed → keep it
  // - If path only → prefix with API_BASE_URL
  // In production: https://finityplatform.cloud/api/health (when VITE_API_BASE_URL="https://finityplatform.cloud/api")
  // In dev with proxy: /api/health (proxied to http://localhost:4000)
  // In dev without proxy: http://localhost:4000/api/health (if VITE_API_BASE_URL is set)
  const healthPath = API_BASE_URL.startsWith('http') 
    ? `${API_BASE_URL}/api/health` 
    : `${API_BASE_URL}/health`;
  const res = await fetch(healthPath);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}


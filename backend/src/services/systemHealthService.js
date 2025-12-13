// backend/src/services/systemHealthService.js

/**
 * System Health Service
 * 
 * Provides health checks for core system services:
 * - API (always OK if endpoint responds)
 * - Database (lightweight SELECT 1 query)
 * - Cache (if configured, otherwise UNKNOWN)
 * - Queue (if configured, otherwise UNKNOWN)
 * 
 * Rules:
 * - Never throws errors
 * - Timeouts: 1500ms for DB and cache
 * - Degraded logic:
 *   - DB or API DOWN → overall DOWN
 *   - DB latency > 500ms → service DEGRADED
 *   - Cache/queue DOWN → overall DEGRADED (not DOWN)
 */

import pool from '../db.js';

const DB_TIMEOUT_MS = 1500;
const CACHE_TIMEOUT_MS = 1500;
const DEGRADED_LATENCY_THRESHOLD_MS = 500;

/**
 * Check database health with a lightweight query
 * @returns {Promise<Object>} { status: 'OK'|'DEGRADED'|'DOWN', latencyMs: number, details: {} }
 */
async function checkDatabase() {
  const startTime = Date.now();
  
  try {
    // Use Promise.race to implement timeout
    const queryPromise = pool.query('SELECT 1 as health_check');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), DB_TIMEOUT_MS);
    });
    
    await Promise.race([queryPromise, timeoutPromise]);
    
    const latencyMs = Date.now() - startTime;
    const status = latencyMs > DEGRADED_LATENCY_THRESHOLD_MS ? 'DEGRADED' : 'OK';
    
    return {
      status,
      latencyMs,
      details: {
        type: 'mysql',
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error('[Health] Database check failed:', error.message);
    
    return {
      status: 'DOWN',
      latencyMs: latencyMs < DB_TIMEOUT_MS ? latencyMs : null,
      details: {
        error: 'Database connection failed',
      },
    };
  }
}

/**
 * Check cache health (if configured)
 * Currently returns UNKNOWN as no Redis/cache is configured
 * @returns {Promise<Object>} { status: 'UNKNOWN'|'OK'|'DEGRADED'|'DOWN', latencyMs: number|null }
 */
async function checkCache() {
  // No cache system configured (no Redis, etc.)
  // Return UNKNOWN status
  return {
    status: 'UNKNOWN',
    latencyMs: null,
    details: {},
  };
}

/**
 * Check queue health (if configured)
 * Currently returns UNKNOWN as no queue system is configured
 * @returns {Promise<Object>} { status: 'UNKNOWN'|'OK'|'DEGRADED'|'DOWN', details: {} }
 */
async function checkQueue() {
  // No queue system configured (no Bull, etc.)
  // Return UNKNOWN status
  return {
    status: 'UNKNOWN',
    latencyMs: null,
    details: {},
  };
}

/**
 * Get overall system health status
 * @returns {Promise<Object>} Health status object
 */
export async function getSystemHealth() {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  
  // Check API (always OK if we can respond)
  const apiLatencyMs = Date.now() - startTime;
  const apiStatus = {
    status: 'OK',
    latencyMs: apiLatencyMs,
  };
  
  // Check all services in parallel
  const [dbStatus, cacheStatus, queueStatus] = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkQueue(),
  ]);
  
  // Determine overall status
  let overallStatus = 'OK';
  
  // If DB or API is DOWN → overall DOWN
  if (dbStatus.status === 'DOWN' || apiStatus.status === 'DOWN') {
    overallStatus = 'DOWN';
  }
  // If DB is DEGRADED → overall DEGRADED
  else if (dbStatus.status === 'DEGRADED') {
    overallStatus = 'DEGRADED';
  }
  // If cache/queue is DOWN → overall DEGRADED (not DOWN)
  else if (cacheStatus.status === 'DOWN' || queueStatus.status === 'DOWN') {
    overallStatus = 'DEGRADED';
  }
  // If cache/queue is DEGRADED → overall DEGRADED
  else if (cacheStatus.status === 'DEGRADED' || queueStatus.status === 'DEGRADED') {
    overallStatus = 'DEGRADED';
  }
  
  return {
    status: overallStatus,
    timestamp,
    services: {
      api: apiStatus,
      db: dbStatus,
      cache: cacheStatus,
      queue: queueStatus,
    },
  };
}

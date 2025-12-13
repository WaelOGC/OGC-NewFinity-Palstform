// backend/src/middleware/adminDegradedMode.js

/**
 * Admin Degraded Mode Middleware
 * 
 * Adds X-Admin-Mode header to admin API responses to signal degraded mode.
 * Default: X-Admin-Mode: normal
 * If dependency errors occur, set: X-Admin-Mode: degraded
 * 
 * This middleware checks response status and error codes to determine if services are degraded.
 */

import pool from '../db.js';

// Track degraded mode state
let degradedModeState = {
  isDegraded: false,
  degradedServices: [],
  lastCheck: null,
};

// Check database health
async function checkDatabaseHealth() {
  try {
    await pool.query('SELECT 1 AS ok');
    return { healthy: true, service: 'database' };
  } catch (error) {
    return { healthy: false, service: 'database', error: error.message };
  }
}

// Periodic health check (every 30 seconds)
const HEALTH_CHECK_INTERVAL = 30000;
setInterval(async () => {
  const dbHealth = await checkDatabaseHealth();
  
  if (!dbHealth.healthy) {
    degradedModeState.isDegraded = true;
    if (!degradedModeState.degradedServices.includes('database')) {
      degradedModeState.degradedServices.push('database');
    }
  } else {
    degradedModeState.degradedServices = degradedModeState.degradedServices.filter(s => s !== 'database');
    if (degradedModeState.degradedServices.length === 0) {
      degradedModeState.isDegraded = false;
    }
  }
  degradedModeState.lastCheck = Date.now();
}, HEALTH_CHECK_INTERVAL);

// Initial health check
(async () => {
  const dbHealth = await checkDatabaseHealth();
  if (!dbHealth.healthy) {
    degradedModeState.isDegraded = true;
    degradedModeState.degradedServices.push('database');
  }
  degradedModeState.lastCheck = Date.now();
})();

/**
 * Middleware to add degraded mode header to admin responses
 * Also checks for dependency failures in error responses
 */
export function adminDegradedMode(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json to add header before sending
  res.json = function(data) {
    // Check if this is an error response indicating degraded mode
    if (data?.status === 'ERROR') {
      const degradedErrorCodes = [
        'DATABASE_ERROR',
        'EXTERNAL_SERVICE_ERROR',
        'SERVICE_UNAVAILABLE',
      ];
      
      if (degradedErrorCodes.includes(data.code)) {
        res.setHeader('X-Admin-Mode', 'degraded');
      } else {
        res.setHeader('X-Admin-Mode', degradedModeState.isDegraded ? 'degraded' : 'normal');
      }
    } else {
      // Success response - use current degraded mode state
      res.setHeader('X-Admin-Mode', degradedModeState.isDegraded ? 'degraded' : 'normal');
    }
    
    return originalJson(data);
  };
  
  next();
}

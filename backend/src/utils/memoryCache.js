// backend/src/utils/memoryCache.js

/**
 * Simple in-memory cache with TTL support
 * Lightweight, dependency-free cache for low-volume admin usage
 */

const cache = new Map();

/**
 * Cache entry structure: { value, expiresAt }
 */

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if not found/expired
 */
export function get(key) {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.value;
}

/**
 * Set a value in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlMs - Time to live in milliseconds
 */
export function set(key, value, ttlMs) {
  const expiresAt = Date.now() + ttlMs;
  cache.set(key, { value, expiresAt });
}

/**
 * Delete a key from cache
 * @param {string} key - Cache key to delete
 */
export function del(key) {
  cache.delete(key);
}

/**
 * Clear all cache entries
 */
export function clear() {
  cache.clear();
}

/**
 * Clean expired entries (optional cleanup utility)
 * Can be called periodically if needed
 */
export function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

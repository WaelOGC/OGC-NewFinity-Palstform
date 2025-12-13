/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag system for gating unfinished or partially implemented features.
 * When a flag is set to false, the feature should either be hidden entirely or show
 * a "Coming Soon" state instead of a broken/empty UI.
 * 
 * Usage:
 *   import { FEATURE_FLAGS } from '../config/featureFlags';
 *   if (FEATURE_FLAGS.WALLET) { ... }
 */

export const FEATURE_FLAGS = {
  // Wallet features - currently uses mock data
  WALLET: true,  // Enabled: Core user flow, keep visible
  
  // Download/Export features - placeholder implementation
  DOWNLOADS: false,
  
  // Challenge Program - preview/mock data only
  CHALLENGE_PROGRAM: true,  // Enabled: Core user flow, keep visible
  
  // Amy Agent Shell - mock/preview only
  AMY_AGENT: false,
  
  // Advanced profile features (KYC, badges, levels, integrations)
  ADVANCED_PROFILE: false,
  
  // Admin advanced features (beyond basic user management)
  ADMIN_ADVANCED: false,
};

/**
 * Helper function to check if a feature is enabled
 * @param {string} featureName - The name of the feature flag
 * @returns {boolean} - True if the feature is enabled
 */
export function isFeatureEnabled(featureName) {
  return FEATURE_FLAGS[featureName] === true;
}

/**
 * Helper function to get all enabled features
 * @returns {string[]} - Array of enabled feature names
 */
export function getEnabledFeatures() {
  return Object.keys(FEATURE_FLAGS).filter(key => FEATURE_FLAGS[key] === true);
}

/**
 * FeatureGate Component
 * 
 * A wrapper component that gates content based on feature flags.
 * If the feature is enabled, it renders the children.
 * If disabled, it renders a Coming Soon page.
 * 
 * Usage:
 *   <FeatureGate enabled={FEATURE_FLAGS.WALLET} featureName="Wallet">
 *     <WalletPage />
 *   </FeatureGate>
 */

import React from 'react';
import ComingSoon from '../pages/ComingSoon/index.jsx';

export default function FeatureGate({ enabled, featureName = 'This feature', children }) {
  if (enabled) {
    return <>{children}</>;
  }
  
  return <ComingSoon featureName={featureName} />;
}

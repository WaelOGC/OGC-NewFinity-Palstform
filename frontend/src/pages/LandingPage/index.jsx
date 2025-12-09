/**
 * OGC NewFinity Landing Page
 * 
 * Landing page with HeroSection and WhatIsSection components.
 */

import React from 'react';
import HeroSection from './HeroSection';
import WhatIsSection from './WhatIsSection';
import TokenEcosystemSection from './TokenEcosystemSection';
import ChallengeProgramSection from './ChallengeProgramSection';
import RoadmapSection from './RoadmapSection';
import CTASection from './CTASection';
import SocialFooterSection from './SocialFooterSection';
import './styles.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <WhatIsSection />
      <TokenEcosystemSection />
      <ChallengeProgramSection />
      <RoadmapSection />
      <CTASection />
      <SocialFooterSection />
    </div>
  );
}

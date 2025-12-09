import React from 'react';
import './styles.css';

export default function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-inner">
        <h2 className="cta-title">Build with OGC NewFinity</h2>
        <p className="cta-subtitle">
          Start designing, launching, and scaling AI and blockchain products on a unified plasma-fast infrastructure. Use our tools, documentation, and challenge programs to move from prototype to production.
        </p>
        <div className="cta-actions">
          <a href="/platform" className="btn-cta btn-cta--primary">Explore the Platform</a>
          <a href="/docs" className="btn-cta btn-cta--secondary">View Developer Docs</a>
        </div>
      </div>
    </section>
  );
}


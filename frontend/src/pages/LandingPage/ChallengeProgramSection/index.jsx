import React from 'react';
import './styles.css';

export default function ChallengeProgramSection() {
  return (
    <section className="challenge-section">
      <div className="challenge-container">
        {/* Header */}
        <div className="challenge-header">
          <div className="challenge-eyebrow">GLOBAL CHALLENGE PROGRAM</div>
          <h2 className="challenge-title">
            Build, validate, and scale with OGC NewFinity
          </h2>
          <p className="challenge-description">
            Join a global network of innovators building AI, blockchain, and sustainable solutions. 
            Access tools, mentorship, and compete for grants and ecosystem integration.
          </p>
        </div>

        {/* Process Steps - Compact Inline */}
        <div className="challenge-process">
          <div className="process-step">
            <span className="process-number">01</span>
            <span className="process-name">Apply</span>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <span className="process-number">02</span>
            <span className="process-name">Match</span>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <span className="process-number">03</span>
            <span className="process-name">Build</span>
          </div>
          <div className="process-arrow">→</div>
          <div className="process-step">
            <span className="process-number">04</span>
            <span className="process-name">Launch</span>
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="challenge-grid">
          <div className="grid-card">
            <div className="card-header">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                </svg>
              </div>
              <div className="card-label">EDUCATION</div>
            </div>
            <h3 className="card-title">School Track</h3>
            <p className="card-description">
              Ages 13–18. Explore AI, blockchain, and responsible innovation through guided challenges.
            </p>
            <div className="card-meta">
              <span className="meta-item">Target: Students</span>
              <span className="meta-item">Outcome: Innovation Skills</span>
            </div>
            <a href="/docs" className="card-cta">
              Join School Track →
            </a>
          </div>

          <div className="grid-card">
            <div className="card-header">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div className="card-label">INDEPENDENT</div>
            </div>
            <h3 className="card-title">Freelancer Track</h3>
            <p className="card-description">
              Solo builders prototype services and products using OGC tools and infrastructure.
            </p>
            <div className="card-meta">
              <span className="meta-item">Target: Creators</span>
              <span className="meta-item">Outcome: Product Launch</span>
            </div>
            <a href="/docs" className="card-cta">
              Join Freelancer Track →
            </a>
          </div>

          <div className="grid-card">
            <div className="card-header">
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div className="card-label">TEAMS</div>
            </div>
            <h3 className="card-title">Startup & Teams Track</h3>
            <p className="card-description">
              Early-stage teams validate, ship, and scale solutions within the OGC ecosystem.
            </p>
            <div className="card-meta">
              <span className="meta-item">Target: Startups</span>
              <span className="meta-item">Outcome: Scale & Growth</span>
            </div>
            <a href="/docs" className="card-cta">
              Join Teams Track →
            </a>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="challenge-footer">
          <a href="/docs" className="footer-cta-primary">
            Explore Full Program
          </a>
          <a href="/docs" className="footer-cta-secondary">
            View Eligibility & Rules
          </a>
        </div>
      </div>
    </section>
  );
}

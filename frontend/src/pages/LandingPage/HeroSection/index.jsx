import React, { useEffect, useRef } from 'react';
import './styles.css';

export default function HeroSection() {
  const coreRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!coreRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 20;
      coreRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="hero">
      <div className="hero-container">
        {/* Left Column - Content */}
        <div className="hero-left">
          <h2 className="hero-title">
            OGC NewFinity: AI Infrastructure on a Blockchain Core
          </h2>
          <p className="hero-description">
            OGC NewFinity is a plasma-fast digital ecosystem that fuses artificial intelligence, blockchain security, and tokenized incentives. Build, deploy, and scale intelligent products on a unified platform that turns every contribution into measurable value.
          </p>
          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="rgba(100, 150, 255, 0.6)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.1)"/>
                  <text x="12" y="16" textAnchor="middle" fontSize="10" fill="rgba(100, 150, 255, 0.9)" fontWeight="600">AI</text>
                </svg>
              </div>
              <span className="hero-feature-label">AI Automation</span>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" stroke="rgba(100, 150, 255, 0.6)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.1)"/>
                </svg>
              </div>
              <span className="hero-feature-label">Blockchain Security</span>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" stroke="rgba(100, 150, 255, 0.6)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.1)"/>
                  <circle cx="12" cy="12" r="4" fill="rgba(100, 150, 255, 0.3)"/>
                </svg>
              </div>
              <span className="hero-feature-label">Tokenized Incentives</span>
            </div>
          </div>
          <div className="hero-actions">
            <button className="hero-button hero-button-primary">
              Explore the Platform
            </button>
            <button className="hero-button hero-button-secondary">
              Download the Whitepaper
            </button>
          </div>
          <p className="hero-meta">
            Built for developers, creators, and organizations shaping the next wave of decentralized AI.
          </p>
        </div>

        {/* Right Column - Neutron Star Core Visual */}
        <div className="hero-right">
          <div className="neutron-core" ref={coreRef}>
            {/* Central Plasma Orb */}
            <div className="core-orb">
              <div className="core-orb-inner"></div>
              {/* OGC Mark */}
              <div className="ogc-mark">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="ogcGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(200, 220, 255, 0.95)" />
                      <stop offset="50%" stopColor="rgba(150, 200, 255, 0.9)" />
                      <stop offset="100%" stopColor="rgba(100, 150, 255, 0.85)" />
                    </linearGradient>
                    <linearGradient id="ogcGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(80, 130, 220, 0.95)" />
                      <stop offset="50%" stopColor="rgba(60, 110, 200, 0.9)" />
                      <stop offset="100%" stopColor="rgba(50, 100, 180, 0.85)" />
                    </linearGradient>
                  </defs>
                  <circle cx="30" cy="30" r="28" className="ogc-circle" opacity="0.9"/>
                  <text x="30" y="38" textAnchor="middle" fontSize="20" className="ogc-text" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">OGC</text>
                </svg>
              </div>
            </div>

            {/* Accretion Disk Ring */}
            <div className="core-ring"></div>

            {/* Blockchain Network Connector Lines */}
            <svg className="blockchain-connectors" width="400" height="400" style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'none', maxWidth: '100%', overflow: 'visible' }}>
              {/* Lines from center to icon positions (approximate) */}
              <line x1="200" y1="200" x2="350" y2="200" stroke="rgba(100, 150, 255, 0.15)" strokeWidth="1" />
              <line x1="200" y1="200" x2="200" y2="50" stroke="rgba(100, 150, 255, 0.15)" strokeWidth="1" />
              <line x1="200" y1="200" x2="50" y2="200" stroke="rgba(100, 150, 255, 0.15)" strokeWidth="1" />
              <line x1="200" y1="200" x2="200" y2="350" stroke="rgba(100, 150, 255, 0.15)" strokeWidth="1" />
            </svg>

            {/* Orbiting Icons */}
            <div className="orbit-icon ai">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="rgba(100, 150, 255, 0.7)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.15)"/>
                <path d="M8 9c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V9z" stroke="rgba(100, 150, 255, 0.6)" strokeWidth="1" fill="rgba(100, 150, 255, 0.2)"/>
                <circle cx="10" cy="11" r="0.8" fill="rgba(100, 150, 255, 0.7)"/>
                <circle cx="14" cy="11" r="0.8" fill="rgba(100, 150, 255, 0.7)"/>
                <text x="12" y="18" textAnchor="middle" fontSize="6" fill="rgba(100, 150, 255, 0.9)" fontWeight="700">AI</text>
              </svg>
            </div>
            <div className="orbit-icon blockchain">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" stroke="rgba(100, 150, 255, 0.7)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.15)"/>
                <path d="M12 8v8M8 12h8" stroke="rgba(100, 150, 255, 0.6)" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="orbit-icon token">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="rgba(100, 150, 255, 0.7)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.15)"/>
                <circle cx="12" cy="12" r="5" fill="rgba(100, 150, 255, 0.3)"/>
                <path d="M12 7v10M7 12h10" stroke="rgba(100, 150, 255, 0.5)" strokeWidth="0.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="orbit-icon ecosystem">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="3" stroke="rgba(100, 150, 255, 0.7)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.15)"/>
                <circle cx="6" cy="16" r="3" stroke="rgba(100, 150, 255, 0.7)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.15)"/>
                <circle cx="18" cy="16" r="3" stroke="rgba(100, 150, 255, 0.7)" strokeWidth="1.5" fill="rgba(100, 150, 255, 0.15)"/>
                <line x1="12" y1="11" x2="6" y2="13" stroke="rgba(100, 150, 255, 0.4)" strokeWidth="1"/>
                <line x1="12" y1="11" x2="18" y2="13" stroke="rgba(100, 150, 255, 0.4)" strokeWidth="1"/>
              </svg>
            </div>

            {/* Background Particles */}
            <div className="core-particle core-particle-1"></div>
            <div className="core-particle core-particle-2"></div>
            <div className="core-particle core-particle-3"></div>
            <div className="core-particle core-particle-4"></div>
            <div className="core-particle core-particle-5"></div>
            <div className="core-particle core-particle-6"></div>
            <div className="core-particle core-particle-7"></div>
            <div className="core-particle core-particle-8"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

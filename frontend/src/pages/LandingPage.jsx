/**
 * OGC NewFinity Landing Page
 * 
 * Framework: React SPA with Vite
 * Routing: React Router v6 (createBrowserRouter)
 * Styling: Standard CSS with CSS variables for theming
 * Theme: Dark/light mode toggle with localStorage persistence
 * 
 * This is the main landing page featuring:
 * - Hero section with AI/Blockchain themed visuals
 * - Ecosystem overview
 * - Challenge program information
 * - Horizontal interactive roadmap
 * - CTA sections
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../sections/HeroSection.jsx';
import SystemStatusBadge from '../components/SystemStatusBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/landing-page.css';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const cluster1Ref = useRef(null);
  const cluster2Ref = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      const moveX = (e.clientX / window.innerWidth - 0.5) * 20;
      const moveY = (e.clientY / window.innerHeight - 0.5) * 20;

      if (cluster1Ref.current) {
        cluster1Ref.current.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      }
      if (cluster2Ref.current) {
        cluster2Ref.current.style.transform = `translate3d(${-moveX * 0.7}px, ${-moveY * 0.7}px, 0)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="landing-root">
      {/* Futuristic Background Layer */}
      <div className="lp-bg-layer">
        <div className="fog fog-1"></div>
        <div className="fog fog-2"></div>
        <div className="fog fog-3"></div>
        <div className="neural-lines"></div>
        <div className="node-cluster cluster-1" ref={cluster1Ref}></div>
        <div className="node-cluster cluster-2" ref={cluster2Ref}></div>
        <div className="node-cluster cluster-3"></div>
        <div className="node-cluster cluster-4"></div>
        <div className="node-cluster cluster-5"></div>
      </div>

      <div className="landing-container">

        {/* Hero Section */}
        <section className="lp-section">
          <HeroSection />
        </section>

        {/* What is OGC NewFinity? */}
        <section className="lp-section content-section">
          <div className="glass-card">
            <h2>What is OGC NewFinity?</h2>
            <p>
              OGC NewFinity is a token-powered digital ecosystem that unifies AI productivity, blockchain infrastructure, and community governance. The platform connects users, creators, developers, and organizations through a single intelligent system powered by OGCFinity tokens.
            </p>
            <p>
              Built on four foundational layers—Infrastructure, Application, Community, and Economic—the platform delivers advanced AI tools, secure blockchain utilities, global innovation challenges, and transparent token economics.
            </p>
          </div>
        </section>

        {/* OGCFinity Token */}
        <section className="lp-section content-section">
          <div className="token-section-grid">
            <div className="glass-card">
              <h2>OGCFinity Token</h2>
              <p>
                OGCFinity operates through a two-phase evolution model. The <strong>Genesis Token</strong> runs on Polygon as a fixed-supply ERC-20 token (500,000,000 OGCFinity) with full platform utility.
              </p>
              <p>
                The future <strong>Native Token</strong> will operate on OGC Chain with governance-based supply adjustments, enabled through a secure 1:1 migration bridge. Tokens unlock premium AI features, reward contributions, fund innovation challenges, and enable governance participation.
              </p>
            </div>
            <div className="token-visual">
              <div className="dual-phase-visual">
                <div className="phase-circle phase-genesis">
                  <span className="phase-label">Genesis</span>
                  <span className="phase-sub">Polygon</span>
                </div>
                <div className="phase-arrow">→</div>
                <div className="phase-circle phase-native">
                  <span className="phase-label">Native</span>
                  <span className="phase-sub">OGC Chain</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Overview */}
        <section className="lp-section content-section">
          <h2>Ecosystem Overview</h2>
          <div className="ecosystem-grid">
            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-infrastructure"></div>
              <h3>Infrastructure Layer</h3>
              <p>Blockchain infrastructure, AI core, secure wallet systems, and robust security management.</p>
            </div>
            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-application"></div>
              <h3>Application Layer</h3>
              <p>AI tools and dashboards, challenge portals, developer SDKs, and marketplace integrations.</p>
            </div>
            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-community"></div>
              <h3>Community Layer</h3>
              <p>Challenge Program with three tracks, future DAO governance, and collaborative building initiatives.</p>
            </div>
            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-economic"></div>
              <h3>Economic Layer</h3>
              <p>OGCFinity token utility, token-gated features, Contribution-Based Mining, and the Innovation & Sustainability Challenge Fund.</p>
            </div>
          </div>
        </section>

        {/* Challenge Program */}
        <section className="lp-section content-section">
          <div className="glass-card challenge-card">
            <h2>The OGC NewFinity Challenge Program</h2>
            <p>
              A global initiative supporting innovators, creators, and builders across AI, sustainability, blockchain, and ethical digital solutions. Funded by the Innovation & Sustainability Challenge Fund (20% – 100,000,000 OGCFinity), the program offers three tracks:
            </p>
            <div className="challenge-tracks">
              <div className="track-pill">
                <strong>School Students</strong>
                <span>ages 13–18</span>
              </div>
              <div className="track-pill">
                <strong>Freelancers & Solo Innovators</strong>
                <span>ages 18+</span>
              </div>
              <div className="track-pill">
                <strong>Startup Teams & Groups</strong>
                <span>ages 18–35</span>
              </div>
            </div>
            <p className="challenge-footer">
              Winners receive OGCFinity grants, expert mentorship, platform access, and ecosystem integration.
            </p>
            <Link to="/docs" className="link-inline">Learn more in the documentation →</Link>
          </div>
        </section>

        {/* Roadmap Snapshot - Horizontal Interactive */}
        <section className="lp-section content-section">
          <div className="glass-card roadmap-card">
            <h2>Roadmap Summary</h2>
            <div className="roadmap-horizontal">
              <div className="roadmap-container">
                <div className="roadmap-item">
                  <div className="roadmap-quarter">Q1 2026</div>
                  <h3 className="roadmap-title">Genesis Deployment</h3>
                  <div className="roadmap-popover">
                    <p className="roadmap-popover-text">
                      OGCFinity Genesis Token on Polygon, wallet integration, core infrastructure deployment.
                    </p>
                  </div>
                </div>
                <div className="roadmap-item">
                  <div className="roadmap-quarter">Q2 2026</div>
                  <h3 className="roadmap-title">Core Platform</h3>
                  <div className="roadmap-popover">
                    <p className="roadmap-popover-text">
                      AI tools deployment, submission portal, token-gated utilities, subscription system launch.
                    </p>
                  </div>
                </div>
                <div className="roadmap-item">
                  <div className="roadmap-quarter">Q3 2026</div>
                  <h3 className="roadmap-title">Challenge Program</h3>
                  <div className="roadmap-popover">
                    <p className="roadmap-popover-text">
                      Three-track Challenge Program launch, grants distribution, mentorship programs activation.
                    </p>
                  </div>
                </div>
                <div className="roadmap-item">
                  <div className="roadmap-quarter">Q4 2026</div>
                  <h3 className="roadmap-title">Expansion</h3>
                  <div className="roadmap-popover">
                    <p className="roadmap-popover-text">
                      Developer SDKs, marketplace launch, OGC Vault, advanced AI integrations.
                    </p>
                  </div>
                </div>
                <div className="roadmap-item">
                  <div className="roadmap-quarter">Q1 2027</div>
                  <h3 className="roadmap-title">Governance</h3>
                  <div className="roadmap-popover">
                    <p className="roadmap-popover-text">
                      DAO components, governance voting infrastructure, community proposal system.
                    </p>
                  </div>
                </div>
                <div className="roadmap-item">
                  <div className="roadmap-quarter">Q2 2027</div>
                  <h3 className="roadmap-title">OGC Chain</h3>
                  <div className="roadmap-popover">
                    <p className="roadmap-popover-text">
                      OGC NewFinity blockchain research, Native Token deployment, full on-chain governance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="lp-section cta-section">
          <div className="glass-card cta-card">
            <h2>Ready to explore AI and blockchain innovation?</h2>
            <p>
              OGC NewFinity combines intelligent tools, transparent tokenomics, and global challenges to create a platform where every contribution matters. Whether you're building solutions, seeking funding, or exploring AI and blockchain, OGC NewFinity provides the infrastructure, community, and economic framework to support your work.
            </p>
            <div className="cta-buttons">
              <Link to="/download" className="btn-primary">
                <span className="btn-ripple"></span>
                Download Whitepaper
              </Link>
              <Link to="/community" className="btn-transparent">
                <span className="btn-ripple"></span>
                Join the Community
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center rounded-md border border-cyan-400/70 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/15"
                >
                  Open Dashboard
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Social Footer */}
        <section className="lp-section social-footer">
          <div className="social-footer-content">
            <h3>Join the OGC NewFinity community</h3>
            <p>Connect with builders, developers, and innovators shaping the future of AI and blockchain.</p>
            <div className="social-links">
              <a 
                href="https://x.com/OGCNewfinity" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Follow on X (Twitter)"
              >
                X
              </a>
              <a 
                href="https://www.linkedin.com/company/ogc-newfinity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Follow on LinkedIn"
              >
                LinkedIn
              </a>
              <a 
                href="https://github.com/OGC-NewFinity" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="View on GitHub"
              >
                GitHub
              </a>
              <a 
                href="https://discord.gg/d2H8XErY" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Join Discord"
              >
                Discord
              </a>
            </div>
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <SystemStatusBadge />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


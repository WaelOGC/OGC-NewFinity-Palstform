/**
 * Public Documentation Page
 * 
 * Public entry point for OGC NewFinity documentation, whitepaper, and resources.
 * This is a placeholder page that can be expanded later with actual documentation links.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css';

export default function PublicDocsPage() {
  return (
    <main className="landing-root">
      {/* Background Layer */}
      <div className="lp-bg-layer">
        <div className="fog fog-1"></div>
        <div className="fog fog-2"></div>
        <div className="fog fog-3"></div>
        <div className="neural-lines"></div>
      </div>

      <div className="landing-container" style={{ paddingTop: '100px' }}>
        <section className="lp-section content-section">
          <div className="glass-card">
            <h1>OGC NewFinity — Public Documentation</h1>
            <p>
              Welcome to the public documentation hub for the OGC NewFinity Platform. 
              This is your entry point for comprehensive information about the platform, 
              including technical specifications, token economics, architecture, and more.
            </p>
            <p>
              Our documentation is designed to provide clear, accessible information for 
              developers, users, contributors, and anyone interested in understanding how 
              OGC NewFinity works.
            </p>
          </div>
        </section>

        <section className="lp-section content-section">
          <h2>Documentation Sections</h2>
          <div className="ecosystem-grid">
            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-infrastructure"></div>
              <h3>Whitepaper</h3>
              <p>
                Comprehensive overview of the OGC NewFinity platform, including vision, 
                architecture, tokenomics, and roadmap. Download the full whitepaper for 
                detailed technical and economic specifications.
              </p>
            </div>

            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-application"></div>
              <h3>Token Overview</h3>
              <p>
                Learn about OGCFinity tokens, the two-phase evolution model (Genesis and Native), 
                utility functions, distribution, and how tokens power the platform ecosystem.
              </p>
            </div>

            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-community"></div>
              <h3>Platform Architecture</h3>
              <p>
                Technical documentation covering the four foundational layers: Infrastructure, 
                Application, Community, and Economic. Understand how the platform is built 
                and how components interact.
              </p>
            </div>

            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-economic"></div>
              <h3>FAQ</h3>
              <p>
                Frequently asked questions about OGC NewFinity, tokens, the Challenge Program, 
                platform features, and how to get started. Find answers to common questions 
                from the community.
              </p>
            </div>
          </div>
        </section>

        <section className="lp-section content-section">
          <div className="glass-card">
            <h2>Coming Soon</h2>
            <p>
              We're actively building out comprehensive documentation. Additional sections 
              will include developer guides, API references, integration tutorials, and 
              detailed technical specifications.
            </p>
            <p>
              For now, you can explore the platform overview on the <Link to="/" className="link-inline">homepage</Link> or 
              check out the <Link to="/dev-design" className="link-inline">Development & Design Hub</Link> for internal resources.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

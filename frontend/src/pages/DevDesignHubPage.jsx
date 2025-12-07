/**
 * Development & Design Hub Page
 * 
 * Internal navigation hub for platform phases, specs, designs, and development resources.
 * This page is used internally to navigate phases, specs, and designs.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css';

export default function DevDesignHubPage() {
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
            <h1>Development & Design Hub</h1>
            <p>
              Welcome to the internal Development & Design Hub for the OGC NewFinity Platform. 
              This page serves as a central navigation point for accessing platform phases, 
              specifications, design systems, and development resources.
            </p>
            <p>
              Use this hub to navigate between different phases of development, review design 
              specifications, access API documentation, and manage testing and QA resources.
            </p>
          </div>
        </section>

        <section className="lp-section content-section">
          <h2>Hub Sections</h2>
          <div className="ecosystem-grid">
            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-infrastructure"></div>
              <h3>Platform Phases & Specs</h3>
              <p>
                Navigate through different development phases, review architecture blueprints, 
                backend implementation specs, frontend integration plans, and phase-specific 
                documentation. Access detailed specifications for each platform component.
              </p>
            </div>

            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-application"></div>
              <h3>UI/UX Design System</h3>
              <p>
                Access the design system documentation including component libraries, spacing 
                guidelines, typography scales, color palettes, and interaction patterns. 
                Review design mockups and style guides for consistent implementation.
              </p>
            </div>

            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-community"></div>
              <h3>APIs & Integration</h3>
              <p>
                Developer resources for API endpoints, authentication flows, SDK documentation, 
                integration guides, and example code. Find everything needed to integrate with 
                the OGC NewFinity platform.
              </p>
            </div>

            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-economic"></div>
              <h3>Testing & QA</h3>
              <p>
                Testing documentation, QA checklists, test case repositories, deployment guides, 
                and quality assurance resources. Access testing environments and validation tools.
              </p>
            </div>
          </div>
        </section>

        <section className="lp-section content-section">
          <div className="glass-card">
            <h2>Quick Access</h2>
            <p>
              These sections are currently placeholders and will be wired up with actual 
              navigation and content as development progresses. Each section will provide 
              direct access to relevant documentation, tools, and resources.
            </p>
            <p>
              For public-facing information, visit the <Link to="/docs" className="link-inline">Public Documentation</Link> page 
              or return to the <Link to="/" className="link-inline">homepage</Link>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

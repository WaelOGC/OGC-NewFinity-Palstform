/**
 * Dev & Design Hub Page
 * 
 * Public hub for frontend/UI guidelines, component library, backend/API diagrams,
 * and contribution guidelines. Styled consistently with the landing page.
 */

import React from 'react';
import '../../styles/landing-page.css';
import './styles.css';

export default function DevDesignPage() {
  return (
    <main className="landing-root">
      {/* Futuristic Background Layer */}
      <div className="lp-bg-layer">
        <div className="fog fog-1"></div>
        <div className="fog fog-2"></div>
        <div className="fog fog-3"></div>
        <div className="neural-lines"></div>
      </div>

      <div className="landing-container" style={{ paddingTop: '100px' }}>
        <section className="lp-section content-section">
          <div className="glass-card">
            <h1>Dev & Design Hub</h1>
            <p>
              Welcome to the Dev & Design Hub for OGC NewFinity. This is the central resource 
              for developers and designers working on the platform.
            </p>
            <p>
              This hub provides access to:
            </p>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: '16px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <li style={{ paddingLeft: '20px', position: 'relative' }}>
                <span style={{ 
                  position: 'absolute',
                  left: 0,
                  color: 'var(--brand-color-2)'
                }}>→</span>
                Frontend/UI guidelines and design system
              </li>
              <li style={{ paddingLeft: '20px', position: 'relative' }}>
                <span style={{ 
                  position: 'absolute',
                  left: 0,
                  color: 'var(--brand-color-2)'
                }}>→</span>
                Component library & layout specifications
              </li>
              <li style={{ paddingLeft: '20px', position: 'relative' }}>
                <span style={{ 
                  position: 'absolute',
                  left: 0,
                  color: 'var(--brand-color-2)'
                }}>→</span>
                Backend/API diagrams & flows
              </li>
              <li style={{ paddingLeft: '20px', position: 'relative' }}>
                <span style={{ 
                  position: 'absolute',
                  left: 0,
                  color: 'var(--brand-color-2)'
                }}>→</span>
                Contribution guidelines and development workflows
              </li>
            </ul>
          </div>
        </section>

        <section className="lp-section content-section">
          <div className="ecosystem-grid">
            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-application"></div>
              <h3>Frontend & Design System</h3>
              <p>
                Comprehensive guidelines for frontend development, including component patterns, 
                styling conventions, responsive design principles, and accessibility standards. 
                Access the design system documentation and reusable UI components.
              </p>
            </div>

            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-infrastructure"></div>
              <h3>Backend Architecture & APIs</h3>
              <p>
                Technical documentation covering backend architecture, API endpoints, database 
                schemas, authentication flows, and integration patterns. Review system diagrams 
                and API reference documentation.
              </p>
            </div>

            <div className="ecosystem-card glass-card">
              <div className="card-icon icon-community"></div>
              <h3>Component Library & Reusable Layouts</h3>
              <p>
                Browse the component library with live examples, usage guidelines, and code 
                snippets. Access reusable layout templates and design tokens for consistent 
                implementation across the platform.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

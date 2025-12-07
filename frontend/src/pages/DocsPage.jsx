/**
 * OGC NewFinity Documentation Page
 * 
 * Public documentation overview page with placeholder content.
 * Styled consistently with the landing page using glass cards and dark gradient background.
 */

import React from 'react';
import '../styles/landing-page.css';

export default function DocsPage() {
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
            <h1>OGC NewFinity Documentation</h1>
            <p>
              Welcome to the OGC NewFinity documentation hub. This is your comprehensive guide 
              to understanding the platform, its architecture, tokenomics, and how to get started 
              building on OGC NewFinity.
            </p>
            <p>
              Our documentation is currently under active development. We're continuously expanding 
              content to provide detailed information for developers, users, and contributors.
            </p>
          </div>
        </section>

        <section className="lp-section content-section">
          <div className="glass-card">
            <h2>Documentation Sections</h2>
            <p>
              The following sections will be expanded in future iterations:
            </p>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: '24px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <li style={{ 
                padding: '12px 0',
                borderBottom: '1px solid rgba(0, 255, 198, 0.1)'
              }}>
                <strong style={{ color: 'var(--brand-color-2)' }}>Platform Overview</strong>
                <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
                  Comprehensive introduction to OGC NewFinity, its vision, and core concepts.
                </p>
              </li>
              <li style={{ 
                padding: '12px 0',
                borderBottom: '1px solid rgba(0, 255, 198, 0.1)'
              }}>
                <strong style={{ color: 'var(--brand-color-2)' }}>API Reference</strong>
                <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
                  Complete API documentation for integrating with OGC NewFinity services.
                </p>
              </li>
              <li style={{ 
                padding: '12px 0',
                borderBottom: '1px solid rgba(0, 255, 198, 0.1)'
              }}>
                <strong style={{ color: 'var(--brand-color-2)' }}>Challenge Program Guide</strong>
                <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
                  Detailed guide to participating in the OGC NewFinity Challenge Program.
                </p>
              </li>
              <li style={{ 
                padding: '12px 0'
              }}>
                <strong style={{ color: 'var(--brand-color-2)' }}>Token & Economics</strong>
                <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '0.95rem' }}>
                  Deep dive into OGCFinity token mechanics, distribution, and economic model.
                </p>
              </li>
            </ul>
            <p style={{ 
              marginTop: '32px', 
              padding: '16px',
              background: 'rgba(0, 255, 198, 0.05)',
              border: '1px solid rgba(0, 255, 198, 0.2)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              opacity: 0.9
            }}>
              <strong>Beta docs</strong> — Content will be expanded in future iterations.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

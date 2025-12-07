/**
 * Download Page - Static document download page
 * 
 * Displays available documents (whitepaper, documentation) for download.
 * Currently uses static/placeholder data - backend integration TODO.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing-page.css';

export default function DownloadPage() {

  // Static document data - TODO: Replace with API call
  const documents = [
    {
      id: 1,
      name: 'OGC NewFinity Whitepaper',
      version: '2.0',
      size: '4.2 MB',
      lastUpdated: '2026-01-15',
      description: 'Complete technical documentation of the OGC NewFinity platform, tokenomics, and ecosystem architecture.'
    },
    {
      id: 2,
      name: 'Platform Documentation',
      version: '1.5',
      size: '2.8 MB',
      lastUpdated: '2026-01-10',
      description: 'Developer guide and API documentation for building on the OGC NewFinity platform.'
    },
    {
      id: 3,
      name: 'Challenge Program Guide',
      version: '1.0',
      size: '1.5 MB',
      lastUpdated: '2026-01-05',
      description: 'Complete guide to participating in the OGC NewFinity Challenge Program.'
    }
  ];

  const handleDownload = (doc) => {
    // TODO: Implement actual download logic
    // Placeholder: In production, this would trigger a file download
    // window.open(`/api/downloads/${doc.id}`, '_blank');
  };

  return (
    <main className="landing-root">
      <div className="lp-bg-layer">
        <div className="fog fog-1"></div>
        <div className="fog fog-2"></div>
        <div className="fog fog-3"></div>
        <div className="neural-lines"></div>
      </div>

      <div className="landing-container">
        <div style={{ paddingTop: '80px' }}>
          <Link to="/" className="btn-transparent" style={{ marginBottom: '32px', display: 'inline-block' }}>
            ← Back to Home
          </Link>

          <section className="lp-section content-section">
            <div className="glass-card">
              <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '16px' }}>
                Download Resources
              </h1>
              <p style={{ fontSize: '1.1rem', marginBottom: '40px', opacity: 0.9 }}>
                Access whitepapers, documentation, and guides for the OGC NewFinity platform.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="glass-card"
                    style={{
                      padding: '32px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                          {doc.name}
                        </h3>
                        <p style={{ fontSize: '0.95rem', margin: '0 0 12px', opacity: 0.8, lineHeight: 1.6 }}>
                          {doc.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', opacity: 0.7 }}>
                          <span>Version: {doc.version}</span>
                          <span>Size: {doc.size}</span>
                          <span>Updated: {doc.lastUpdated}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="btn-primary"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '40px', padding: '24px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                  <strong>Note:</strong> Downloads are currently in development. Files will be available soon.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}


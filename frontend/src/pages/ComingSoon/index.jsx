/**
 * Coming Soon Page Component
 * 
 * A reusable "Coming Soon" page for gated features within the dashboard.
 * This is a simpler version than the standalone ComingSoonPage, designed
 * to fit within the dashboard layout.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

export default function ComingSoon({ featureName = 'This feature' }) {
  const navigate = useNavigate();

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        
        <h1 className="coming-soon-title">Coming Soon</h1>
        
        <p className="coming-soon-description">
          {featureName} is under active development. We're working hard to bring you
          this feature and will make it available as soon as it's ready.
        </p>
        
        <p className="coming-soon-subtext">
          Thank you for your patience and interest in the OGC NewFinity Platform.
        </p>
        
        <button
          className="coming-soon-button"
          onClick={() => navigate('/dashboard/overview')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

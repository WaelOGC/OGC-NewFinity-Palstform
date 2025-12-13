import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FEATURE_FLAGS } from '../../config/featureFlags.js';
import '../../index.css';
import './dashboard-pages.css';

export default function Overview() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  // Get user display name for account summary
  const accountName = user?.displayName || user?.fullName || user?.username || 'FF Collective';
  const accountEmail = user?.email || 'musicaipedia7@gmail.com';

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1>Overview</h1>
        <p>
          Welcome to your OGC hub. This area will surface your tokens, activity,
          agent tools, and challenge program status.
        </p>
      </div>

      {/* Top summary strip */}
      <div className="overview-summary-strip">
        <div className="overview-summary-item">
          <span className="label">Account</span>
          <span className="value">{accountName}</span>
          <span className="sub">{accountEmail}</span>
        </div>
        <div className="overview-summary-item">
          <span className="label">Membership</span>
          <span className="value">Developer preview</span>
          <span className="sub">OGC NewFinity Genesis</span>
        </div>
        <div className="overview-summary-item">
          <span className="label">Theme</span>
          <span className="value">
            {isDark ? 'Dark mode' : 'Light mode'}
          </span>
          <span className="sub">Synced with dashboard header</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="overview-grid">
        <div className="overview-grid-main">
          {/* Quick access cards */}
          <div className="overview-quick-grid">
            {/* Wallet card - always visible */}
            <button
              type="button"
              className="overview-card overview-card--primary"
              onClick={() => navigate('/dashboard/wallet')}
            >
              <div className="overview-card-header">
                <span className="title">Wallet</span>
                {FEATURE_FLAGS.WALLET ? (
                  <span className="tag tag--live">Live</span>
                ) : (
                  <span className="tag">Coming Soon</span>
                )}
              </div>
              <p className="overview-card-text">
                View your OGCFinity balance, staking preview, rewards, and recent transactions.
              </p>
              <span className="overview-card-cta">Open wallet →</span>
            </button>

            {/* Amy Agent card - always visible */}
            <button
              type="button"
              className="overview-card overview-card--secondary"
              onClick={() => navigate('/amy')}
            >
              <div className="overview-card-header">
                <span className="title">Amy Agent</span>
                {FEATURE_FLAGS.AMY_AGENT ? (
                  <span className="tag">Preview</span>
                ) : (
                  <span className="tag">Coming Soon</span>
                )}
              </div>
              <p className="overview-card-text">
                Central AI workspace for writing, coding, research, and automation. Opens in a dedicated
                Amy interface.
              </p>
              <span className="overview-card-cta">Open Amy →</span>
            </button>

            {/* Challenge Program card - always visible */}
            <button
              type="button"
              className="overview-card overview-card--secondary"
              onClick={() => navigate('/dashboard/challenge')}
            >
              <div className="overview-card-header">
                <span className="title">Challenge Program</span>
                {FEATURE_FLAGS.CHALLENGE_PROGRAM ? (
                  <span className="tag">Preview</span>
                ) : (
                  <span className="tag">Coming Soon</span>
                )}
              </div>
              <p className="overview-card-text">
                Participate in the OGC NewFinity Challenge tracks for students, teams, and
                freelancers. Rewards and badges will appear here.
              </p>
              <span className="overview-card-cta">Open challenge hub →</span>
            </button>
          </div>

          {/* Activity snapshot */}
          <div className="overview-card overview-activity-card">
            <div className="overview-card-header">
              <span className="title">Activity snapshot</span>
              <span className="badge-small">Mock data</span>
            </div>
            <div className="overview-activity-grid">
              <div className="overview-activity-item">
                <span className="label">Last login</span>
                <span className="value">Dec 11, 2025 · 11:59 PM</span>
                <span className="sub">From trusted device</span>
              </div>
              <div className="overview-activity-item">
                <span className="label">Security status</span>
                <span className="value">Baseline</span>
                <span className="sub">2FA disabled · no alerts</span>
              </div>
              <div className="overview-activity-item">
                <span className="label">Wallet preview</span>
                <span className="value">1,234.56 OGC</span>
                <span className="sub">Staking engine in preview</span>
              </div>
            </div>
            <p className="overview-footnote">
              All numbers on this page are mock values for design and UX testing only.
            </p>
          </div>
        </div>

        {/* Right-side slim column for later widgets (keep simple for now) */}
        <div className="overview-grid-side">
          <div className="overview-card overview-side-card">
            <div className="overview-card-header">
              <span className="title">What's next</span>
            </div>
            <ul className="overview-next-list">
              <li>Complete your profile details.</li>
              <li>Review security settings and enable 2FA (future).</li>
              <li>Explore the wallet preview and staking flow.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


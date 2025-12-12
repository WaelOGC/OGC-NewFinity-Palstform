import React, { useEffect, useState } from 'react';
import {
  getChallengeOverview,
  getChallengeTracks,
  getChallengeTimeline,
} from '../../utils/apiClient';
import './dashboard-pages.css';

export default function ChallengePage() {
  const [overview, setOverview] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [ov, tr, tl] = await Promise.all([
          getChallengeOverview(),
          getChallengeTracks(),
          getChallengeTimeline(),
        ]);
        if (!isMounted) return;
        setOverview(ov);
        setTracks(tr);
        setTimeline(tl);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load challenge data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1>Challenge Program</h1>
        <p>
          This is the OGC NewFinity Challenge hub. In future phases this area will manage
          registration, submissions, rewards, and badges for all tracks.
        </p>
      </div>

      {error && (
        <div className="wallet-alert wallet-alert--warning" style={{ marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Top summary */}
      <div className="challenge-summary-strip">
        <div className="challenge-summary-item">
          <span className="label">Season</span>
          <span className="value">{overview?.season || '2025–2026'}</span>
          <span className="sub">Program timeframe (mock)</span>
        </div>
        <div className="challenge-summary-item">
          <span className="label">Program status</span>
          <span className="value">{overview?.status || 'Preview'}</span>
          <span className="sub">{overview?.registrationStatus || 'Registration not open yet'}</span>
        </div>
        <div className="challenge-summary-item">
          <span className="label">Tracks</span>
          <span className="value">{overview?.totalTracks || tracks.length || 3}</span>
          <span className="sub">Student · Team · Freelancer</span>
        </div>
        <div className="challenge-summary-item">
          <span className="label">Your status</span>
          <span className="value">{overview?.userEnrollmentStatus || 'Not enrolled'}</span>
          <span className="sub">Participation engine will be added later</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="challenge-grid">
        <div className="challenge-grid-main">
          {/* Tracks */}
          <div className="challenge-card challenge-card--tracks">
            <div className="challenge-card-header">
              <span className="title">Challenge tracks</span>
              <span className="badge-small">Preview only</span>
            </div>

            {loading && <p className="challenge-muted">Loading tracks…</p>}

            {!loading && (
              <div className="challenge-tracks-grid">
                {tracks.map((track) => (
                  <div key={track.id} className="challenge-track-card">
                    <div className="challenge-track-header">
                      <span className="name">{track.name}</span>
                      <span className="track-status">{track.status}</span>
                    </div>
                    <div className="challenge-track-meta">
                      <span className="label">Level</span>
                      <span className="value">{track.level}</span>
                    </div>
                    <p className="challenge-track-text">{track.focus}</p>
                    <p className="challenge-track-rewards">
                      <span className="label">Rewards</span>
                      <span className="value">{track.rewardsSummary}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="challenge-footnote">
              Track details, milestones, and scoring rules will be added as the program
              specification is finalized.
            </p>
          </div>

          {/* Timeline */}
          <div className="challenge-card challenge-card--timeline">
            <div className="challenge-card-header">
              <span className="title">Program timeline</span>
              <span className="badge-small">Mock</span>
            </div>
            {loading && <p className="challenge-muted">Loading timeline…</p>}
            {!loading && (
              <ul className="challenge-timeline-list">
                {timeline.map((entry) => (
                  <li key={entry.id} className={`timeline-item timeline-item--${entry.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="title-row">
                      <span className="label">{entry.label}</span>
                      <span className="status">{entry.status}</span>
                    </div>
                    <span className="period">{entry.period}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Side card */}
        <div className="challenge-grid-side">
          <div className="challenge-card challenge-side-card">
            <div className="challenge-card-header">
              <span className="title">How this will work</span>
            </div>
            <ul className="challenge-next-list">
              <li>Each track defines its own missions and submission formats.</li>
              <li>Participants can earn OGCFinity rewards, badges, and long-term roles.</li>
              <li>
                This dashboard will later show registration, progress, and final results for
                your team or profile.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

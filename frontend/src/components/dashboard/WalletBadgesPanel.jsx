import React from 'react';

function formatScore(score) {
  return Number(score || 0).toLocaleString();
}

export default function WalletBadgesPanel({ data, loading, error, variant = 'panel' }) {
  const isBanner = variant === 'banner';

  return (
    <div className={isBanner ? 'wallet-badges-banner' : 'wallet-badges-panel'}>
      <div className="wallet-badges-header">
        <span className="wallet-badges-title">Wallet status</span>
        {data && (
          <span className="wallet-badges-tier">
            {data.stakingTier} tier · {data.rewardsLevel}
          </span>
        )}
      </div>

      {loading && <p className="wallet-card-muted">Loading wallet status…</p>}

      {error && !loading && (
        <div className="wallet-alert wallet-alert--warning">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {!isBanner && (
            <div className="wallet-badges-summary">
              <div className="wallet-badges-score">
                <span className="label">Contribution score</span>
                <span className="value">{formatScore(data.contributionScore)}</span>
              </div>
            </div>
          )}

          <div className="wallet-badges-chips">
            {data.badges.map((badge) => (
              <div
                key={badge.key}
                className={
                  'wallet-badge-chip' +
                  (badge.earned ? ' wallet-badge-chip--earned' : ' wallet-badge-chip--locked')
                }
              >
                <span className="dot" />
                <span className="label">{badge.label}</span>
                {!badge.earned && <span className="tag">coming soon</span>}
              </div>
            ))}
          </div>

          {isBanner && (
            <div className="wallet-badges-score wallet-badges-score--inline">
              <span className="label">Contribution score</span>
              <span className="value">{formatScore(data.contributionScore)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

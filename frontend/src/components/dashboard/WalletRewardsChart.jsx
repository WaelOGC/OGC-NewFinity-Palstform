import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function formatDateLabel(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

export default function WalletRewardsChart({
  events,
  upcoming,
  summary,
  range,
  loading,
  error,
  onRangeChange,
}) {
  return (
    <div className="ogc-dashboard-card wallet-card wallet-card--rewards">
      <div className="wallet-card-header">
        <h2 className="ogc-dashboard-card-title">Rewards Timeline</h2>
        <div className="wallet-rewards-range-toggle">
          {['7d', '30d'].map((option) => (
            <button
              key={option}
              type="button"
              className={
                'wallet-rewards-range-btn' +
                (range === option ? ' wallet-rewards-range-btn--active' : '')
              }
              onClick={() => onRangeChange(option)}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="wallet-card-muted">Loading rewards…</p>
      )}

      {error && !loading && (
        <div className="wallet-alert wallet-alert--warning">
          {error}
        </div>
      )}

      {!loading && !error && (!events || events.length === 0) && (
        <p className="wallet-card-muted">
          No rewards yet. Once your staking starts generating returns, the rewards timeline will appear here.
        </p>
      )}

      {!loading && !error && events && events.length > 0 && (
        <>
          <div className="wallet-rewards-chart-wrapper">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={events} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={formatNumber}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'amount') {
                      return [`${formatNumber(value)} OGCFinity`, 'Reward'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(value) => {
                    const d = new Date(value);
                    return Number.isNaN(d.getTime())
                      ? value
                      : d.toLocaleString();
                  }}
                />
                <Bar
                  dataKey="amount"
                  barSize={14}
                  radius={[6, 6, 0, 0]}
                  fill="rgba(0, 255, 198, 0.9)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="wallet-rewards-summary">
            {upcoming && (
              <div className="wallet-rewards-summary-item">
                <span className="label">Next payout</span>
                <span className="value">
                  {new Date(upcoming.date).toLocaleString()}
                </span>
                <span className="value-small">
                  ~{formatNumber(upcoming.estimatedReward)} OGCFinity
                </span>
              </div>
            )}

            {summary && (
              <>
                <div className="wallet-rewards-summary-item">
                  <span className="label">Total rewards ({summary.range})</span>
                  <span className="value">
                    {formatNumber(summary.totalRewards)} OGCFinity
                  </span>
                </div>
                <div className="wallet-rewards-summary-item">
                  <span className="label">Payouts count</span>
                  <span className="value">
                    {summary.count}
                  </span>
                </div>
              </>
            )}
          </div>

          <p className="wallet-card-footnote">
            Rewards data is mock-only. Real on-chain rewards integration will be enabled in a later phase.
          </p>
        </>
      )}
    </div>
  );
}

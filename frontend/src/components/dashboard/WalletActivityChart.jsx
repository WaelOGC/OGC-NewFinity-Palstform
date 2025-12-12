import React from 'react';
import {
  LineChart,
  Line,
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

export default function WalletActivityChart({ data, loading, error, summary, range, onRangeChange }) {
  return (
    <div className="ogc-dashboard-card wallet-card wallet-card--activity">
      <div className="wallet-card-header">
        <h2 className="ogc-dashboard-card-title">Wallet Activity</h2>
        <div className="wallet-activity-range-toggle">
          {['7d', '30d'].map((option) => (
            <button
              key={option}
              type="button"
              className={
                'wallet-activity-range-btn' +
                (range === option ? ' wallet-activity-range-btn--active' : '')
              }
              onClick={() => onRangeChange(option)}
            >
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="wallet-card-muted">Loading activity…</p>
      )}

      {error && !loading && (
        <div className="wallet-alert wallet-alert--warning">
          {error}
        </div>
      )}

      {!loading && !error && (!data || data.length === 0) && (
        <p className="wallet-card-muted">No activity yet. Your first OGCFinity movements will show up here.</p>
      )}

      {!loading && !error && data && data.length > 0 && (
        <>
          <div className="wallet-activity-chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'balance') {
                      return [`${formatNumber(value)} OGCFinity`, 'Balance'];
                    }
                    if (name === 'netChange') {
                      return [`${formatNumber(value)} OGCFinity`, 'Net change'];
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
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="rgba(0, 255, 198, 0.9)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {summary && (
            <div className="wallet-activity-summary">
              <div className="wallet-activity-summary-item">
                <span className="label">Inflow</span>
                <span className="value">+{formatNumber(summary.totalInflow)} OGCFinity</span>
              </div>
              <div className="wallet-activity-summary-item">
                <span className="label">Outflow</span>
                <span className="value">-{formatNumber(summary.totalOutflow)} OGCFinity</span>
              </div>
              <div className="wallet-activity-summary-item">
                <span className="label">Net change</span>
                <span className={`value ${summary.netChange >= 0 ? 'positive' : 'negative'}`}>
                  {summary.netChange >= 0 ? '+' : ''}
                  {formatNumber(summary.netChange)} OGCFinity
                </span>
              </div>
              <div className="wallet-activity-summary-item">
                <span className="label">Top activity</span>
                <span className="value">
                  {summary.topActivityType || '—'}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

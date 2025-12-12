import React, { useEffect, useState } from 'react';
import "../../index.css";
import "./dashboard-pages.css";
import { getWalletSummary, getWalletTransactions, getStakingSummary, getStakingPreview, getWalletOverview, getWalletActivity, getRewardsTimeline, getWalletBadges } from '../../utils/apiClient';
import WalletActivityChart from '../../components/dashboard/WalletActivityChart';
import WalletRewardsChart from '../../components/dashboard/WalletRewardsChart';
import WalletBadgesPanel from '../../components/dashboard/WalletBadgesPanel';

function WalletPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transaction state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState(null);
  const [txPagination, setTxPagination] = useState({ total: 0, limit: 10, offset: 0 });

  // Wallet Overview state (Phase W2.6)
  const [walletOverview, setWalletOverview] = useState(null);
  const [walletOverviewLoading, setWalletOverviewLoading] = useState(false);
  const [walletOverviewError, setWalletOverviewError] = useState(null);

  // Wallet Activity state (Phase W2.7)
  const [activityData, setActivityData] = useState([]);
  const [activitySummary, setActivitySummary] = useState(null);
  const [activityRange, setActivityRange] = useState('30d');
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(null);

  // Staking state
  const [staking, setStaking] = useState(null);
  const [stakingLoading, setStakingLoading] = useState(true);
  const [stakingError, setStakingError] = useState(null);

  // Rewards Timeline state (Phase W2.8)
  const [rewardsEvents, setRewardsEvents] = useState([]);
  const [rewardsUpcoming, setRewardsUpcoming] = useState(null);
  const [rewardsSummary, setRewardsSummary] = useState(null);
  const [rewardsRange, setRewardsRange] = useState('30d');
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardsError, setRewardsError] = useState(null);

  // Wallet Badges state (Phase W2.9)
  const [walletBadges, setWalletBadges] = useState(null);
  const [walletBadgesLoading, setWalletBadgesLoading] = useState(false);
  const [walletBadgesError, setWalletBadgesError] = useState(null);

  // Preview panel state
  const [stakePanelOpen, setStakePanelOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakePreview, setStakePreview] = useState(null);
  const [stakePreviewLoading, setStakePreviewLoading] = useState(false);
  const [stakePreviewError, setStakePreviewError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const result = await getWalletSummary();
        if (isMounted) {
          setSummary(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load wallet summary.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load transactions
  useEffect(() => {
    let isMounted = true;

    async function loadTransactions() {
      setTxLoading(true);
      setTxError(null);
      try {
        const { items, pagination } = await getWalletTransactions({ limit: 10, offset: 0 });
        if (isMounted) {
          setTransactions(items);
          setTxPagination(pagination);
        }
      } catch (err) {
        if (isMounted) {
          setTxError(err?.message || 'Failed to load wallet transactions.');
        }
      } finally {
        if (isMounted) {
          setTxLoading(false);
        }
      }
    }

    loadTransactions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load wallet overview (Phase W2.6)
  useEffect(() => {
    let isMounted = true;

    async function fetchOverview() {
      try {
        setWalletOverviewLoading(true);
        setWalletOverviewError(null);

        const data = await getWalletOverview();

        if (!isMounted) return;

        setWalletOverview(data);
      } catch (err) {
        if (!isMounted) return;
        setWalletOverviewError(err.message || 'Failed to load wallet overview');
      } finally {
        if (isMounted) {
          setWalletOverviewLoading(false);
        }
      }
    }

    fetchOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load wallet activity (Phase W2.7)
  useEffect(() => {
    let isMounted = true;

    async function fetchActivity() {
      try {
        setActivityLoading(true);
        setActivityError(null);

        const result = await getWalletActivity(activityRange);

        if (!isMounted) return;

        setActivityData(result.timeseries || []);
        setActivitySummary(result.summary || null);
      } catch (err) {
        if (!isMounted) return;
        setActivityError(err.message || 'Failed to load wallet activity');
      } finally {
        if (isMounted) {
          setActivityLoading(false);
        }
      }
    }

    fetchActivity();

    return () => {
      isMounted = false;
    };
  }, [activityRange]);

  // Load staking summary
  useEffect(() => {
    let isMounted = true;

    async function loadStaking() {
      setStakingLoading(true);
      setStakingError(null);
      try {
        const summary = await getStakingSummary();
        if (isMounted) {
          setStaking(summary);
        }
      } catch (err) {
        if (isMounted) {
          setStakingError(err?.message || 'Failed to load staking summary.');
        }
      } finally {
        if (isMounted) {
          setStakingLoading(false);
        }
      }
    }

    loadStaking();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load rewards timeline (Phase W2.8)
  useEffect(() => {
    let isMounted = true;

    async function fetchRewardsTimeline() {
      try {
        setRewardsLoading(true);
        setRewardsError(null);

        const data = await getRewardsTimeline(rewardsRange);

        if (!isMounted) return;

        setRewardsEvents(data.events || []);
        setRewardsUpcoming(data.upcoming || null);
        setRewardsSummary(data.summary || null);
      } catch (err) {
        if (!isMounted) return;
        setRewardsError(err.message || 'Failed to load rewards timeline');
      } finally {
        if (isMounted) {
          setRewardsLoading(false);
        }
      }
    }

    fetchRewardsTimeline();

    return () => {
      isMounted = false;
    };
  }, [rewardsRange]);

  // Load wallet badges (Phase W2.9)
  useEffect(() => {
    let isMounted = true;

    async function fetchBadges() {
      try {
        setWalletBadgesLoading(true);
        setWalletBadgesError(null);

        const data = await getWalletBadges();
        if (!isMounted) return;
        setWalletBadges(data);
      } catch (err) {
        if (!isMounted) return;
        setWalletBadgesError(err.message || 'Failed to load wallet status');
      } finally {
        if (isMounted) {
          setWalletBadgesLoading(false);
        }
      }
    }

    fetchBadges();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute values from summary with safe defaults
  const totalBalance = summary?.mainBalance ?? 0; // mainBalance from backend is the total OGC balance
  const lockedBalance = summary?.lockedBalance ?? 0;
  const pendingRewards = summary?.pendingRewards ?? 0;
  const availableBalance = totalBalance - lockedBalance - pendingRewards; // Available = Total - Locked - Pending
  const estimatedUsdValue = summary?.estimatedUsdValue ?? 0;
  const lastUpdated = summary?.lastUpdated || null;

  // Build balances array from summary data
  const balances = [
    { label: "Main Wallet (OGC)", amount: availableBalance, status: "Available", badge: "available" },
    { label: "Locked / Staked", amount: lockedBalance, status: "Locked", badge: "locked" },
    { label: "Pending Rewards", amount: pendingRewards, status: "Coming soon", badge: "pending" },
  ];
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Format last updated timestamp
  const formatLastUpdated = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return formatDate(dateString);
  };

  // Get badge class for status
  const getBadgeClass = (badge) => {
    const classes = {
      available: { bg: "rgba(34, 197, 94, 0.2)", border: "rgba(34, 197, 94, 0.4)", color: "#86efac" },
      locked: { bg: "rgba(148, 163, 184, 0.2)", border: "rgba(148, 163, 184, 0.4)", color: "#cbd5e1" },
      pending: { bg: "rgba(251, 191, 36, 0.2)", border: "rgba(251, 191, 36, 0.4)", color: "#fde047" },
    };
    return classes[badge] || classes.available;
  };

  // Get transaction status class
  const getTransactionStatusClass = (status) => {
    const statusUpper = (status || '').toUpperCase();
    if (statusUpper === "COMPLETED") {
      return { bg: "rgba(34, 197, 94, 0.2)", border: "rgba(34, 197, 94, 0.4)", color: "#86efac" };
    } else if (statusUpper === "PENDING") {
      return { bg: "rgba(251, 191, 36, 0.2)", border: "rgba(251, 191, 36, 0.4)", color: "#fde047" };
    } else if (statusUpper === "FAILED") {
      return { bg: "rgba(239, 68, 68, 0.2)", border: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" };
    } else {
      return { bg: "rgba(148, 163, 184, 0.2)", border: "rgba(148, 163, 184, 0.4)", color: "#cbd5e1" };
    }
  };

  return (
    <section className="ogc-dashboard-page">
      <div className="ogc-dashboard-page-header">
        <h1 className="ogc-dashboard-page-title">Wallet</h1>
        <p className="ogc-dashboard-page-subtitle">
          View your OGC balance, transaction history, and manage your wallet.
        </p>
      </div>

      {/* PHASE W2.9: Wallet status banner */}
      <WalletBadgesPanel
        data={walletBadges}
        loading={walletBadgesLoading}
        error={walletBadgesError}
        variant="banner"
      />

      {/* Error and Loading States */}
      {error && (
        <div className="ogc-alert ogc-alert-error" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}
      {loading && !error && (
        <div className="ogc-alert ogc-alert-info" style={{ marginBottom: "24px" }}>
          Loading wallet summary...
        </div>
      )}

      {/* PHASE W2.9: Top row layout (Snapshot + Badges | Balances) */}
      <div className="wallet-top-row">
        <div className="wallet-top-col wallet-top-col--snapshot">
          {/* Wallet Snapshot Card */}
          <div className="ogc-dashboard-card" style={{ marginBottom: "24px" }}>
            <h2 className="ogc-dashboard-card-title">Wallet Snapshot</h2>
            
            {walletOverviewLoading && (
              <p style={{ marginTop: "20px", opacity: 0.7 }}>Loading wallet overview…</p>
            )}

            {walletOverviewError && !walletOverviewLoading && (
              <div className="ogc-alert ogc-alert-error" style={{ marginTop: "20px" }}>
                {walletOverviewError}
              </div>
            )}

            {!walletOverviewLoading && !walletOverviewError && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.875rem", opacity: 0.8, marginBottom: "8px" }}>OGC Balance</div>
                  <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "4px" }}>
                    {(walletOverview?.snapshot?.ogcBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} OGC
                  </div>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.875rem", opacity: 0.8, marginBottom: "8px" }}>Estimated Value (USD)</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "var(--text-main)", opacity: 0.9 }}>
                    ${(walletOverview?.snapshot?.usdEstimate ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.6, fontStyle: "italic" }}>
                  {walletOverview?.snapshot?.lastUpdatedAt
                    ? `Last updated: ${new Date(walletOverview.snapshot.lastUpdatedAt).toLocaleString()}`
                    : 'Last updated: —'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="wallet-top-col wallet-top-col--balances">
          {/* Balances Card */}
          <div className="ogc-dashboard-card" style={{ marginBottom: "24px" }}>
        <h2 className="ogc-dashboard-card-title">Balances</h2>
        
        {walletOverviewLoading && (
          <p style={{ marginTop: "20px", opacity: 0.7 }}>Loading balances…</p>
        )}

        {walletOverviewError && !walletOverviewLoading && (
          <div className="ogc-alert ogc-alert-error" style={{ marginTop: "20px" }}>
            {walletOverviewError}
          </div>
        )}

        {!walletOverviewLoading && !walletOverviewError && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                walletOverview?.balances?.main,
                walletOverview?.balances?.locked,
                walletOverview?.balances?.pendingRewards,
              ].filter(Boolean).map((balance, index) => {
                const badgeType = balance.status === 'AVAILABLE' ? 'available' : 
                                 balance.status === 'LOCKED' ? 'locked' : 'pending';
                const badgeStyle = getBadgeClass(badgeType);
                return (
                  <div
                    key={index}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--border-card)",
                      borderRadius: "8px",
                      backgroundColor: "var(--bg-card-soft)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <div style={{ fontWeight: "600", marginBottom: "4px", color: "var(--ogc-fg)", fontSize: "0.875rem" }}>
                        {balance.label || '—'}
                      </div>
                      <div style={{ fontSize: "1.125rem", fontWeight: "600", color: "var(--ogc-fg)", opacity: 0.9 }}>
                        {(balance.amount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} OGC
                      </div>
                    </div>
                    <div>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          backgroundColor: badgeStyle.bg,
                          border: `1px solid ${badgeStyle.border}`,
                          color: badgeStyle.color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {balance.status || '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Staking Overview + Rewards Timeline Row (Phase W2.8) */}
      <div className="wallet-staking-and-rewards-row">
        {/* Staking Overview Card */}
        <div className="wallet-staking-col">
          <div className="ogc-dashboard-card wallet-card" style={{ marginBottom: "24px", height: "100%" }}>
            <h2 className="ogc-dashboard-card-title">Staking Overview</h2>

            {stakingError && (
              <div className="ogc-alert ogc-alert-error" style={{ marginTop: "20px" }}>
                {stakingError}
              </div>
            )}

            {stakingLoading && !stakingError && (
              <div className="ogc-alert ogc-alert-info" style={{ marginTop: "20px" }}>
                Loading staking data...
              </div>
            )}

            {!stakingLoading && !stakingError && staking && (
              <div className="wallet-staking-grid" style={{ marginTop: "20px" }}>
                <div className="wallet-staking-item">
                  <span className="wallet-staking-label">Staked OGC</span>
                  <span className="wallet-staking-value">
                    {staking?.stakedAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} OGC
                  </span>
                </div>
                <div className="wallet-staking-item">
                  <span className="wallet-staking-label">Claimable rewards</span>
                  <span className="wallet-staking-value">
                    {staking?.claimableRewards?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} OGC
                  </span>
                </div>
                <div className="wallet-staking-item">
                  <span className="wallet-staking-label">Lifetime rewards</span>
                  <span className="wallet-staking-value">
                    {staking?.lifetimeRewards?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} OGC
                  </span>
                </div>
                <div className="wallet-staking-item">
                  <span className="wallet-staking-label">APY</span>
                  <span className="wallet-staking-value">
                    {staking?.apy != null ? `${staking.apy}%` : '—'}
                  </span>
                </div>
                <div className="wallet-staking-item">
                  <span className="wallet-staking-label">Lock duration</span>
                  <span className="wallet-staking-value">
                    {staking?.lockDurationDays != null ? `${staking.lockDurationDays} days` : '—'}
                  </span>
                </div>
                <div className="wallet-staking-item">
                  <span className="wallet-staking-label">Next payout</span>
                  <span className="wallet-staking-value">
                    {staking?.nextPayoutAt ? new Date(staking.nextPayoutAt).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            )}

            <p className="wallet-card-footnote" style={{ marginTop: "12px" }}>
              Staking engine is in preview mode. Values are mock and for design/testing only.
            </p>
          </div>
        </div>

        {/* Rewards Timeline Chart (Phase W2.8) */}
        <div className="wallet-rewards-col">
          <WalletRewardsChart
            events={rewardsEvents}
            upcoming={rewardsUpcoming}
            summary={rewardsSummary}
            range={rewardsRange}
            loading={rewardsLoading}
            error={rewardsError}
            onRangeChange={setRewardsRange}
          />
        </div>
      </div>

      {/* Wallet Activity Card (Phase W2.7) */}
      <WalletActivityChart
        data={activityData}
        loading={activityLoading}
        error={activityError}
        summary={activitySummary}
        range={activityRange}
        onRangeChange={setActivityRange}
      />

      {/* Recent Transactions Card */}
      <div className="ogc-dashboard-card wallet-card" style={{ marginBottom: "24px", maxWidth: "100%", width: "100%" }}>
        <h2 className="ogc-dashboard-card-title">Recent Transactions</h2>

        {txError && (
          <div className="ogc-alert ogc-alert-error" style={{ marginTop: "20px" }}>
            {txError}
          </div>
        )}

        {txLoading && !txError && (
          <div className="ogc-alert ogc-alert-info" style={{ marginTop: "20px" }}>
            Loading transactions...
          </div>
        )}

        {!txLoading && !txError && transactions.length === 0 && (
          <p className="wallet-empty-text" style={{ marginTop: "20px", textAlign: "center", opacity: 0.7 }}>
            No transactions found yet.
          </p>
        )}

        {!txLoading && !txError && transactions.length > 0 && (
          <div className="wallet-table-wrapper" style={{ marginTop: "20px", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table className="wallet-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-card)" }}>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "0.875rem", fontWeight: "600", opacity: 0.8 }}>Type</th>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "0.875rem", fontWeight: "600", opacity: 0.8 }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "0.875rem", fontWeight: "600", opacity: 0.8 }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "0.875rem", fontWeight: "600", opacity: 0.8 }}>Date</th>
                  <th style={{ textAlign: "left", padding: "12px", fontSize: "0.875rem", fontWeight: "600", opacity: 0.8 }}>Tx ID</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const statusStyle = getTransactionStatusClass(tx.status);
                  const isPositive = tx.direction === 'IN' || tx.type === 'REWARD';
                  const amountPrefix = tx.direction === 'OUT' ? '-' : '+';
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: "1px solid var(--border-card)",
                      }}
                    >
                      <td style={{ padding: "12px", fontSize: "0.875rem", color: "var(--ogc-fg)" }}>{tx.type}</td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: isPositive ? "#86efac" : "#fca5a5",
                        }}
                      >
                        {amountPrefix}
                        {Number(tx.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {tx.tokenSymbol || 'OGC'}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            backgroundColor: statusStyle.bg,
                            border: `1px solid ${statusStyle.border}`,
                            color: statusStyle.color,
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: "0.875rem", opacity: 0.8 }}>
                        {tx.occurredAt ? new Date(tx.occurredAt).toLocaleString() : '—'}
                      </td>
                      <td className="wallet-tx-hash" style={{ padding: "12px", fontSize: "0.75rem", fontFamily: "monospace", opacity: 0.7 }}>
                        {tx.txHash ? tx.txHash.slice(0, 8) + '…' + tx.txHash.slice(-4) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="wallet-table-footnote" style={{ marginTop: "16px", fontSize: "0.75rem", opacity: 0.6, fontStyle: "italic", textAlign: "center" }}>
              On-chain history integration coming in a later phase.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions Row */}
      <div className="ogc-dashboard-card wallet-card">
        <h2 className="ogc-dashboard-card-title">Quick Actions</h2>
        <div style={{ marginTop: "20px" }}>
          <div className="wallet-actions-row">
            <button className="wallet-btn disabled" disabled>
              Deposit (coming soon)
            </button>
            <button className="wallet-btn disabled" disabled>
              Withdraw (coming soon)
            </button>
            <button
              className="wallet-btn"
              type="button"
              onClick={() => {
                setStakePanelOpen(true);
                setStakePreview(null);
                setStakePreviewError(null);
              }}
            >
              Stake OGC (preview)
            </button>
          </div>

          {stakePanelOpen && (
            <div className="wallet-stake-panel">
              <h4 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "12px", color: "var(--ogc-fg)" }}>Stake OGC — Preview only</h4>
              <p className="wallet-stake-description">
                Enter an amount to see estimated rewards for the current staking program.
                This is a preview only — real staking will be enabled in a later phase.
              </p>

              <label className="wallet-form-label">
                Amount to stake (OGC)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="wallet-input"
                />
              </label>

              {stakePreviewError && (
                <div className="ogc-alert ogc-alert-error" style={{ marginTop: "12px" }}>
                  {stakePreviewError}
                </div>
              )}

              {stakePreview && !stakePreviewError && (
                <div className="wallet-stake-preview">
                  <div className="wallet-staking-item">
                    <span className="wallet-staking-label">APY</span>
                    <span className="wallet-staking-value">{stakePreview.apy}%</span>
                  </div>
                  <div className="wallet-staking-item">
                    <span className="wallet-staking-label">Lock duration</span>
                    <span className="wallet-staking-value">
                      {stakePreview.lockDurationDays} days
                    </span>
                  </div>
                  <div className="wallet-staking-item">
                    <span className="wallet-staking-label">Estimated rewards for this period</span>
                    <span className="wallet-staking-value">
                      {stakePreview.estimatedRewardForPeriod.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}{' '}
                      OGC
                    </span>
                  </div>
                </div>
              )}

              <div className="wallet-stake-actions">
                <button
                  type="button"
                  className="wallet-btn"
                  onClick={async () => {
                    setStakePreviewError(null);
                    setStakePreview(null);
                    setStakePreviewLoading(true);
                    try {
                      if (!stakeAmount || Number(stakeAmount) <= 0) {
                        throw new Error('Please enter a valid stake amount.');
                      }
                      const preview = await getStakingPreview(stakeAmount);
                      setStakePreview(preview);
                    } catch (err) {
                      setStakePreviewError(err?.message || 'Failed to calculate staking preview.');
                    } finally {
                      setStakePreviewLoading(false);
                    }
                  }}
                  disabled={stakePreviewLoading}
                >
                  {stakePreviewLoading ? 'Calculating…' : 'Preview rewards'}
                </button>

                <button
                  type="button"
                  className="wallet-btn secondary"
                  onClick={() => {
                    setStakePanelOpen(false);
                    setStakeAmount('');
                    setStakePreview(null);
                    setStakePreviewError(null);
                  }}
                >
                  Close
                </button>
              </div>

              <p className="wallet-card-footnote" style={{ marginTop: "12px" }}>
                Staking transactions are not live yet. This preview is for planning and UX only.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default WalletPage;

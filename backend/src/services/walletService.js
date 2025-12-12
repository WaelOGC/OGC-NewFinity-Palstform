/**
 * Wallet Service
 * 
 * Handles wallet-related business logic including:
 * - Balance calculations
 * - Staking operations
 * - Reward calculations
 * - Pricing oracle integration
 * - Transaction history
 * 
 * Phase W2.1: Mock implementation
 * Phase W2.3: Will add real database reads, staking engine, reward engine, and pricing oracle
 */

import pool from '../db.js';

/**
 * Get wallet summary for a user
 * 
 * Phase W2.1: Returns mock data
 * Phase W2.3: Will implement:
 *   - Database reads from wallets table
 *   - Staking engine integration
 *   - Reward engine calculations
 *   - Pricing oracle for USD conversion
 * 
 * @param {number} userId - The user ID
 * @returns {Promise<object>} Wallet summary object
 */
async function getWalletSummary(userId) {
  // Phase W2.1: Mock implementation
  // Phase W2.3: Replace with real database queries and calculations
  
  return {
    mainBalance: 1234.56,
    lockedBalance: 200.00,
    pendingRewards: 34.56,
    estimatedUsdValue: 1234.56,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Get wallet transactions for a user with pagination
 * 
 * Phase W2.5: Returns mock transaction data
 * Phase W2.6+: Will query WalletTransaction table from database
 * 
 * @param {number} userId - The user ID
 * @param {object} options - Query options { limit, offset }
 * @returns {Promise<object>} Object with items array and pagination metadata
 */
async function getWalletTransactionsForUser(userId, { limit = 10, offset = 0 } = {}) {
  // Phase W2.5: Mock implementation
  // Phase W2.6+: Replace with real database queries from WalletTransaction table
  
  const total = 24; // arbitrary total count to simulate pagination

  const baseItems = [
    {
      id: 'tx_1',
      type: 'Stake',
      direction: 'OUT',
      amount: 100.0,
      tokenSymbol: 'OGC',
      status: 'COMPLETED',
      occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      txHash: '0xabc123def4567890123456789012345678901234567890123456789012345678',
      chain: 'Polygon',
      notes: 'Staking pool',
    },
    {
      id: 'tx_2',
      type: 'Reward',
      direction: 'IN',
      amount: 12.5,
      tokenSymbol: 'OGC',
      status: 'COMPLETED',
      occurredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      txHash: '0xdef456abc1237890123456789012345678901234567890123456789012345678',
      chain: 'Polygon',
      notes: 'Staking rewards',
    },
    {
      id: 'tx_3',
      type: 'Transfer',
      direction: 'OUT',
      amount: 50,
      tokenSymbol: 'OGC',
      status: 'PENDING',
      occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      txHash: '0x789abc123def4567890123456789012345678901234567890123456789012345',
      chain: 'Polygon',
      notes: 'External address',
    },
    {
      id: 'tx_4',
      type: 'Deposit',
      direction: 'IN',
      amount: 500,
      tokenSymbol: 'OGC',
      status: 'COMPLETED',
      occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      txHash: '0x456789abc123def0123456789012345678901234567890123456789012345678',
      chain: 'Polygon',
      notes: 'Main wallet',
    },
    {
      id: 'tx_5',
      type: 'Reward',
      direction: 'IN',
      amount: 8.75,
      tokenSymbol: 'OGC',
      status: 'COMPLETED',
      occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      txHash: '0x123def456abc7890123456789012345678901234567890123456789012345678',
      chain: 'Polygon',
      notes: 'Staking rewards',
    },
  ];

  // Simple pagination slice based on limit/offset
  const items = baseItems.slice(offset, offset + limit);

  return {
    items,
    pagination: {
      total,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Mock staking summary for a user
 * 
 * Phase W2.4: Returns static mock data for staking overview
 * Phase W2.5+: Will read from staking tables / reward engine
 * 
 * @param {number} userId - The user ID (currently ignored, returns static data)
 * @returns {Promise<object>} Staking summary object
 */
export async function getStakingSummaryForUser(userId) {
  // For now we ignore userId and return a static, but realistic structure.
  // Later this will read from staking tables / reward engine.
  const now = new Date();

  return {
    stakedAmount: 200.0,         // OGC currently staked
    claimableRewards: 34.56,     // OGC rewards that can be claimed
    lifetimeRewards: 120.0,      // total rewards ever earned
    apy: 12.5,                   // % per year
    lockDurationDays: 30,        // lockup period
    lastClaimedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nextPayoutAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Mock reward preview for a potential stake amount
 * 
 * Phase W2.4: Returns calculated preview based on mock APY
 * Phase W2.5+: Will use real staking engine calculations
 * 
 * @param {number} userId - The user ID (currently ignored)
 * @param {object} params - Parameters { amount }
 * @returns {Promise<object>} Preview object with estimated rewards
 */
export async function previewStakingRewards(userId, { amount }) {
  const stakeAmount = Number(amount || 0);

  // Simple mock formula: 12.5% APY, assume 30 days locked
  const apy = 12.5;
  const lockDurationDays = 30;
  const yearlyReward = stakeAmount * (apy / 100);
  const estimatedRewardForPeriod = yearlyReward * (lockDurationDays / 365);

  return {
    inputAmount: stakeAmount,
    apy,
    lockDurationDays,
    estimatedRewardForPeriod,
  };
}

/**
 * Get wallet overview for a user (snapshot + balances)
 * 
 * Phase W2.6: Returns mock data for wallet snapshot and balances
 * Phase W3+: Will replace with real DB / chain data
 * 
 * @param {number} userId - The user ID (currently ignored, returns mock data)
 * @returns {Promise<object>} Wallet overview object with snapshot and balances
 */
export async function getWalletOverviewForUser(userId) {
  // TODO: Replace with real DB / chain data in later phases (W3+).
  // For now, use mock values that align with the existing UI.
  const ogcBalance = 1234.56;
  const usdEstimate = 1234.56; // same number for now, just a placeholder
  const nowIso = new Date().toISOString();

  return {
    snapshot: {
      ogcBalance,       // total OGC balance across wallet
      usdEstimate,      // estimated USD value
      lastUpdatedAt: nowIso,
    },
    balances: {
      main: {
        label: 'Main Wallet (OGC)',
        amount: 1000.0,
        status: 'AVAILABLE',
      },
      locked: {
        label: 'Locked / Staked',
        amount: 200.0,
        status: 'LOCKED',
      },
      pendingRewards: {
        label: 'Pending Rewards',
        amount: 34.56,
        status: 'PENDING',
      },
    },
  };
}

/**
 * Get wallet activity for a user (timeseries and summary)
 * 
 * Phase W2.7: Returns mock activity data for charting
 * Phase W3+: Will read from real transaction history and generate timeseries
 * 
 * @param {number} userId - The user ID (currently ignored, returns mock data)
 * @param {object} options - Options { range = '30d' }
 * @returns {Promise<object>} Activity object with timeseries and summary
 */
export async function getWalletActivityForUser(userId, { range = '30d' } = {}) {
  // For now, return static mock data; later this will read from real tx history.

  // Simple daily timeseries, last 7–10 days, enough for a chart.
  const timeseries = [
    { date: '2025-12-04', balance: 950, netChange: -50 },
    { date: '2025-12-05', balance: 1000, netChange: 50 },
    { date: '2025-12-06', balance: 1100, netChange: 100 },
    { date: '2025-12-07', balance: 1080, netChange: -20 },
    { date: '2025-12-08', balance: 1200, netChange: 120 },
    { date: '2025-12-09', balance: 1234.56, netChange: 34.56 },
    { date: '2025-12-10', balance: 1234.56, netChange: 0 },
  ];

  const summary = {
    range, // e.g. "7d", "30d"
    totalInflow: 270.0,
    totalOutflow: 85.0,
    netChange: 185.0,
    topActivityType: 'Reward', // most common positive source
  };

  return {
    timeseries,
    summary,
  };
}

/**
 * Get rewards timeline for a user (events + upcoming payout)
 * 
 * Phase W2.8: Returns mock rewards timeline data for mini bar chart
 * Phase W3+: Will replace with real rewards ledger from database
 * 
 * @param {number} userId - The user ID (currently ignored, returns mock data)
 * @param {object} options - Options { range = '30d' }
 * @returns {Promise<object>} Rewards timeline object with events, upcoming, and summary
 */
export async function getRewardsTimelineForUser(userId, { range = '30d' } = {}) {
  // TODO: Replace with real rewards ledger in W3+.
  // For now, return static mock data aligned with staking overview + transactions.

  // Use a simple fixed set that works for both 7d and 30d views.
  const allEvents = [
    {
      date: '2025-12-03T12:00:00.000Z',
      amount: 7.12,
      source: 'Staking',
    },
    {
      date: '2025-12-06T12:00:00.000Z',
      amount: 8.75,
      source: 'Staking',
    },
    {
      date: '2025-12-08T12:00:00.000Z',
      amount: 9.50,
      source: 'Staking',
    },
    {
      date: '2025-12-10T12:00:00.000Z',
      amount: 12.34,
      source: 'Staking',
    },
  ];

  // In a real implementation we would filter by range.
  const events = allEvents;

  const totalRewards = events.reduce((sum, e) => sum + e.amount, 0);

  const upcoming = {
    date: '2025-12-14T12:11:57.000Z',
    estimatedReward: 10.25,
    source: 'Staking',
  };

  return {
    upcoming,
    events,
    summary: {
      range,
      totalRewards,
      count: events.length,
    },
  };
}

/**
 * Get wallet badges for a user (Phase W2.9)
 * 
 * Returns mock badge data including staking tier, rewards level, contribution score, and badges
 * Phase W4+: Will be replaced with real scoring logic
 * 
 * @param {number} userId - The user ID (currently ignored, returns mock data)
 * @returns {Promise<object>} Badges object with stakingTier, rewardsLevel, contributionScore, and badges array
 */
export async function getWalletBadgesForUser(userId) {
  // Mock data; will be replaced with real scoring logic in W4+
  return {
    stakingTier: 'Silver',
    rewardsLevel: 'Level 2',
    contributionScore: 340,
    badges: [
      { key: 'early-adopter', label: 'Early Adopter', earned: true },
      { key: 'staker', label: 'Active Staker', earned: true },
      { key: 'challenger', label: 'Challenge Participant', earned: false },
      { key: 'builder', label: 'OGC Builder', earned: false }
    ]
  };
}

export { getWalletSummary, getWalletTransactionsForUser };

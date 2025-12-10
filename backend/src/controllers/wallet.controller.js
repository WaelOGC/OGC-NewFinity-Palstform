import pool from '../db.js';

/**
 * Helper function to get or create a wallet for a user
 * @param {number} userId - The user ID
 * @param {object} connection - MySQL connection (defaults to pool)
 * @returns {Promise<object>} Wallet object
 */
async function getOrCreateWallet(userId, connection = pool) {
  const [rows] = await connection.query(
    'SELECT * FROM wallets WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (rows.length > 0) return rows[0];

  // Simple deterministic demo address
  const address = `0x${userId.toString(16).padStart(40, '0')}`;

  const [result] = await connection.query(
    'INSERT INTO wallets (user_id, address, balance, staked, rewards) VALUES (?, ?, 0, 0, 0)',
    [userId, address]
  );

  const [walletRows] = await connection.query(
    'SELECT * FROM wallets WHERE id = ? LIMIT 1',
    [result.insertId]
  );

  return walletRows[0];
}

/**
 * Get wallet summary for a user
 * Auto-creates wallet if it doesn't exist
 * @param {number} userId - The user ID
 * @returns {Promise<object>} Wallet summary with balance, staked, rewards, address, updatedAt
 */
export async function getSummary(userId) {
  // Auto-create wallet if it doesn't exist
  const wallet = await getOrCreateWallet(userId);
  
  return {
    balance: wallet.balance.toString(),
    staked: wallet.staked.toString(),
    rewards: wallet.rewards.toString(),
    address: wallet.address,
    updatedAt: wallet.updated_at
  };
}

/**
 * List transactions for a user with pagination and filtering
 * @param {number} userId - The user ID
 * @param {object} query - Query parameters (page, pageSize, type, status)
 * @returns {Promise<object>} Paginated transaction list
 */
export async function listTx(userId, query) {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;

  // Build WHERE clause
  const whereClauses = ['user_id = ?'];
  const params = [userId];

  if (query.type) {
    whereClauses.push('type = ?');
    params.push(query.type);
  }

  if (query.status) {
    whereClauses.push('status = ?');
    params.push(query.status);
  }

  const whereSql = whereClauses.join(' AND ');

  // Get total count
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM transactions WHERE ${whereSql}`,
    params
  );

  // Get paginated items
  const offset = (page - 1) * pageSize;
  const [items] = await pool.query(
    `SELECT * FROM transactions WHERE ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    items,
    total: Number(total),
    page,
    pageSize
  };
}

/**
 * Get rewards for a user
 * @param {number} userId - The user ID
 * @returns {Promise<object>} Rewards amount
 */
export async function rewards(userId) {
  const [rows] = await pool.query(
    'SELECT rewards FROM wallets WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return {
    rewards: rows[0] ? rows[0].rewards.toString() : '0'
  };
}

/**
 * Transfer tokens from user's wallet
 * @param {number} userId - The user ID
 * @param {object} params - Transfer parameters { to, amount }
 * @returns {Promise<object>} Transaction result
 */
export async function transfer(userId, { to, amount }) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Ensure wallet exists
    const wallet = await getOrCreateWallet(userId, connection);

    // Check balance
    if (Number(wallet.balance) < Number(amount)) {
      throw new Error('Insufficient balance');
    }

    // Insert transaction
    const [txResult] = await connection.query(
      `INSERT INTO transactions (wallet_id, user_id, type, token, amount, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [wallet.id, userId, 'TRANSFER_OUT', 'OGC', amount, 'PENDING']
    );

    // Update wallet balance
    await connection.query(
      'UPDATE wallets SET balance = balance - ? WHERE id = ?',
      [amount, wallet.id]
    );

    await connection.commit();

    return {
      txId: txResult.insertId,
      status: 'PENDING'
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Stake tokens from user's wallet
 * @param {number} userId - The user ID
 * @param {number} amount - Amount to stake
 * @returns {Promise<object>} Success result
 */
export async function stake(userId, amount) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Ensure wallet exists
    const wallet = await getOrCreateWallet(userId, connection);

    // Check balance
    if (Number(wallet.balance) < Number(amount)) {
      throw new Error('Insufficient balance');
    }

    // Update wallet: move from balance to staked
    await connection.query(
      'UPDATE wallets SET balance = balance - ?, staked = staked + ? WHERE id = ?',
      [amount, amount, wallet.id]
    );

    // Insert transaction record
    await connection.query(
      `INSERT INTO transactions (wallet_id, user_id, type, token, amount, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [wallet.id, userId, 'STAKE', 'OGC', amount, 'CONFIRMED']
    );

    await connection.commit();

    return { success: true };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Unstake tokens from user's wallet
 * @param {number} userId - The user ID
 * @param {number} amount - Amount to unstake
 * @returns {Promise<object>} Success result
 */
export async function unstake(userId, amount) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Ensure wallet exists
    const wallet = await getOrCreateWallet(userId, connection);

    // Check staked amount
    if (Number(wallet.staked) < Number(amount)) {
      throw new Error('Insufficient staked amount');
    }

    // Update wallet: move from staked to balance
    await connection.query(
      'UPDATE wallets SET balance = balance + ?, staked = staked - ? WHERE id = ?',
      [amount, amount, wallet.id]
    );

    // Insert transaction record
    await connection.query(
      `INSERT INTO transactions (wallet_id, user_id, type, token, amount, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [wallet.id, userId, 'UNSTAKE', 'OGC', amount, 'CONFIRMED']
    );

    await connection.commit();

    return { success: true };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Create demo transactions for a user (for testing/demo purposes)
 * @param {number} userId - The user ID
 * @returns {Promise<object>} Result with number of inserted transactions
 */
export async function createDemoTransactions(userId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Ensure wallet exists
    const wallet = await getOrCreateWallet(userId, connection);

    // Define demo transactions
    const demoTransactions = [
      { type: 'DEPOSIT', amount: 5000, status: 'CONFIRMED' },
      { type: 'REWARD', amount: 250, status: 'CONFIRMED' },
      { type: 'TRANSFER_OUT', amount: 1000, status: 'CONFIRMED' },
      { type: 'DEPOSIT', amount: 2000, status: 'CONFIRMED' },
      { type: 'REWARD', amount: 150, status: 'CONFIRMED' }
    ];

    // Calculate balance and rewards changes
    let balanceDelta = 0;
    let rewardsDelta = 0;

    for (const tx of demoTransactions) {
      if (tx.type === 'DEPOSIT') {
        balanceDelta += tx.amount;
      } else if (tx.type === 'REWARD') {
        rewardsDelta += tx.amount;
      } else if (tx.type === 'TRANSFER_OUT') {
        balanceDelta -= tx.amount;
      }
    }

    // Insert transactions
    const created = [];
    for (const demo of demoTransactions) {
      const txHash = `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`;
      const [result] = await connection.query(
        `INSERT INTO transactions (wallet_id, user_id, type, token, amount, status, tx_hash, chain_id)
         VALUES (?, ?, ?, 'OGC', ?, ?, ?, ?)`,
        [
          wallet.id,
          userId,
          demo.type,
          demo.amount,
          demo.status,
          txHash,
          137
        ]
      );
      created.push({ id: result.insertId, ...demo });
    }

    // Update wallet
    await connection.query(
      'UPDATE wallets SET balance = balance + ?, rewards = rewards + ? WHERE id = ?',
      [balanceDelta, rewardsDelta, wallet.id]
    );

    await connection.commit();

    return {
      ok: true,
      inserted: created.length
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

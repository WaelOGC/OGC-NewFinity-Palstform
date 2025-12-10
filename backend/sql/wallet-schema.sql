-- Wallet and Transaction Schema for OGC NewFinity Platform
-- This schema defines the MySQL tables for wallet management and transaction tracking

-- Wallets table: one wallet per user
CREATE TABLE IF NOT EXISTS wallets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  address VARCHAR(255) NULL,
  balance BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Balance in smallest units (integer)',
  staked BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Staked amount in smallest units (integer)',
  rewards BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Rewards in smallest units (integer)',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions table: transaction history for wallets
CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  wallet_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(32) NOT NULL COMMENT 'Transaction type: DEPOSIT, REWARD, TRANSFER_OUT, TRANSFER, STAKE, UNSTAKE',
  token VARCHAR(32) NOT NULL DEFAULT 'OGC',
  amount BIGINT UNSIGNED NOT NULL COMMENT 'Amount in smallest units (integer)',
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT 'Transaction status: PENDING, CONFIRMED, FAILED',
  tx_hash VARCHAR(128) NULL COMMENT 'Transaction hash (for blockchain transactions)',
  chain_id INT NULL COMMENT 'Blockchain chain ID',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wallet_id (wallet_id),
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_transactions_wallet
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


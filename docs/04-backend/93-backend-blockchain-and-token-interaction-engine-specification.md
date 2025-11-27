# OGC NewFinity — Backend Blockchain & Token Interaction Engine Specification (v1.0)

## 1. Introduction

This document defines the architecture, interaction rules, transaction flows, synchronization methods, and security principles for the Blockchain & Token Interaction Engine used within the OGC NewFinity backend.

The Token Engine ensures:

- Secure interaction with the OGCFinity smart contract
- Continuous wallet synchronization
- Reliable read/write blockchain operations
- Accurate token accounting
- Staking, rewards, and contribution-mining support (future)

This specification applies to all blockchain-related operations across the platform.

## 2. Supported Blockchains

### 2.1 Primary Network

- Polygon PoS (Mainnet)

### 2.2 Secondary Networks (Future)

- Ethereum
- Polygon zkEVM
- Base
- Multi-chain bridge support

### 2.3 Development Networks

- Polygon Mumbai
- Local Hardhat testnet

The engine must auto-select the environment based on configuration.

## 3. Smart Contract Integration

### 3.1 Required Contracts

- OGC Utility Token (ERC-20)
- Future: Governance Token
- Future: Staking & Rewards Contracts

### 3.2 Contract Capabilities

ERC-20 methods:

- balanceOf
- transfer
- transferFrom
- allowance
- approve
- totalSupply

### 3.3 ABI Management

- ABIs stored in `/contracts/abi/`
- Versioned naming: `ogc-token-v1.json`
- Must support ABI upgrades without breaking older versions

## 4. Node & Provider Requirements

### 4.1 Provider Types

- Public RPC (fallback)
- Dedicated RPC (primary)
- WebSocket provider for event listening
- Provider load-balancing

### 4.2 Provider Failover Rules

If a provider fails:

- Retry with exponential backoff
- Switch to backup provider
- Log the provider outage
- Continue processing without downtime

## 5. Token Operations

### 5.1 Read Operations

- Fetch user balance
- Fetch total token supply
- Fetch wallet transaction history (via indexer)
- Check allowance and approvals

### 5.2 Write Operations

All write transactions must:

- Use nonce management
- Use gas estimation
- Be signed server-side (admin wallet only)
- Return transaction hash

### 5.3 Transaction Types

- User reward payouts (future)
- Contribution-Based Mining rewards (future)
- Admin-triggered transfers
- Automated system distributions

## 6. Wallet Synchronization System

### 6.1 Sync Responsibilities

Synchronize:

- On-chain token balance
- Pending transactions
- Confirmed transfers
- Failed transactions
- Allowance changes

### 6.2 Sync Frequency

- Standard sync: every 60 seconds
- High-priority sync: every 10 seconds
- Manual sync: triggered after sensitive operations

### 6.3 Indexer Integration

Indexer required for:

- Historical transaction lookup
- Pagination
- Fast event queries

## 7. Event Listener Architecture

The backend must listen for on-chain events:

### 7.1 Required Events

- Transfer(from, to, amount)
- Approval(owner, spender, amount)

### 7.2 Listener Responsibilities

When an event is received:

- Validate event
- Update database with new state
- Trigger any downstream jobs (queue)
- Log event details

### 7.3 Listener Reliability

- Auto-reconnect on WebSocket drop
- Batch re-sync on recovery
- Store last processed block in DB

## 8. Security Requirements

### 8.1 Admin Wallet

- Stored as encrypted key file
- Loaded via environment variable
- Never exposed in logs
- Rotated regularly

### 8.2 Signing Rules

- Only backend executes signed transactions
- Users never provide private keys to platform
- Frontend can only initiate requests, not sign

### 8.3 Transaction Safety

- Verify gas estimates
- Protect against replay attacks
- Reject unsigned or tampered requests
- Reject suspicious large transfers

## 9. Database Requirements

### 9.1 Token Balances Table

Stores synchronized on-chain balances.

### 9.2 Transactions Table

Tracks:

- txHash
- from
- to
- amount
- confirmations
- status (pending, confirmed, failed)

### 9.3 Blockchain Sync Metadata

- lastProcessedBlock
- provider status
- sync queue states

## 10. Logging Requirements

Logs must include:

- provider failures
- on-chain errors
- txHash for every write operation
- event listener restarts
- block sync intervals
- suspicious transaction patterns

## 11. Performance Requirements

- Balance fetch < 200 ms
- Event processing < 50 ms
- Provider failover < 1 second
- Must support 100,000+ balance queries/day
- Must handle up to 5,000 events/hour

## 12. Future Enhancements

- Staking contract integration
- Cross-chain bridge support
- Token governance voting
- Real-time dashboard for blockchain metrics
- Meta-transactions (gasless operations)
- AI-based fraud detection

## 13. Conclusion

This specification defines the full Blockchain & Token Interaction Engine for OGC NewFinity, ensuring secure on-chain operations, reliable synchronization, and a scalable foundation for the tokenized ecosystem.


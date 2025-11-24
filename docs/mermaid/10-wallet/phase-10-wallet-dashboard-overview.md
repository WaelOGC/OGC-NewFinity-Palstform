# Phase 10 – Wallet Dashboard Overview (OGC NewFinity Platform)

## Objective

Define the architecture, features, and flow of the OGC Wallet — the core component responsible for managing all user token operations inside the OGC NewFinity Platform.

## Core Functions

1. **Balance Management**

   - Displays real-time OGC Token balance and rewards.  
   - Syncs with blockchain via Wallet API (Phase 8.4).  
   - Updates periodically through the Indexer Service (Phase 8.5).  

2. **Transactions**

   - Supports deposits, withdrawals, and transfers.  
   - Each transaction recorded both on-chain and off-chain.  
   - Transaction history available with pagination and filters.  

3. **Staking & Rewards**

   - Users can stake tokens for rewards and ecosystem participation.  
   - Staking pools managed via smart contracts (Polygon).  
   - Rewards calculated based on contribution mining and challenge results.  

4. **Contribution Mining**

   - Users earn OGC tokens through activity, challenges, and ecosystem engagement.  
   - Mined rewards reflected as "pending" until validated on-chain.  

5. **User Interface**

   - Integrated directly into the main platform dashboard.  
   - Built using React with secure API connections.  
   - Modular design for “Wallet Summary,” “Transactions,” and “Rewards.”  

6. **Security**

   - All wallet operations pass through JWT-authenticated endpoints.  
   - Transaction signing handled client-side (MetaMask, WalletConnect).  
   - Sensitive operations protected with confirmation modals and OTP (future).  

## System Architecture

- Frontend communicates with Wallet API (Phase 8.4).  
- Transactions synced with Blockchain Events API (Phase 8.5).  
- User identity and access verified through Auth API (Phase 8.2).  
- Reward logic uses Data Models (Phase 07).  

## Integration Map

| Component | Connected Phase | Description |
|:-----------|:----------------|:-------------|
| Wallet API | 8.4 | Manages balance, staking, and transfers |
| Transaction API | 8.5 | Tracks deposits, confirmations, and reorgs |
| Data Models | 7 | Links wallets, users, and rewards |
| Security Framework | 2 | Enforces authentication and rate limits |
| Governance | 6 | Controls admin permissions and oversight |

## Diagram Placeholder

Future Mermaid diagrams:

- Wallet System Flow  
- Transaction Lifecycle (on-chain + off-chain)  
- Staking and Rewards Sequence  

## Deliverables

- Complete Wallet system diagram (.mmd)  
- Transaction flow and synchronization chart  
- Staking, mining, and rewards model visualization  
- Integration test plan outline  

## Dependencies

- Relies on Data Models (Phase 07) and API Contracts (8.4–8.5).  
- Enforced by Security & Governance layers (Phases 02 and 06).  

## Status

Draft – Core structure complete; awaiting finalized integration with live API endpoints and blockchain events.


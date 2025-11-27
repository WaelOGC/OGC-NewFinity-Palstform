# OGC NewFinity — Wallet & Token System Specification (v1.0)



## 1. Introduction

The Wallet & Token System is the financial backbone of the OGC NewFinity Ecosystem.  

It enables users to view token balances, track earnings, monitor Contribution-Based Mining, and sync on-chain activity with off-chain platform logic.



This document defines:

- Wallet architecture  

- Token balance management  

- Sync flow (Polygon ↔ Backend ↔ Dashboard)  

- Contribution-Based Mining  

- Reward distribution  

- Transaction types  

- Wallet user flows  

- Future token roadmap  



---



# 2. Wallet System Overview



Each user has **one platform wallet**, containing:

- Token balance  

- Contribution-Based Mining statistics  

- Reward claim history  

- Transaction history  



The wallet is **not a custodial crypto wallet**, but a **platform-linked account** displaying:

- On-chain OGCFinity balance  

- Off-chain activity (mining, rewards, platform earnings)  



The wallet dashboard is a **standalone interface** connected to core platform login.



---



# 3. Token Model Overview



### Current Token Version

- **OGCFinity – Genesis Token (Polygon, ERC-20, Fixed Supply)**  

- Deployed on **Polygon**  

- ERC-20 standard  

- Fixed supply: 500,000,000 OGCFinity (will NEVER increase on Polygon)  

- Acts as the foundational utility asset for the OGC NewFinity Ecosystem until the launch of the OGC Chain



### Future Token Version (Roadmap)

- **OGCFinity – Native Ecosystem Token (OGC Chain, Governance-Based Supply)**  

- Operates on the OGC NewFinity blockchain (OGC Chain)  

- Supports flexible, governance-driven issuance model (only on OGC Chain)  

- Contribution-Based Mining based  

- Governance-enabled  

- On-chain reward logic  



**Migration Logic**

A 1:1 migration mechanism will allow users to securely transfer OGCFinity (Polygon) to OGCFinity (Native) once the OGC Chain is launched. This migration:

- Will be optional for users
- Will be secured by a native bridge contract
- Will not inflate supply on Polygon
- Will not force conversion
- Will preserve token balances 1:1



---



# 4. Wallet Features



### 4.1 Balance Overview

Displays:

- On-chain token balance  

- Off-chain mining balance  

- Pending rewards  

- Total lifetime earnings  



### 4.2 Transaction History

Includes:

- Reward transactions  

- Mining payouts  

- Challenge winnings  

- Admin adjustments (visible with metadata)  

- Any synced on-chain transfers  



### 4.3 Contribution Mining Log

Shows:

- Points → token conversion  

- Daily mining activity  

- Mining multipliers (based on subscription tier)



### 4.4 Sync Blockchain Data

User can manually sync:

- Latest on-chain OGC balance  

- Recent transactions  

- Pending token movements  



System also performs **automatic periodic syncs**.



### 4.5 Rewards & Earnings

Displays all earnings from:

- Challenge rewards  

- Badge rewards (if applicable)  

- Contribution conversions  

- Seasonal events  



---



# 5. Transaction Types



| Type | Description |

|------|-------------|

| reward | Token given from challenges or achievements |

| mining | Token earned via contributions |

| deposit | User-initiated on-chain transfer |

| withdrawal | Future feature for off-chain → on-chain |

| admin_adjust | Admin correction or manual reward |



---



# 6. Blockchain Sync Architecture



### Sync Flow

1. Fetch user's wallet address  

2. Call Polygon node for balance + tx history  

3. Compare with local database  

4. Insert missing transactions  

5. Update displayed balance  

6. Log sync event  



### Sync Events

- Automatic daily sync  

- On-demand sync from dashboard  

- Sync triggered after reward distribution  



### Anti-Fraud Logic

- Any mismatch is flagged  

- Admin must approve suspicious adjustments  



---



# 7. Reward Distribution Logic



### Challenge Rewards

1. Admin confirms challenge results  

2. System calculates token rewards  

3. Reward transaction created  

4. Tokens added to user's wallet balance  

5. Transaction logged  



### Contribution Mining Rewards

Contribution points → token conversion rules:

- Conversion occurs daily or weekly  

- Formula (example):

tokens = contributions * multiplier * global_rate



yaml

Copy code

- Higher subscription = better multiplier  

- Admin adjusts global_rate seasonally  



---



# 8. Wallet Dashboard Structure



### Sections

- Overview  

- Earnings  

- Transactions  

- Mining History  

- Rewards  

- Sync Blockchain  



### UI Components

- Neon token card  

- Chart components  

- Sync button  

- Filterable transaction table  

- Contribution progress bar  



---



# 9. Backend Requirements



### Required Tables

- wallets  

- transactions  

- contributions  

- users  

- payments (indirect link)  



### Required Services

- Blockchain sync service  

- Reward distribution engine  

- Contribution conversion engine  

- Transaction logger  



### Required API Endpoints

- `/wallet`  

- `/wallet/transactions`  

- `/wallet/sync`  

- `/wallet/mining-history`  



---



# 10. Frontend Requirements



### Dashboard Functions

- Wallet graph & statistic cards  

- Transaction filters  

- Mining history timeline  

- Rewards breakdown  

- Sync animation component  



### Error & Edge Handling

- Invalid wallet address  

- Sync timeout  

- Zero-balance display  

- No mining history yet  



---



# 11. Security Requirements



- Wallet address validation  

- Anti-spam sync throttling  

- Admin-only manual adjustments  

- Logged transactions cannot be deleted  

- Sensitive operations require role checks  



---



# 12. Future Wallet & Token Expansions



- Smart-contract staking pools  

- Auto-compounding rewards  

- Multiple wallet linking  

- NFT badge integration  

- On-chain governance voting  

- Mobile wallet companion app  



---



# 13. Conclusion

The Wallet & Token System is essential to the OGC NewFinity Ecosystem.  

This specification defines all behaviors, rules, interactions, and requirements for both the backend and the dashboard.


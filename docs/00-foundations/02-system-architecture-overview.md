# OGC NewFinity — System Architecture Overview (v1.0)



## 1. Introduction

This document provides a complete architectural overview of the OGC NewFinity ecosystem, covering system layers, platform components, integrations, data flow, and core interactions.  

It is designed for engineering, planning, DevOps, and future governance teams.



## 2. High-Level Architecture Summary

OGC NewFinity is built as a modular, multi-layered ecosystem consisting of:



- **Frontend Layer** — React + Vite platforms and dashboards  

- **Backend Layer** — Node.js + Express services  

- **Database Layer** — MySQL + Prisma ORM  

- **AI Intelligence Layer** — Amy Agent, API models, custom integrations  

- **Blockchain Layer** — Polygon ERC-20 Token + future smart contracts  

- **Admin Operations Layer** — internal dashboards and analytic tools  



Each layer communicates through secure, versioned APIs.



## 3. Core Architecture Layers



### 3.1 Frontend Layer

Built with **React + Vite**, consisting of:



- **Main Platform** (dashboard, challenges, contributions, subscriptions)  

- **Wallet Dashboard** (standalone)  

- **Amy Agent Dashboard** (standalone)  

- **Public-facing WordPress site**



Each frontend uses:

- Component-based UI  

- Shared layout system  

- Centralized authentication state  

- Axios-based API client  



### 3.2 Backend Layer

Implemented in **Node.js + Express**, structured as modular services:



- Auth Service  

- Subscription Service  

- Wallet Service  

- Challenge Service  

- Contribution Service  

- Badge Service  

- Notifications Service  

- Admin Service  

- AI Gateway Service  



API responses follow a unified response pattern for consistency.



### 3.3 Database Layer

Powered by **MySQL**, managed via **Prisma ORM**.



Key database entities include:

- users  

- wallets  

- subscriptions  

- payments  

- challenges  

- submissions  

- contributions  

- badges  

- notifications  

- ai_logs  



All tables follow relational modeling with indexes and foreign keys.



### 3.4 AI Intelligence Layer

The AI layer includes:



- **Amy Agent** (gateway to multiple AI models)  

- OpenAI API integrations  

- OGC custom AI wrappers  

- Tier-based rate limiting  

- Usage tracking via `ai_logs`  



Future expansion:

- Local models  

- Fine-tuning  

- AI marketplace  



### 3.5 Blockchain Layer

Based on **Polygon ERC-20 OGC Token**, enabling:



- Token balance  

- Transaction history  

- Contribution mining  

- Challenge rewards  

- Staking (future)  

- Governance (future)  



The backend synchronizes on-chain and off-chain data.



### 3.6 Admin Operations Layer

Internal web-based dashboards for:



- Moderation  

- Analytics  

- User management  

- Badge assignments  

- Challenge approvals  

- Reports export  



Admins operate in a secure, protected environment.



## 4. System Integrations



### 4.1 Payment Integrations

- Stripe  

- Optional: CoinPayments (token payments)



### 4.2 Messaging & Notifications

- Email (SMTP provider)  

- Platform in-app notifications  



### 4.3 External Services

- CDN for media  

- Logging services  

- Monitoring tools (PM2, dashboards)  



## 5. Authentication & Security Model



### 5.1 Authentication

- JWT-based access tokens  

- Refresh tokens  

- Secured cookies  

- Role-based access control (RBAC)  



### 5.2 Security Protocols

- Input sanitization  

- SQL injection prevention  

- API rate limiting  

- Encrypted password storage  

- HTTPS enforcement  



## 6. System Interaction Flow (Simplified)



### User Login

1. User submits credentials  

2. Auth service verifies  

3. Tokens issued  

4. Frontend stores session  

5. User is routed to dashboard  



### Using AI Tools

1. User selects tool  

2. Request sent to AI Gateway  

3. Gateway routes to AI model  

4. Response logged in `ai_logs`  

5. User receives output  



### Challenge Participation

1. User joins challenge  

2. Uploads submission  

3. Submission stored  

4. Votes recorded  

5. Rewards calculated  



### Wallet Sync

1. Transaction detected on-chain  

2. Backend syncs data  

3. Wallet dashboard updates  



## 7. Future Architectural Expansions



- Fully decentralized reward distribution  

- On-chain governance system  

- NFT-based badge system  

- Advanced analytics pipeline  

- Multi-chain token compatibility  



## 8. Conclusion

This architecture blueprint defines the foundation and modular structure of the OGC NewFinity ecosystem.  

All future components, services, and integrations must follow this high-level system model.


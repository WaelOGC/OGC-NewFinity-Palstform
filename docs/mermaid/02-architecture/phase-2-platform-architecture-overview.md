# Phase 02 – Platform Architecture Overview (OGC NewFinity Platform)

## Objective

Define the structural and technological foundation of the OGC NewFinity Platform.

## Architecture Layers

1. **Frontend Layer**

   - Built with React + Vite for web and React Native for mobile.
   - Provides modular dashboards: Main Platform, Amy AI, Wallet.
   - Communicates with backend through secured REST API (v1).

2. **Backend Layer**

   - Node.js + Express + Prisma stack.
   - Handles authentication, user logic, transactions, and integration with blockchain.
   - Uses modular controllers and service architecture (clean API contracts per phase).

3. **Database Layer**

   - MySQL (Prisma ORM).
   - Core tables: users, wallets, transactions, subscriptions, badges, challenges, notifications.
   - Ensures referential integrity and scalable indexing.

4. **Blockchain Integration**

   - Polygon (OGCFinity – Genesis Token, ERC-20 standard, Fixed Supply: 500M).
   - Manages deposits, staking, and Contribution-Based Mining records.
   - Future: OGC Chain with OGCFinity Native Token (governance-based supply).

5. **AI Integration**

   - Amy AI Agent Suite connected via secure API bridge.
   - Offers content, code, and business-intelligence tools.

6. **Infrastructure & Deployment**

   - Frontend → Vercel / Render.
   - Backend → Dedicated Server / VPS + PM2 Monitoring.
   - Database → Cloud MySQL Instance.

## Standardized Architecture Diagram

See the official standardized platform architecture diagram:
- `docs/mermaid/00-standardized/platform-architecture-8-pillars-standardized.mmd`

The platform follows the 8-pillar architecture model:
1. Main Public Site
2. OGC NewFinity Platform (React + Vite)
3. OGC Wallet → OGC Vault
4. Amy AI Agent
5. Challenge Program Hub
6. Contribution-Based Mining Engine
7. Governance System
8. Marketplace & Developer Tools

## Deliverables

- System architecture diagram (Phase 04 link)
- Component hierarchy (Phase 03 link)
- Deployment map (DevOps integration)

## Status

Draft – To be expanded with detailed Mermaid diagram and infrastructure flow.


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

   - Polygon (OGC Token – ERC-20 standard).
   - Manages deposits, staking, and contribution mining records.

5. **AI Integration**

   - Amy AI Agent Suite connected via secure API bridge.
   - Offers content, code, and business-intelligence tools.

6. **Infrastructure & Deployment**

   - Frontend → Vercel / Render.
   - Backend → Dedicated Server / VPS + PM2 Monitoring.
   - Database → Cloud MySQL Instance.

## Diagram Placeholder

(A high-level Mermaid architecture diagram will be added after all subsystem definitions are finalized.)

## Deliverables

- System architecture diagram (Phase 04 link)
- Component hierarchy (Phase 03 link)
- Deployment map (DevOps integration)

## Status

Draft – To be expanded with detailed Mermaid diagram and infrastructure flow.


# Phase 04 – Unified Master Flow (OGC NewFinity Platform)

## Objective

Provide a complete, high-level system overview that links all major components of the OGC NewFinity Platform.

This phase acts as the "map of maps" — showing how all subsystems communicate and depend on one another.

## Core Components

1. **Frontend Clients**

   - Web App (React + Vite)
   - Mobile App (React Native)
   - Admin Panel (protected routes)

2. **APIs & Middleware**

   - Auth API (Phase 8.2)
   - Subscription API (Phase 8.3)
   - Wallet API (Phase 8.4)
   - Transactions & Blockchain API (Phase 8.5)
   - Notifications API (Phase 8.6)
   - Admin & Analytics APIs (Phase 8.7–8.8)

3. **Core Modules**

   - User System  
   - Amy AI Agent Suite  
   - Wallet System (Polygon Integration)  
   - Challenge Program and Badges System  
   - Governance & Permissions Framework  

4. **Infrastructure**

   - Backend → Node.js + Express + Prisma  
   - Database → MySQL (Cloud)  
   - Blockchain → Polygon Node / Web3 Provider  
   - File Storage → Cloud S3 / IPFS (for media and AI outputs)  
   - Monitoring → PM2 / Logging Service  

## High-Level Data Flow

- User → Frontend → Auth → Platform Dashboard  
- Dashboard → Service Modules (AI, Wallet, Challenges)  
- Each Service Module ↔ Dedicated API ↔ Database / Blockchain  
- Notifications API monitors and pushes updates to user sessions  
- Governance module enforces policies across all transactions and actions  

## Diagram Placeholder

A single Mermaid system diagram will be added here to illustrate:

- All front-end clients  
- All API contracts (8.x series)  
- Core modules and their relationships  
- Database and blockchain integration points  

## Deliverables

- Unified Master Flow diagram (Mermaid)  
- Infrastructure map for deployment and scalability  
- Service communication matrix (JSON or CSV)  

## Dependencies

- Requires Phase 03 (Platform Flows)  
- References Phase 02 (Security & Architecture)  
- Extends to Phases 05–08 for backend sequencing and API integration  

## Status

Draft – To be finalized after Phase 08 (API Contracts) and Phase 07 (Data Models) are complete.


# Phase 03 – Platform Flows Overview (OGC NewFinity Platform)

## Objective

Define the end-to-end flow of how users, admins, and system services interact with the platform modules.

## Core Flow Layers

1. **User Flow Layer**

   - Entry points: registration, login, dashboard access.
   - Access control through Auth API (Phase 8.2).
   - User navigates to services: Wallet, Amy AI, Challenges, or Profile.

2. **System Flow Layer**

   - Backend routes requests through Express controllers.
   - Middleware ensures security, token verification, and rate limiting.
   - Data retrieved or updated through Prisma (DB layer).

3. **Integration Flow Layer**

   - Wallet API communicates with blockchain node (Polygon).
   - Amy AI interacts with external AI APIs (OpenAI and internal models).
   - Notification service triggers in-app and email alerts.

4. **Administrative Flow Layer**

   - Admin dashboard for moderation, analytics, and system control.
   - Permissions verified by Governance module (Phase 6).

## Diagram Placeholder

A consolidated Mermaid chart will be added here to visualize:

- User onboarding → Auth → Subscription → Dashboard navigation.
- Interactions between Wallet, AI, and Challenge modules.
- Administrative oversight and analytics.

## Deliverables

- Platform user flow diagram (Mermaid)
- Admin system flow diagram (Mermaid)
- Integration reference for API layers (8.x)

## Notes

This phase acts as the central navigation and interaction framework for all future phases.

## Status

Draft – Awaiting integration of finalized module connections (Phase 04).


# Phase 07 – Data Models & Prisma Layer Overview (OGC NewFinity Platform)

## Objective

Define the database schema architecture, entity relationships, and Prisma ORM integration for the OGC NewFinity Platform.

## Core Design Principles

1. **Modular Structure:** Each major feature (Auth, Wallet, Challenges, AI, Governance) has its own schema segment.  
2. **Scalability:** All relations are normalized; indexes and foreign keys are explicitly defined.  
3. **Security & Integrity:** Referential integrity, foreign key constraints, and controlled cascading.  
4. **Auditability:** Every critical action recorded with timestamps and actor references.  
5. **Extensibility:** Models can evolve without breaking upstream dependencies.

## Primary Entities

| Entity | Purpose | Relationships |
|:--------|:----------|:---------------|
| **User** | Stores user identity and profile information. | 1–1 Wallet, 1–N Transactions, 1–N Badges |
| **Wallet** | Manages balances, staking, and token addresses. | 1–N Transactions, 1–N Rewards |
| **Transaction** | Records deposits, withdrawals, staking, and rewards. | N–1 Wallet, N–1 User |
| **Subscription** | Defines plan type, status, and expiry. | 1–1 User |
| **Challenge** | Represents public competitions and events. | 1–N Submissions, 1–N Rewards |
| **Submission** | User’s entry into a challenge. | N–1 Challenge, N–1 User |
| **Badge** | Achievements and recognition for users. | N–N User via user_badges |
| **Notification** | Stores messages and delivery states. | N–1 User |
| **AuditLog** | Records administrative and critical actions. | N–1 Admin |
| **Admin** | Internal operator account. | 1–N AuditLog |

## Prisma Layer Integration

- **ORM:** Prisma (connected to MySQL)
- **Schema Source:** `/prisma/schema.prisma`
- **Generated Client:** Type-safe, used across backend services
- **Migration Workflow:** Prisma Migrate for schema evolution  
- **Seeding:** Default roles, admin account, and test data included

## Data Flow

- User signs up → entry in `users`  
- System creates `wallet` automatically  
- Every token or challenge action creates a linked `transaction`  
- Admin actions produce `audit_logs`  
- Notifications generated asynchronously via queue service  

## Diagram Placeholder

Future Mermaid ERD will include:

- All tables and primary relationships  
- Prisma schema annotations  
- Directional references for cascading updates  

## Deliverables

- Entity-relationship diagram (Mermaid)  
- Prisma schema reference  
- Migration sequence map  
- Seeding and data consistency guide  

## Integration Points

- APIs (Phases 8.x) rely on this schema.  
- Governance and audit tables reference Phase 06 definitions.  
- AI and wallet modules inherit user and transaction structures.  

## Status

Draft – Base data structure complete; awaiting ERD visualization and Prisma schema refinement.


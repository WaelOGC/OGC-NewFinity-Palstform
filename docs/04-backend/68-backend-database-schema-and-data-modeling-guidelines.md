# OGC NewFinity — Backend Database Schema & Data Modeling Guidelines (v1.0)



## 1. Introduction

This document defines the **database modeling rules**, **schema guidelines**, and **structural standards** for all backend systems inside the OGC NewFinity ecosystem.



The database must be:

- Structured  

- Predictable  

- Extensible  

- Secure  

- Optimized for performance  

- Fully aligned with Prisma + PostgreSQL best practices  



These standards ensure long-term scalability and prevent architectural drift.



---



# 2. Database Technology



### Primary:

- **PostgreSQL** (core database)



### ORM:

- **Prisma ORM**



### Storage Types:

- JSONB  

- TEXT  

- INT  

- BIGINT  

- ENUM  

- TIMESTAMP with timezone  



---



# 3. General Modeling Rules



### 3.1 Naming Conventions

- Table names → **singular** (`User`, `Challenge`, `Submission`)

- Column names → **camelCase**

- Relation tables → **PascalCase with join names**

- Always use **id** as primary key



### 3.2 Primary Keys

Use:

id String @id @default(cuid())



makefile

Copy code



### 3.3 Timestamp Fields

Every model must include:

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt



shell

Copy code



### 3.4 Soft Deletes (If Needed)

deletedAt DateTime?



yaml

Copy code



Used only where logical deletion is safer than hard delete.



---



# 4. Relationships



### 4.1 One-to-Many

Example:

User 1 ────∞ Submission

Challenge 1 ────∞ Submission



yaml

Copy code



### 4.2 Many-to-Many

Use explicit join tables for clarity.



### 4.3 Cascade Rules

- Submissions belong to challenges  

- Contributions belong to users  

- Rewards belong to submissions  



Use **restrict** for destructive operations:

- Prevent accidental cascade deletes



---



# 5. Standard Core Models



Below are the **required models**, not full schema, but structural guidelines.



---



## 5.1 User Model

Contains:

- Email  

- Password hash  

- Role  

- Subscription tier  

- Avatar  

- Status (active/suspended/deleted)  



Relations:

- Submissions  

- Badges  

- Contributions  

- Wallet  



---



## 5.2 Wallet Model



Contains:

- Balance  

- Available balance  

- Pending rewards  

- Sync status  



Relations:

- User 1:1  

- Transactions 1:N  



---



## 5.3 Transaction Model



Contains:

- Type (reward/mining/manual/adjustment)  

- Amount  

- Status  

- Metadata (JSONB)  

- Timestamp  



---



## 5.4 Challenge Model



Contains:

- Title  

- Category  

- Description  

- Timeline  

- Track  

- Status (draft/published/closed/archived)  



Relations:

- Submissions  

- Rewards  



---



## 5.5 Submission Model



Contains:

- Content or file reference  

- Metadata JSON  

- Status (pending/approved/rejected)  

- Review comments  

- Linked challenge  



Relations:

- Challenge  

- User  

- Reward entry  



---



## 5.6 Contribution Model



Contains:

- Contribution type  

- Points value  

- Related challenge/submission  

- System-generated flag  



---



## 5.7 Badge Model



Contains:

- Name  

- Category  

- Level  

- Icon  

- Visibility  



Relation:

- Many badges → many users (join table)  



---



## 5.8 Notification Model



Contains:

- Type  

- Payload JSON  

- Read status  

- User ID  



---



## 5.9 Subscription Model



Contains:

- Tier  

- Expiration date  

- Source (manual/auto/admin)  

- Notes  



---



## 5.10 Audit Model



Contains:

- Admin action  

- Entity type  

- Before/after JSON  

- IP address  

- Severity level  



---



# 6. JSONB Usage Guidelines



Use JSONB for:

- Metadata  

- Logs  

- Dynamic fields  

- Flexible payloads  

- AI data  

- Webhook content  



Do NOT use JSONB for:

- Core functional data  

- Values needed for filtering or sorting  

- IDs or relational keys  



---



# 7. Indexing Rules



### Must index:

- Foreign keys  

- Email  

- Status fields  

- Timestamps  

- rate-limit counters  

- Subscription expiration  

- Challenge status  

- Notification read status  



### Index recommendations:

- Composite indexes for common filters  

- Avoid over-indexing (balance performance)



---



# 8. Performance Requirements



- Normalize schemas  

- Avoid large text fields unless needed  

- Use streaming for large files (not DB)  

- Use pagination for all list queries  

- Avoid N+1 patterns  



Prisma must use:

- `include` for eager loads  

- `select` for partial fetches  

- `transaction()` for atomic operations  



---



# 9. Security Requirements



- No plaintext passwords  

- Limit direct user access to sensitive fields  

- Mask confidential values  

- Enforce row-level security for admin operations  

- Validate all enums  

- Use transactions for financial writes  



---



# 10. Future DB Modules



- Payment processing  

- AI usage logs  

- Websocket event logs  

- Blockchain sync table  

- Admin roles expansion  

- System-wide cache metadata  



---



# 11. Example Schema Structure (Simplified)



User

├── Wallet

├── Submissions

├── Contributions

├── Badges (join)

└── Notifications



Challenge

├── Submissions

└── Rewards



Submission

├── Review workflow

└── Reward entry



yaml

Copy code



---



# 12. Conclusion



This document defines the database modeling guidelines for OGC NewFinity.  

Every backend developer must follow these rules to ensure consistency, scalability, and long-term maintainability.


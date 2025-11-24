# OGC NewFinity — Database Schema & Entity Relationship Model (v1.0)



## 1. Introduction

This document defines the full database schema, entity structures, fields, relationships, constraints, and indexing strategy for the OGC NewFinity platform.  

It serves as the foundation for backend engineering, Prisma modeling, data migrations, and future system scalability.



The database is implemented using **MySQL** and managed via **Prisma ORM**.



---



# 2. Core Entities Overview



OGC NewFinity uses the following primary tables:



1. **users**  

2. **wallets**  

3. **transactions**  

4. **subscriptions**  

5. **payments**  

6. **badges**  

7. **user_badges**  

8. **contributions**  

9. **challenges**  

10. **submissions**  

11. **notifications**  

12. **ai_logs**  

13. **admins**



Each table is defined in detail below.



---



# 3. Table Definitions



---



## 3.1 users

### Purpose  

Stores core user account data and role assignments.



### Fields

- id (PK)  

- email (unique)  

- password_hash  

- role (enum: standard, pro, enterprise, admin)  

- name  

- avatar_url  

- created_at  

- updated_at  



### Notes  

- Email must be unique  

- Passwords must be hashed  

- Role controls access permissions  



---



## 3.2 wallets

### Purpose  

Stores token-related data linked to a user.



### Fields

- id (PK)  

- user_id (FK → users.id)  

- wallet_address  

- token_balance  

- staking_balance (future)  

- created_at  

- updated_at  



### Notes  

- Each user has exactly one wallet  



---



## 3.3 transactions

### Purpose  

Records token movements and activity.



### Fields

- id (PK)  

- user_id (FK)  

- type (enum: reward, mining, withdrawal, deposit)  

- amount  

- tx_hash (nullable)  

- source (on_chain / off_chain)  

- created_at  



---



## 3.4 subscriptions

### Purpose  

Manages user subscription tiers.



### Fields

- id (PK)  

- user_id (FK)  

- plan (enum: free, pro, enterprise)  

- status (active, expired, canceled)  

- start_date  

- end_date  

- created_at  



---



## 3.5 payments

### Purpose  

Stores payment records for subscription transactions.



### Fields

- id (PK)  

- user_id (FK)  

- amount  

- currency  

- payment_method  

- payment_status  

- reference_id  

- created_at  



---



## 3.6 badges

### Purpose  

Defines all available badges.



### Fields

- id (PK)  

- name  

- description  

- tier (common, rare, epic, legendary)  

- icon_url  

- created_at  



---



## 3.7 user_badges

### Purpose  

Maps badges to users.



### Fields

- id (PK)  

- user_id (FK)  

- badge_id (FK)  

- earned_at  



---



## 3.8 contributions

### Purpose  

Tracks how users earn contribution points.



### Fields

- id (PK)  

- user_id (FK)  

- action_type  

- points  

- metadata (JSON)  

- created_at  



---



## 3.9 challenges

### Purpose  

Defines global and category-based challenges.



### Fields

- id (PK)  

- title  

- description  

- category  

- track (students, groups, freelancers)  

- prize_pool  

- status (open, closed)  

- start_date  

- end_date  

- created_at  



---



## 3.10 submissions

### Purpose  

Stores user-submitted entries for challenges.



### Fields

- id (PK)  

- challenge_id (FK)  

- user_id (FK)  

- content_url  

- votes  

- status (pending, approved, rejected)  

- created_at  



---



## 3.11 notifications

### Purpose  

Stores in-app notifications for users.



### Fields

- id (PK)  

- user_id (FK)  

- title  

- message  

- type  

- is_read  

- created_at  



---



## 3.12 ai_logs

### Purpose  

Stores logs of AI tool usage for analytics and billing.



### Fields

- id (PK)  

- user_id (FK)  

- tool_name  

- tokens_used  

- response_time_ms  

- metadata (JSON)  

- created_at  



---



## 3.13 admins

### Purpose  

Internal admin accounts with elevated privileges.



### Fields

- id (PK)  

- user_id (FK)  

- admin_level  

- created_at  



---



# 4. Entity Relationship Diagram (ERD)



users

├── wallets (1:1)

├── subscriptions (1:M)

├── payments (1:M)

├── contributions (1:M)

├── submissions (1:M)

├── notifications (1:M)

├── ai_logs (1:M)

├── user_badges (1:M)

└── badges (M:1)



yaml

Copy code



Challenges Relationship:

challenges (1:M submissions)

submissions (M:1 users)



yaml

Copy code



Admin Relationship:

admins (1:1 users)



yaml

Copy code



---



# 5. Indexing Strategy



### Recommended Indexes

- users.email (unique)  

- wallets.user_id  

- subscriptions.user_id  

- payments.user_id  

- submissions.challenge_id  

- submissions.user_id  

- contributions.user_id  

- ai_logs.user_id  

- notifications.user_id  



### Composite Indexes

- submissions (challenge_id, user_id)  

- user_badges (user_id, badge_id)  



---



# 6. Future Database Enhancements



- NFT badge metadata tables  

- Governance voting tables  

- Staking pools  

- Team/organization structures  

- Multi-wallet support  

- Token streaming for earnings  



---



# 7. Conclusion

This database schema defines the structural backbone of the OGC NewFinity platform.  

All backend services, API routes, and frontend data layers must follow this schema to ensure proper integration, performance, and scalability.


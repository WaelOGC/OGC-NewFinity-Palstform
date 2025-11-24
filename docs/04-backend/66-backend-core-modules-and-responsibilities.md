# OGC NewFinity — Backend Core Modules & Responsibilities (v1.0)



## 1. Introduction

This document provides a detailed breakdown of all **core backend modules**, their responsibilities, boundaries, and how they interact inside the OGC NewFinity backend architecture.



This is the definitive reference for:

- Backend development  

- API design  

- Internal service separation  

- Module ownership  

- Dependency rules  

- Integration points  

- Security boundaries  



Every backend developer must follow these module responsibilities strictly to ensure clarity, scalability, and maintainability.



---



# 2. Module Overview



The backend is composed of **14 primary modules**:



1. Authentication  

2. User  

3. Subscription  

4. Wallet & Token  

5. Challenge  

6. Submission  

7. Contribution & Badge  

8. Notifications  

9. AI Gateway  

10. File Storage  

11. Admin  

12. Rate Limiting  

13. Logging & Observability  

14. Core (Config, Utils, Middleware)



Each module is isolated with well-defined boundaries.



---



# 3. Module Responsibilities (Detailed)



---



## 3.1 Authentication Module



### Responsibilities:

- Register users  

- Login & logout  

- Refresh token lifecycle  

- JWT access token creation  

- Cookie management (httpOnly, secure)  

- Password hashing  

- Email verification workflow  

- Password reset workflow  

- Token invalidation  

- Session tracking (future)  



### Cannot:

- Modify user profile  

- Modify subscription state  



### Dependencies:

- User module  

- Notification module (for verification emails)  



---



## 3.2 User Module



### Responsibilities:

- Store user profile data  

- Manage display name, avatar, bio  

- Manage roles & permissions  

- Access control integration (RBAC)  

- User settings  

- Account status (active/suspended/deleted)  



### Cannot:

- Modify subscription tier  

- Modify wallet balance  



### Dependencies:

- Subscription module  

- Wallet module (read-only)  



---



## 3.3 Subscription Module



### Responsibilities:

- Manage subscription tiers  

- Enforce service access rules  

- Evaluate expiration dates  

- Apply trial / bonus access  

- Subscription status overrides (admin)  

- Enforce tier-based rate limits  



### Cannot:

- Handle payment processing (future module)  

- Modify user profile  



### Dependencies:

- User module  

- Rate limiting module  

- Notification module  



---



## 3.4 Wallet & Token Module



### Responsibilities:

- Store OGC token balances  

- Handle transactions  

- Handle mining/contribution rewards  

- Reward distribution for challenges  

- Off-chain wallet ledger  

- Token synchronization (future chain)  

- Transaction logs  



### Cannot:

- Directly approve challenge submissions  

- Modify user subscription tier  



### Dependencies:

- Challenge module  

- Contribution module  

- Admin module (adjustments)  



---



## 3.5 Challenge Module



### Responsibilities:

- Create/edit challenges  

- Manage categories & tracks  

- Manage timelines  

- Track participation  

- Challenge publication workflow  

- Archive & close challenges  



### Cannot:

- Approve submissions  

- Modify user wallet  



### Dependencies:

- Admin module  

- Submission module  



---



## 3.6 Submission Module



### Responsibilities:

- Accept user submissions  

- Validate file uploads  

- Store metadata  

- Link submissions to challenges  

- Manage review workflow  

- Score submissions (future)  

- Provide submission status updates  



### Cannot:

- Award tokens  

- Modify challenge data directly  



### Dependencies:

- File storage module  

- Challenge module  

- Notification module  



---



## 3.7 Contribution & Badge Module



### Responsibilities:

- Log all user contributions  

- Award contribution points  

- Assign badges  

- Manage manual adjustments  

- Track participation metrics  



### Cannot:

- Approve challenges  

- Modify wallet balances directly (only via Wallet module)  



### Dependencies:

- Challenge module  

- Wallet module  

- Admin module  



---



## 3.8 Notifications Module



### Responsibilities:

- Create notifications  

- Target notifications by user/tier  

- Deliver notifications  

- Track read status  

- Handle emails & SMS  

- Broadcast via admin  

- System-wide announcements  



### Cannot:

- Modify user or challenge data  

- Execute business logic for other modules  



### Dependencies:

- User module  

- Email/SMS providers  

- Admin module  



---



## 3.9 AI Gateway Module



### Responsibilities:

- Route AI requests  

- Apply rate limits per tier  

- Enforce AI quotas  

- Handle model switching  

- Log AI usage  

- Pass user context to AI tools  



### Cannot:

- Modify wallet balances  

- Modify challenges or submissions  



### Dependencies:

- Rate limiting module  

- User module  

- Subscription module  



---



## 3.10 File Storage Module



### Responsibilities:

- Upload files  

- Create signed URLs  

- Store public/private files  

- Validate file types  

- Securely serve downloads  



### Cannot:

- Modify submissions directly  



### Dependencies:

- Submission module  

- Admin module  



---



## 3.11 Admin Module



### Responsibilities:

- Provide admin-side APIs  

- Manage data tables  

- Handle moderation actions  

- Handle system settings  

- Manage email/SMS templates  

- Admin-only controls  

- Suspension & deletion of accounts  

- Admin roles & permissions  



### Cannot:

- Override audit logs  

- Access user passwords  



### Dependencies:

- All core modules  



---



## 3.12 Rate Limiting Module



### Responsibilities:

- Enforce global and per-endpoint rate limits  

- Apply tier-based quotas  

- Track usage spikes  

- Trigger automated throttling  

- Log rate-limit events  



### Cannot:

- Modify subscription status  

- Modify wallet balances  



### Dependencies:

- Subscription module  

- Logging module  



---



## 3.13 Logging & Observability Module



### Responsibilities:

- Store API logs  

- Store error logs  

- Store system logs  

- Aggregate metrics  

- Provide filtered log access  

- Track system events  

- Power audit trail  



### Cannot:

- Modify business logic  



### Dependencies:

- All modules  



---



## 3.14 Core Module



The foundation:



### Responsibilities:

- Environment config  

- Middlewares  

- Shared utilities  

- Common response format  

- Error handling  

- Security wrappers  

- Application bootstrap logic  



### Cannot:

- Modify any business logic directly  



### Dependencies:

- None (root layer)  



---



# 4. Module Interaction Rules



### 1. Modules communicate only via service layers  

No direct database access between modules.



### 2. Circular dependencies are forbidden  

Example:

- User → Subscription → User ❌  

Must restructure using shared utilities.



### 3. Write operations must respect domain ownership  

Example:

- Submission module cannot write to wallets  

- Subscription module cannot write to challenges  



### 4. Side-effects must be handled via events (future)  

Example:

- Submission approved → reward event → wallet module handles reward  



---



# 5. Module Dependency Graph



Simplified:



Auth → User → Subscription → Rate Limiting

│

├── Wallet ← Contribution ← Challenge ← Submission

│ │

├── Notifications ────────┘

│

└── Admin ↔ Logging/Observability



yaml

Copy code



---



# 6. Future Module Extensions



- Payment processing module  

- Event bus module  

- AI inference runtime  

- Multi-chain wallet module  

- User analytics module  



---



# 7. Conclusion



This document defines all backend core modules and their exact responsibilities.  

Adhering to these boundaries ensures clean architecture, easier scalability, and long-term maintainability for the NewFinity ecosystem.


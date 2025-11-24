# OGC NewFinity — API Architecture & Endpoint Inventory (v1.0)



## 1. Introduction

This document provides a full overview of the API architecture for the OGC NewFinity ecosystem.  

It defines service boundaries, endpoint groups, naming conventions, authentication rules, and the complete inventory of APIs used by the platform before writing formal API contracts.



This file is the master reference for backend development and API documentation.



---



# 2. API Architecture Overview



## 2.1 Architecture Style

- RESTful API  

- JSON responses  

- Versioned endpoints (`/api/v1/*`)  

- Centralized error handling  

- Layered middleware stack  

- RBAC-based authorization  



## 2.2 Service Structure

The backend is divided into these core modules:



1. **Auth Service**  

2. **User Service**  

3. **Wallet Service**  

4. **Transaction Service**  

5. **Subscription Service**  

6. **Payment Service**  

7. **Challenge Service**  

8. **Submission Service**  

9. **Badge Service**  

10. **Contribution Service**  

11. **Notification Service**  

12. **Amy AI Gateway Service**  

13. **Admin Service**



Each module contains its own controller, service, middleware, and schema-level validation.



---



# 3. Naming Conventions



## 3.1 Routes

- Use dashed URLs: `/api/v1/user-profile`  

- Use nouns, not verbs  

- Resource-based naming  



## 3.2 Methods

- GET → Fetch  

- POST → Create  

- PUT → Update  

- PATCH → Partial update  

- DELETE → Remove  



## 3.3 Status Codes

- 200 → Success  

- 201 → Created  

- 400 → Bad request  

- 401 → Unauthorized  

- 403 → Forbidden  

- 404 → Not found  

- 409 → Conflict  

- 500 → Server error  



---



# 4. Endpoint Inventory (Master List)



Below is the complete structured list of all API endpoints required by the platform, grouped by module.



---



# 4.1 Auth Service (Authentication & Sessions)



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/auth/register` | Create user account |

| POST | `/auth/login` | Authenticate user |

| POST | `/auth/refresh` | Refresh Access Token |

| POST | `/auth/logout` | Logout + revoke session |

| POST | `/auth/forgot-password` | Send reset instructions |

| POST | `/auth/reset-password` | Apply new password |

| GET | `/auth/me` | Get current session user |



---



# 4.2 User Service (Profile & Account)



| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | `/users/me` | Fetch user profile |

| PUT | `/users/me` | Update profile |

| PUT | `/users/me/avatar` | Change avatar |

| GET | `/users/:id` | Public profile lookup |



---



# 4.3 Wallet Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | `/wallet` | Wallet overview |

| GET | `/wallet/transactions` | Transaction history |

| POST | `/wallet/sync` | Sync blockchain data |

| POST | `/wallet/link-address` | Link wallet address |

| GET | `/wallet/mining-history` | Contribution mining activity |



---



# 4.4 Transaction Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/transactions/reward` | Admin reward distribution |

| POST | `/transactions/manual` | Admin issue manual adjustment |

| GET | `/transactions/:id` | Get a specific transaction |



---



# 4.5 Subscription Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | `/subscriptions/plans` | List all subscription tiers |

| GET | `/subscriptions/current` | Current user subscription |

| POST | `/subscriptions/upgrade` | Upgrade plan |

| POST | `/subscriptions/cancel` | Cancel subscription |

| GET | `/subscriptions/history` | View subscription history |



---



# 4.6 Payment Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/payments/checkout` | Create payment session |

| POST | `/payments/webhook` | Handle payment webhook |

| GET | `/payments/history` | Get payment history |



---



# 4.7 Challenge Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | `/challenges` | List challenges |

| GET | `/challenges/:id` | Challenge details |

| POST | `/challenges/enter` | Join a challenge |

| GET | `/challenges/categories` | List categories |

| GET | `/challenges/track/:track` | List track challenges |



---



# 4.8 Submission Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/submissions` | Submit challenge entry |

| GET | `/submissions/user` | User's submissions |

| GET | `/submissions/:id` | Submission details |

| POST | `/submissions/:id/vote` | Vote for a submission |



---



# 4.9 Badge Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | `/badges` | View all badges |

| GET | `/badges/mine` | User's badges |



---



# 4.10 Contribution Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | `/contributions` | Contribution log |

| GET | `/contributions/stats` | User's contribution stats |



---



# 4.11 Notification Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | `/notifications` | All notifications |

| POST | `/notifications/read/:id` | Mark as read |

| POST | `/notifications/read-all` | Mark all as read |



---



# 4.12 Amy AI Gateway Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/ai/generate` | Primary text generation |

| POST | `/ai/tool` | Tool-specific action |

| GET | `/ai/history` | User AI usage history |



---



# 4.13 Admin Service



| Method | Endpoint | Description |

|--------|----------|-------------|

| GET | `/admin/users` | List users |

| GET | `/admin/users/:id` | User details |

| POST | `/admin/users/update-role` | Change user role |

| GET | `/admin/challenges` | Review challenges |

| POST | `/admin/challenges` | Create challenge |

| POST | `/admin/submissions/:id/approve` | Approve submission |

| POST | `/admin/submissions/:id/reject` | Reject submission |

| GET | `/admin/logs` | System logs |



---



# 5. Versioning Strategy

- Current: `/api/v1`  

- Future versions will use `/api/v2`, `/api/v3`, etc.  

- Deprecated endpoints must remain for at least 1 version unless security dictates removal.



---



# 6. Future API Expansions



Planned additions:

- Governance API  

- On-chain staking API  

- NFT badge API  

- Organization/team API  

- AI marketplace API  



---



# 7. Conclusion

This inventory outlines all API modules and endpoints required for the OGC NewFinity platform.  

Each module will receive a full, formal API contract document in later documentation phases.


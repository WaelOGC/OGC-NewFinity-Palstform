# Phase 11 – Backend Implementation Blueprint (OGC NewFinity Platform)

## Objective

Establish a production-ready backend architecture using Node.js, Express, and Prisma that supports every API, service, and data model defined in Phases 02–10.

## 1. Tech Stack Overview

| Layer | Technology | Purpose |
|:------|:------------|:---------|
| **Runtime** | Node.js (v18+) | Primary execution environment |
| **Framework** | Express 5 | Routing, middleware, and REST endpoints |
| **ORM** | Prisma v5 | Data modeling and database abstraction |
| **Database** | MySQL 8 (cloud-hosted) | Core data storage |
| **Auth** | JWT + Refresh Tokens | Authentication and session lifecycle |
| **Cache** | Redis (optional) | Session and query caching |
| **Queue** | BullMQ / RabbitMQ | Background jobs, notifications |
| **Blockchain** | Web3.js / Ethers.js | Polygon integration for wallet ops |
| **Logging** | Winston + PM2 | Structured logging and monitoring |

---

## 2. Folder Structure Plan

```
backend/
├── src/
│   ├── controllers/    # Route logic
│   ├── routes/         # Endpoint registration
│   ├── services/       # Business logic
│   ├── middleware/     # Auth, rate-limit, validation
│   ├── prisma/         # Prisma client and schema
│   ├── utils/          # Helpers (logger, formatters)
│   ├── config/         # env, constants, secrets
│   └── index.js        # app entry
├── tests/
├── package.json
├── .env.example
└── README.md
```

---

## 3. Core Modules to Implement

1. **Auth Module**

   - Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
   - Token rotation + scope validation middleware

2. **User Module**

   - CRUD for user profiles and role assignment
   - Integration with Governance Phase 06

3. **Wallet Module**

   - Endpoints: `/wallet`, `/wallet/transfer`, `/wallet/stake`
   - Uses Ethers.js for Polygon transactions and Prisma for record storage

4. **Challenge Module**

   - CRUD for challenges + submissions
   - Reward and badge distribution logic

5. **Notification Module**

   - Job queue for email / push delivery
   - Webhook receiver for external providers

6. **Admin Module**

   - Protected routes for moderation, reporting, analytics
   - RBAC checks via Governance Phase 06

7. **Analytics Module**

   - Event collector + query engine for usage metrics

---

## 4. Security and Middleware

- **Rate Limiting:** express-rate-limit (per IP + endpoint)
- **Helmet:** HTTP header hardening
- **CORS:** Strict whitelist for frontend domains
- **Validation:** Zod / Joi schemas for body and params
- **Audit Logs:** Automatic insert to `audit_logs` on critical actions

---

## 5. Database & Prisma

- File: `/prisma/schema.prisma`  
- Models: User, Wallet, Transaction, Subscription, Challenge, Submission, Badge, UserBadge, Notification, AuditLog, Admin  
- Migration Flow: `npx prisma migrate dev → deploy`
- Seed Script: Create Super Admin and default plans

---

## 6. API Integration Map

| Module | Depends On | Connected Phase |
|:--------|:------------|:----------------|
| Auth | Prisma (User) | 8.2 |
| Wallet | Prisma + Web3 | 8.4 + 8.5 |
| Subscription | Payment API | 8.3 |
| Notifications | Queue + Provider Webhook | 8.6 |
| Admin | Governance | 8.7 |
| Analytics | DB + Events Collector | 8.8 |

---

## 7. Deployment Checklist

- [ ] Configure environment variables (.env)
- [ ] Connect to staging MySQL database
- [ ] Initialize Prisma migrations
- [ ] Enable CORS and rate limiter
- [ ] Deploy to Render / VPS with PM2 monitoring

---

## 8. Next Steps

1. Generate Prisma schema and seed data  
2. Scaffold Express app with controller templates  
3. Add Auth and Wallet modules first (critical path)  
4. Integrate Challenge and Notification modules  
5. Implement CI/CD pipeline with automated lint/test runs  

---

**Author:** OGC Technologies  
**Version:** v1.0 – Backend Architecture Blueprint  
**Date:** 2025-11-05


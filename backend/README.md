# OGC NewFinity – Backend

## Quickstart
1. Copy `.env.example` to `.env` and set values.
2. Install deps:
   ```bash
   npm install

Generate Prisma client & run migrations:

npx prisma generate
npx prisma migrate dev --name init

Seed:

npm run seed

Run: <!-- Backend + DB: OFFLINE -->

npm run dev

Endpoints

GET /healthz – liveness

GET /api/v1/readyz – readiness

GET /api/v1/version – version

POST /api/v1/auth/register

POST /api/v1/auth/login

POST /api/v1/auth/refresh

POST /api/v1/auth/logout (auth)

GET /api/v1/wallet (auth)

GET /api/v1/wallet/transactions (auth)

POST /api/v1/wallet/transfer (auth)

POST /api/v1/wallet/stake (auth)

POST /api/v1/wallet/unstake (auth)

---

### What to do after files are created

1) Install dependencies (when Node/npm available):
```bash
cd backend
npm install

Create your .env:

cp .env.example .env

Initialize Prisma & DB:

npx prisma generate
npx prisma migrate dev --name init
npm run seed

Start the server: <!-- Backend + DB: OFFLINE -->

npm run dev


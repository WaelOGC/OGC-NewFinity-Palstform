# Phase 12 – Frontend Integration Blueprint (OGC NewFinity Platform)

## Objective

Deliver a production-ready React + Vite (TypeScript) client that consumes the backend APIs defined in Phases 8.x and validated by Phase 11 backend scaffolding.

## Tech Stack

- React + Vite + TypeScript
- Lightweight state via Context (tokens, user)
- Fetch-based API client, JWT in memory (no localStorage for access tokens)
- Env: VITE_API_BASE_URL (default http://localhost:4000)

## Layout

- `/` -> redirect to /wallet when authenticated, or to /login
- `/login` -> LoginPage (auth)
- `/wallet` -> WalletPage (summary + transactions list)
- Components kept minimal and composable

## Security Notes

- Access token held in memory; refresh token endpoint available for future enhancement.
- All requests attach `Authorization: Bearer <token>` when available.
- Handle 401 by forcing logout and redirect to /login.

## Integration Scope (Initial)

- Auth API:
  - POST /auth/login
  - POST /auth/refresh (reserved for later)
- Wallet API:
  - GET /wallet
  - GET /wallet/transactions

## Next (Phase 12.1+)

- Protected routes
- Role-based UI (governance-aware)
- Error boundary + toast notifications
- Form validation and input schemas










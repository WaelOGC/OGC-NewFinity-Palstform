# API Tests — OGC NewFinity Platform

API tests validate HTTP endpoints for correctness, validation, and security.

---

## Rules for API Tests

- Use a test server instance.

- Use mock tokens or test user accounts.

- Must cover all HTTP status codes.

- Must follow naming: `<endpoint>.api.test.js`

---

## Example Structure

/backend/tests/api/

---

## Example Use Cases

- POST /auth/login

- GET /wallet/balance

- POST /amy/tool


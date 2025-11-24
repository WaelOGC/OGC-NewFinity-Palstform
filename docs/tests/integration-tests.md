# Integration Tests — OGC NewFinity Platform

Integration tests validate multiple modules working together.

---

## Rules for Integration Tests

- Can access the database (test DB only).

- May interact with multiple services.

- Must follow naming: `<module>.integration.test.js`

---

## Example Structure

/backend/tests/integration/

/frontend/tests/integration/

---

## Example Use Cases

- Wallet balance + transaction sync

- Auth login + token refresh

- Challenge submission + rewards issuance


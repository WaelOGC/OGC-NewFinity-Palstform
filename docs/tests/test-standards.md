# Test Standards — OGC NewFinity Platform

All tests must follow these standards:

---

## 1. Naming

- Use kebab-case or dot notation.

- Include test type (unit, integration, api).

- Example: wallet-processor.unit.test.js

---

## 2. Code Style

- Use consistent formatting.

- Avoid complex logic inside test files.

- Use helper functions to reduce duplication.

---

## 3. Coverage Expectations

- Critical modules: > 80%

- Standard modules: > 60%

- Auto-generated code: optional

---

## 4. Required Validations

Every test must check:

- success response

- failure response

- invalid input scenario

- edge case scenario

---

## 5. Documentation

Every new test module must be recorded in the changelog.


# Naming Rule Validation

Future CI/CD must enforce naming rules for all documentation and diagrams.

---

## 1. Mermaid Naming Rules

phase-X[.Y]--category--topic.mmd  

`auto--<category>--<topic>.mmd`  

---

## 2. Documentation File Rules

- Lowercase names

- No spaces

- Use hyphens only

- No timestamps

---

## 3. CI/CD Enforcement

The pipeline will:

- Reject commits with invalid names

- Block PRs that violate rules

- Produce error messages with file paths


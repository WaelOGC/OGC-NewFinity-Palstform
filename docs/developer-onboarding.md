# 🚀 Developer Onboarding Guide — OGC NewFinity Platform

Welcome to the development ecosystem for the OGC NewFinity Platform.  
This guide introduces the folder structure, development workflow, and documentation rules.

---

# 1. Project Structure (High-Level)

```
/backend     → Express + Prisma backend  
/frontend    → React + Vite platform  
/docs        → Documentation (you are here)  
/docs/mermaid → All system diagrams  
```

---

# 2. Mermaid Documentation Rules

### Naming Convention

```
phase-X[.Y]--category--topic.mmd
```

### Where diagrams live:

- `02-architecture` → Master architecture diagrams
- `03-platform-flows` → User and platform flows
- `04-layouts-and-navigation` → UI diagrams
- `05-core-sequences` → System sequences
- `06-governance` → Governance diagrams
- `07-data-models` → ERD & migrations
- `07-wallet-architecture` → Wallet & blockchain
- `08-api-contracts` → API specification
- `09-amy-agent` → Amy tool suite diagrams

---

# 3. How to Add New Diagrams

### Steps

1. Identify the correct folder  
2. Use the naming convention  
3. Add `.mmd` file  
4. Update the corresponding README  
5. Add a link inside `docs/mermaid/index.md`

---

# 4. Coding Workflow

- Use Cursor Agent for repetitive tasks  
- Maintain naming consistency  
- Keep all documentation updated  
- Follow the architecture and flow diagrams when adding new features

---

# 5. Contact & Maintenance

This guide is maintained by the OGC Technologies engineering team.  
For questions, reach out via the internal Slack channel.


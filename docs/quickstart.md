---
id: quickstart
title: OGC NewFinity Platform — Developer Quickstart Guide
sidebar_label: Developer Quickstart
---

# OGC NewFinity Platform — Developer Quickstart Guide

This guide gives developers a **fast, visual onboarding** to the OGC NewFinity Platform:  
where the key files live, how the system is structured, and where to go next.

---

## 1. What This Guide Covers

- Where to find the **core documentation**
- How the **repository is laid out**
- Where to locate **Mermaid diagrams** and **API blueprints**
- How to get a quick **mental model of the platform flow**
- What every developer is expected to follow

:::tip

If you only read **three documents** before starting work, read:

- `docs/index.md` – Documentation landing page  
- `docs/quickstart.md` – This guide  
- `docs/structure-map.md` – Repository structure overview  

:::

---

## 2. Repository Layout (High-Level)

```text
/
├── backend/                     # Express + Prisma backend (planned / in-progress)
├── frontend/                    # React + Vite frontend (planned / in-progress)
├── docs/                        # Documentation root
│   ├── index.md                 # Documentation landing page
│   ├── quickstart.md            # This file
│   ├── structure-map.md         # Repository map
│   ├── developer-onboarding.md  # Deep dive onboarding
│   ├── documentation-overview.md
│   ├── mermaid/                 # System diagrams (all phases)
│   ├── api/                     # API blueprints
│   ├── tests/                   # Testing standards
│   ├── ci/                      # Docs validation rules (future CI/CD)
│   ├── site/                    # Static docs site preparation
│   └── diagrams/                # Drawio / SVG diagram sources
└── .cursor/                     # Cursor Agent configuration
```

---

## 3. Platform Flow — Visual Overview

The diagram below gives you a top–down view of how a request moves through the system
(from the UI to services and back), which is the mental model you'll use everywhere else.

**Quick read:**

UI → API Gateway → Auth + domain services (Wallet, Amy, Challenges, etc.)  
Services → DB / internal APIs / external APIs  
Response → normalized JSON → mapped to front-end view models

For deeper details, see the dedicated Phase 8 page under:

**Mermaid → 08-api-contracts → Phase 8 — API Contracts Overview**

---

## 4. Mermaid Diagram Library (Where All Flows Live)

All core flows are defined as Mermaid diagrams under:

**docs/mermaid/**

**Key folders:**

- **02-architecture/** – High-level platform and service architecture
- **03-platform-flows/** – User flows, dashboards, and navigation
- **06-governance/** – Governance, permissions, and audit flows
- **07-wallet-architecture/** – Wallet and blockchain integration
- **08-api-contracts/** – API-level contracts and request lifecycles
- **09-amy-agent/** – Amy Agent routing, tools, and data flow

Each folder has a `README.md` explaining what the diagrams cover.

When in doubt, open **docs/mermaid/index.md**.  
It is the master index for all diagrams, across all phases.

---

## 5. Planned Code Areas (High-Level)

These code areas are aligned with the documentation and diagrams:

**Backend: backend/**

- Node.js + Express
- Prisma ORM
- MySQL database
- Services: Auth, OGC Wallet, Amy AI Agent, OGC NewFinity Challenge Program, Contribution-Based Mining, Governance

**Frontend: frontend/**

- React + Vite
- Layouts for login, platform dashboards, OGC Wallet dashboard, Amy Agent dashboard
- Shared components: header, sidebar, cards, forms

**Token System: OGCFinity**

- Phase 1: OGCFinity – Genesis Token (Polygon, ERC-20, Fixed Supply) - 500M fixed supply
- Phase 2: OGCFinity – Native Ecosystem Token (OGC Chain, Governance-Based Supply) - Future

**Challenge Program: OGC NewFinity Challenge Program**

- Funded by Innovation & Sustainability Challenge Fund (20% – 100M OGCFinity)
- Three tracks: School Students, Freelancers & Solo Innovators, Startup Teams & Groups

The documentation always remains the reference for how these structures should evolve.

---

## 6. Navigation Shortcuts for Developers

Use this section as your mental GPS for the project:

- **Docs entry point** → `docs/index.md`
- **Quick visual understanding** → `docs/quickstart.md` (this file)
- **Repository shape** → `docs/structure-map.md`
- **Mermaid overview** → `docs/mermaid/index.md`
- **API blueprints** → `docs/api/`
- **Testing standards** → `docs/tests/`
- **RFCs and proposals** → `docs/rfc/`
- **Documentation maintenance & footer** → `docs/maintenance-guide.md`, `docs/footer.md`

If you are stuck or unsure whether something is "official", check:

- `docs/manifest.md` for what is considered canonical
- `docs/changelog.md` for recent documentation updates

---

## 7. Developer Responsibilities

Every developer working on OGC NewFinity is expected to:

**Respect naming rules**

- Mermaid files: `phase-X[.Y]--category--topic.mmd`
- Auto-generated diagrams: `auto--category--topic.mmd`
- Docs: lowercase, hyphen-separated filenames

**Keep diagrams in sync**

- When architecture changes, update the relevant `.mmd` files and any linked diagram images.

**Keep docs in sync with reality**

- If you change behavior, update the related section in `/docs` within the same PR wherever possible.

**Use this guide as your starting point**

- Before opening new folders or inventing new patterns, check whether an equivalent already exists.

---

## 8. Where to Go Next

- **Want a deep onboarding?** → `docs/developer-onboarding.md`
- **Want to understand governance and permissions?** → `docs/mermaid/06-governance/`
- **Want to work on API contracts?** → `docs/mermaid/08-api-contracts/` + `docs/api/`
- **Want to contribute new flows?** → follow the rules in `docs/automation/` and `docs/ci/`

This quickstart is your launchpad.  
Once you're comfortable with the structure above, you're ready to work on real features.

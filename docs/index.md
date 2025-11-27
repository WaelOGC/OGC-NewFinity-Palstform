---
id: index
title: OGC NewFinity Platform — Documentation Hub
sidebar_label: Documentation Hub
---

# OGC NewFinity Platform — Documentation Hub

Welcome to the **OGC NewFinity Platform documentation**.  
This hub is designed for everyone who needs to understand the platform:

- Core team and contributors  
- External developers and architects  
- Advisors, partners, and potential investors  

It gives a **high-level story** of the system, plus deep technical detail when you need it.

---

## 1. What is OGC NewFinity?

OGC NewFinity is a **next-generation, token-powered digital ecosystem** designed to unify AI productivity, blockchain-driven participation, creative empowerment, and enterprise-grade service delivery within the OGC NewFinity Ecosystem.

The platform is built around:

- **OGCFinity Token** – Two-phase token model (Genesis on Polygon, Native on OGC Chain)  
- **OGC NewFinity Challenge Program** – Global innovation initiative funded by Innovation & Sustainability Challenge Fund  
- **Amy AI Agent** – Comprehensive AI tools suite for productivity and creativity  
- **OGC Wallet** – Token management, rewards, and Contribution-Based Mining  
- **Platform Dashboards** – Unified user experience across all ecosystem features  
- **Governance Framework** – Future DAO and community-driven decision-making  

The platform is being developed in phases, with **documentation and diagrams** serving as the source of truth.

---

## 📢 Announcements

- **OGC NewFinity Documentation v2.0 – Release Announcement**  
  → [`docs/public/announcements/ogc-newfinity-documentation-v2.0-release-announcement.md`](./public/announcements/ogc-newfinity-documentation-v2.0-release-announcement.md)

- **OGC NewFinity Documentation v2.0 — Technical Release Notes**  
  → [`docs/public/announcements/ogc-newfinity-v2.0-release-notes.md`](./public/announcements/ogc-newfinity-v2.0-release-notes.md)

---

## 2. System at a Glance

The diagram below shows the platform at a high level: who interacts with it, which core services sit at the center, and how data flows between internal and external systems.

![OGC NewFinity — System Overview](./img/diagrams/system-overview.svg)

**Key domains:**

- **Users & Creators** – work with AI tools, participate in OGC NewFinity Challenge Program, earn OGCFinity rewards  
- **Admins & Operators** – manage governance, moderation, policy, and audits  
- **Core Services** – Auth, OGC Wallet, Amy AI Agent, Challenge Program, Contribution-Based Mining, Governance  
- **Token System** – OGCFinity (Genesis on Polygon, Native on OGC Chain)  
- **Data & Integrations** – internal databases and external AI/payment providers  

For deeper flows, see the **Mermaid diagram library** and **API contracts** sections below.

---

## 3. Who This Documentation Is For

### 🔹 Developers & Engineers

- Need to understand **architecture**, **flows**, and **APIs**  
- Want to see **sequence diagrams**, **data models**, and **service boundaries**  
- Use this repo as the **contract** between frontend, backend, and future services

Start here:

- [`docs/quickstart.md`](./quickstart.md) – Developer Quickstart Guide  
- [`docs/structure-map.md`](./structure-map.md) – Repository map  
- [`docs/mermaid/index.md`](./mermaid/index.md) – Diagram index  

---

### 🔹 Collaborators & Technical Friends

- Want a **visual overview** of how the system works  
- May help refine architecture, security, or data flows  
- Don't need every implementation detail, but want clarity and consistency

Start here:

- **System Overview** (this page)  
- [`docs/developer-onboarding.md`](./developer-onboarding.md) – Deeper context  
- `docs/mermaid/03-platform-flows/` – User and dashboard flows  

---

### 🔹 Advisors, Partners, and Investors

- Need to understand **what is being built**, **why it matters**, and **how it scales**  
- Care about **architecture quality**, **governance**, and **future extensibility**

Recommended reading:

- [`docs/documentation-overview.md`](./documentation-overview.md) – How everything fits together  
- `docs/mermaid/02-architecture/` – Core architecture diagrams  
- `docs/mermaid/07-wallet-architecture/` – Wallet, rewards, and on-chain strategy  
- `docs/rfc/` – Selected RFCs showing how changes are proposed and approved  

This documentation is intentionally structured to show that the platform is **designed, not improvised**.

---

## 4. Start Here — Quick Navigation Cards

### 🧭 Core Orientation

- **Quickstart:** [`docs/quickstart.md`](./quickstart.md)  
  → Fast onboarding for new developers

- **Structure Map:** [`docs/structure-map.md`](./structure-map.md)  
  → One-page view of the repo layout

- **Documentation Overview:** [`docs/documentation-overview.md`](./documentation-overview.md)  
  → What each doc area is responsible for

---

### 🧩 Architecture & Flows

- **Architecture Diagrams:** `docs/mermaid/02-architecture/`  
- **Platform Flows:** `docs/mermaid/03-platform-flows/`  
- **Unified Master Flow:** `docs/mermaid/04-unified-master-flow/`  

These show **how users move through the system** and how services interact.

---

### 💰 OGCFinity Token, Wallet, and On-Chain

- **Token System:** See `public/token/ogcfinity-token-summary.md` for two-phase model  
- **Wallet Architecture:** `docs/mermaid/07-wallet-architecture/`  
- **Wallet & Rewards Data Flow:** see Phase 7 diagrams  
- **Migration Bridge:** Future 1:1 migration from Polygon to OGC Chain  
- **Tokenomics:** See `🪙 OGCFinity Currency — Powering the Future of Purpose-Driven Innovation v2.0.md`  

These documents are especially relevant for discussions around **OGCFinity tokenomics**, **two-phase token model**, and **future OGC Chain integration**.

---

### 🤖 Amy AI Agent & Automation

- **Amy Agent Overview:** `docs/mermaid/09-amy-agent/`  
- **Public Overview:** `public/platform/ai-agent-amy-overview.md`  
- **Tools & Phases:** Phase 9.x diagrams  
- **Routing, credits, and data flow:** sequence diagrams in Phase 9  

This area is central to the platform's **AI-driven differentiation** and integrates with OGCFinity for premium features.

### 🌱 OGC NewFinity Challenge Program

- **Program Overview:** `public/challenge/challenge-program-overview.md`  
- **Tracks & Categories:** `public/challenge/tracks-categories.md`  
- **Judging & Rules:** `public/challenge/judging-and-rules.md`  
- **FAQ:** `public/challenge/challenge-faq.md`  

The Challenge Program is funded by the **Innovation & Sustainability Challenge Fund (20% – 100,000,000 OGCFinity)** and drives real-world utility of OGCFinity.

---

### ⚖ Governance, Permissions, and Compliance

- **Governance Overview:** `docs/mermaid/06-governance/`  
- **Permissions Matrix:** `phase-6.2-...` diagram  
- **Escalation & Moderation:** Phase 6.x diagrams  
- **Audit & Compliance:** Phase 6.4 diagrams  

These show that **rules, escalation paths, and audits** are considered from the start.

---

## 5. How the Docs Are Organized

The documentation is intentionally split into clear areas:

- **Public Documentation (`docs/public/`)**  
  User-facing documentation for OGCFinity, Challenge Program, Platform, and Whitepaper.

- **Mermaid Diagrams (`docs/mermaid/`)**  
  Visual flows for architecture, wallet, governance, APIs, and Amy.

- **API Blueprints (`docs/api/`)**  
  Human-readable contracts for Auth, Wallet, Amy Router, and others.

- **Core Systems (`docs/01-core-systems/`)**  
  Detailed specifications for Challenge Program, Wallet, Token System, and more.

- **Testing & Quality (`docs/tests/`, `docs/ci/`)**  
  How we will keep behavior reliable over time.

- **RFCs (`docs/rfc/`)**  
  Proposals for significant changes, with structure and decision history.

- **Master Development & Business Plan (`docs/00-foundations/01-platform-overview.md`)**  
  Comprehensive strategic and technical blueprint for the entire ecosystem.

---

## 6. Principles Behind the System

A few guiding principles that shape OGC NewFinity:

1. **Architecture First** – diagrams and docs before implementation chaos  
2. **Separation of Concerns** – clear boundaries for Auth, OGC Wallet, Amy AI Agent, Challenge Program, Governance, etc.  
3. **Documented Contracts** – APIs and flows are written down, not only in code  
4. **Governed Growth** – governance and audit are part of the design, not an afterthought  
5. **Two-Phase Token Model** – OGCFinity evolves from Genesis (Polygon) to Native (OGC Chain)  
6. **Purpose-Driven Innovation** – Challenge Program and tokenomics aligned with real-world impact  
7. **Future-ready** – the platform is built to evolve (more tools, dashboards, OGC Chain, and integrations)

---

## 7. Contributing & Reviewing

If you are:

- **Joining the build** → start with `quickstart.md` and `developer-onboarding.md`  
- **Reviewing architecture** → look at `02-architecture`, `07-wallet-architecture`, and `09-amy-agent`  
- **Advising or investing** → combine this page with architecture and wallet sections for a full picture  

As the platform grows, this landing page will remain the **entry point** and will be updated to reflect major milestones.

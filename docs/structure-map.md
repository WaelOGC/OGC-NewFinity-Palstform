---
id: structure-map
title: OGC NewFinity Platform — Project Structure Map
sidebar_label: Repo Structure Map
---

# 🗺️ OGC NewFinity Platform — Project Structure Map

This document provides a high-level map of the OGC NewFinity Platform repository, focusing on architecture, documentation, and system diagrams.

---

## 1. Top-Level Repository Layout

/
├── backend/                     # (Planned) Express + Prisma backend
├── frontend/                    # (Planned) React + Vite frontend
├── docs/                        # Documentation root
│   ├── index.md                 # Documentation landing page
│   ├── structure-map.md         # This file
│   ├── developer-onboarding.md
│   └── mermaid/                 
│       ├── index.md
│       ├── 02-architecture/
│       ├── 03-platform-flows/
│       ├── 04-layouts-and-navigation/
│       ├── 04-unified-master-flow/
│       ├── 05-core-sequences/
│       ├── 06-governance/
│       ├── 07-data-models/
│       ├── 07-wallet-architecture/
│       ├── 08-api-contracts/
│       └── 09-amy-agent/
├── .cursor/
│   └── context/
│       ├── naming-rules.md
│       └── agent-guidelines.md
└── ...                          # Other project files

---

## 2. Docs Overview

docs/index.md — main documentation homepage  
docs/developer-onboarding.md — onboarding guide  
docs/structure-map.md — repository map (this file)  
docs/mermaid/ — all system diagrams

---

## 3. Mermaid Diagram Rules

All files follow:  
phase-X[.Y]--category--topic.mmd

Diagram folders include:  
02-architecture  
03-platform-flows  
04-layouts-and-navigation  
04-unified-master-flow  
05-core-sequences  
06-governance  
07-data-models  
07-wallet-architecture  
08-api-contracts  
09-amy-agent

Each folder contains a README.

---

## 4. Cursor Rules Folder

/.cursor/context contains:  
- naming-rules.md  
- agent-guidelines.md

These enforce project-wide standards.

---

## 5. Future Project Structure

backend/ → APIs, services  
frontend/ → dashboards (platform, wallet, Amy, admin)

Both must follow the architectural diagrams.

---

## 6. How to Use This Map

New developers → docs/developer-onboarding.md  
To explore diagrams → docs/mermaid/index.md  
Naming rules → .cursor/context/naming-rules.md  
Add new docs → follow this structure

Keep this file updated as the project evolves.


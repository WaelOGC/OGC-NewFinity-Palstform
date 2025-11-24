---
id: maintenance-guide
title: OGC NewFinity Platform — Documentation Maintenance Guide
sidebar_label: Maintenance Guide
---

# OGC NewFinity Platform — Documentation Maintenance Guide

This guide explains how to maintain the documentation system over time.  
All contributors must follow these rules to keep the documentation clean, accurate, and useful.

---

## 1. Keep Documentation Up to Date

Whenever you add backend, frontend, or system features:

- Update the related Mermaid diagrams
- Update folder-level README files
- Update docs/mermaid/index.md
- Add a changelog entry in docs/changelog.md
- Ensure naming rules are followed

---

## 2. Maintain Structure Consistency

Do not create new folder structures unless necessary.  
Follow the existing layout:

docs/  
├── mermaid/  
├── quickstart.md  
├── developer-onboarding.md  
├── structure-map.md  
├── documentation-overview.md  
└── shortcuts.md  

---

## 3. Naming Rules (Mandatory)

All Mermaid diagrams MUST follow:

phase-X[.Y]--category--topic.mmd

Never use:

- spaces  
- uppercase letters  
- timestamps  
- inconsistent prefixes  

---

## 4. When Modifying Diagrams

If you modify a diagram:

1. Update its `.mmd` file  
2. Update its folder README  
3. Update the central index file  
4. Add an entry to the changelog  

---

## 5. Documentation Cleanup

Perform cleanup tasks monthly:

- Remove outdated links  
- Fix broken links  
- Verify each README  
- Validate Mermaid diagrams  
- Ensure no duplicate files exist  

---

## 6. Cursor Agent Requirements

All automated documentation, renaming, or diagram creation must follow:

.cursor/context/naming-rules.md  
.cursor/context/agent-guidelines.md  

These rules enforce consistency across the project.

---

## 7. Who Maintains This Documentation?

This documentation system is maintained by the OGC Technologies development team.  
Large changes require approval from the documentation owner.

---

End of guide.

